import { Command } from 'commander';
import ora, { type Ora } from 'ora';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ConfigManager } from '@wildmask/core';
import { success, error, info, warn } from '../utils/output.js';

const execAsync = promisify(exec);

export function createInstallCommand(): Command {
  return new Command('install')
    .description('Install system DNS resolver configuration')
    .action(async () => {
      const spinner = ora('Installing DNS resolver...').start();

      try {
        const configManager = new ConfigManager();

        if (!configManager.exists()) {
          spinner.fail();
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const config = configManager.load();
        const { domain, resolver } = config;
        const port = resolver.port;

        spinner.text = 'Detecting platform...';
        const platform = process.platform;

        if (platform === 'darwin') {
          await installMacOS(domain, port, spinner);
        } else if (platform === 'linux') {
          await installLinux(domain, port, spinner);
        } else if (platform === 'win32') {
          spinner.fail();
          error('Windows support coming soon. Please configure DNS manually.');
          process.exit(1);
        } else {
          spinner.fail();
          error(`Unsupported platform: ${platform}`);
          process.exit(1);
        }

        spinner.succeed('DNS resolver installed successfully!');
        success(`✅ System configured to resolve *.${domain}`);
        info(`📍 DNS queries for *.${domain} → 127.0.0.1:${port}`);
        
        info('\n📋 Next steps:');
        console.log('  1. Test DNS resolution: dig api.test @127.0.0.1 -p ' + port);
        console.log('  2. Test with curl: curl http://api.test:3000');
        console.log('  3. If issues, run: wildmask doctor');

      } catch (err) {
        spinner.fail();
        error(`Failed to install resolver: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}

async function installMacOS(domain: string, port: number, spinner: Ora) {
  spinner.text = 'Installing macOS resolver...';

  try {
    // Create resolver configuration
    const resolverContent = `nameserver 127.0.0.1\nport ${port}`;
    const resolverPath = `/etc/resolver/${domain}`;

    // Check if resolver already exists
    try {
      await execAsync(`test -f ${resolverPath}`);
      warn(`Resolver already exists at ${resolverPath}`);
      
      // Read existing content
      const { stdout } = await execAsync(`cat ${resolverPath}`);
      if (stdout.includes(`port ${port}`)) {
        info('Resolver is already configured correctly');
        return;
      }
      
      warn('Updating existing resolver configuration...');
    } catch {
      // File doesn't exist, that's fine
    }

    // Create /etc/resolver directory if it doesn't exist
    spinner.text = 'Creating /etc/resolver directory...';
    await execAsync('sudo mkdir -p /etc/resolver');

    // Write resolver configuration
    spinner.text = `Creating resolver configuration for .${domain}...`;
    await execAsync(`echo "${resolverContent}" | sudo tee ${resolverPath} > /dev/null`);

    // Verify installation
    const { stdout } = await execAsync(`cat ${resolverPath}`);
    if (!stdout.includes(`port ${port}`)) {
      throw new Error('Resolver configuration verification failed');
    }

    // Flush DNS cache
    spinner.text = 'Flushing DNS cache...';
    try {
      await execAsync('sudo dscacheutil -flushcache');
      await execAsync('sudo killall -HUP mDNSResponder');
    } catch (err) {
      warn('Could not flush DNS cache, you may need to restart');
    }

    success(`✅ Resolver installed at ${resolverPath}`);

  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('sudo')) {
        error('Permission denied. This command requires sudo access.');
        info('Please run: sudo wildmask install');
      } else {
        throw err;
      }
    }
    throw err;
  }
}

async function installLinux(domain: string, port: number, spinner: Ora) {
  spinner.text = 'Installing Linux resolver...';

  try {
    // Check if systemd-resolved is available
    try {
      await execAsync('systemctl is-active systemd-resolved');
      await installSystemdResolved(domain, port, spinner);
    } catch {
      // Fallback to dnsmasq or direct resolver
      await installDnsmasq(domain, port, spinner);
    }

  } catch (err) {
    throw err;
  }
}

async function installSystemdResolved(domain: string, port: number, spinner: Ora) {
  spinner.text = 'Configuring systemd-resolved...';

  const resolvConf = `[Resolve]
DNS=127.0.0.1:${port}
Domains=~${domain}`;

  const configPath = `/etc/systemd/resolved.conf.d/${domain}.conf`;

  // Create directory
  await execAsync('sudo mkdir -p /etc/systemd/resolved.conf.d');

  // Write configuration
  await execAsync(`echo "${resolvConf}" | sudo tee ${configPath} > /dev/null`);

  // Restart systemd-resolved
  await execAsync('sudo systemctl restart systemd-resolved');

  success(`✅ Resolver installed at ${configPath}`);
}

async function installDnsmasq(domain: string, port: number, spinner: Ora) {
  spinner.text = 'Configuring dnsmasq...';

  // Check if dnsmasq is installed
  try {
    await execAsync('which dnsmasq');
  } catch {
    error('dnsmasq not found. Please install it first:');
    info('  Ubuntu/Debian: sudo apt install dnsmasq');
    info('  Fedora/RHEL: sudo dnf install dnsmasq');
    throw new Error('dnsmasq not installed');
  }

  const dnsmasqConf = `server=/${domain}/127.0.0.1#${port}`;
  const configPath = `/etc/dnsmasq.d/${domain}.conf`;

  // Create directory
  await execAsync('sudo mkdir -p /etc/dnsmasq.d');

  // Write configuration
  await execAsync(`echo "${dnsmasqConf}" | sudo tee ${configPath} > /dev/null`);

  // Restart dnsmasq
  await execAsync('sudo systemctl restart dnsmasq');

  success(`✅ Resolver installed at ${configPath}`);
}

export function createUninstallCommand(): Command {
  return new Command('uninstall')
    .description('Uninstall system DNS resolver configuration')
    .action(async () => {
      const spinner = ora('Uninstalling DNS resolver...').start();

      try {
        const configManager = new ConfigManager();

        if (!configManager.exists()) {
          spinner.fail();
          error('Configuration not found.');
          process.exit(1);
        }

        const config = configManager.load();
        const { domain } = config;

        spinner.text = 'Detecting platform...';
        const platform = process.platform;

        if (platform === 'darwin') {
          await uninstallMacOS(domain, spinner);
        } else if (platform === 'linux') {
          await uninstallLinux(domain, spinner);
        } else {
          spinner.fail();
          error(`Unsupported platform: ${platform}`);
          process.exit(1);
        }

        spinner.succeed('DNS resolver uninstalled successfully!');
        success(`✅ Removed resolver for *.${domain}`);

      } catch (err) {
        spinner.fail();
        error(`Failed to uninstall resolver: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}

async function uninstallMacOS(domain: string, spinner: Ora) {
  spinner.text = 'Removing macOS resolver...';

  const resolverPath = `/etc/resolver/${domain}`;

  try {
    await execAsync(`test -f ${resolverPath}`);
    await execAsync(`sudo rm ${resolverPath}`);
    
    // Flush DNS cache
    try {
      await execAsync('sudo dscacheutil -flushcache');
      await execAsync('sudo killall -HUP mDNSResponder');
    } catch {
      // Ignore cache flush errors
    }

    success(`✅ Removed ${resolverPath}`);
  } catch {
    warn(`Resolver not found at ${resolverPath}`);
  }
}

async function uninstallLinux(domain: string, spinner: Ora) {
  spinner.text = 'Removing Linux resolver...';

  // Try systemd-resolved
  const systemdPath = `/etc/systemd/resolved.conf.d/${domain}.conf`;
  try {
    await execAsync(`test -f ${systemdPath}`);
    await execAsync(`sudo rm ${systemdPath}`);
    await execAsync('sudo systemctl restart systemd-resolved');
    success(`✅ Removed ${systemdPath}`);
    return;
  } catch {
    // Not using systemd-resolved
  }

  // Try dnsmasq
  const dnsmasqPath = `/etc/dnsmasq.d/${domain}.conf`;
  try {
    await execAsync(`test -f ${dnsmasqPath}`);
    await execAsync(`sudo rm ${dnsmasqPath}`);
    await execAsync('sudo systemctl restart dnsmasq');
    success(`✅ Removed ${dnsmasqPath}`);
    return;
  } catch {
    // Not using dnsmasq
  }

  warn('No resolver configuration found');
}
