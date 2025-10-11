import { Command } from 'commander';
import ora from 'ora';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ConfigManager } from '@wildmask/core';
import { DNSServer, DaemonManager } from '@wildmask/dns-daemon';
import { FileLogger } from '@wildmask/core';
import { success, error, info, warn } from '../utils/output.js';

const execAsync = promisify(exec);

export function createSetupCommand(): Command {
  return new Command('setup')
    .description('Interactive setup wizard for first-time installation')
    .option('--skip-resolver', 'Skip DNS resolver installation')
    .option('--skip-proxy', 'Skip smart proxy setup')
    .option('--domain <domain>', 'Domain to use', 'test')
    .action(async (options) => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🎭 Welcome to WildMask Setup!                ║
║                                                            ║
║    Modern CLI + TUI for managing local DNS masks          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

      console.log('This wizard will guide you through the initial setup.\n');

      try {
        // Step 1: Initialize configuration
        await step1_InitConfig(options.domain);

        // Step 2: Install DNS resolver (requires sudo)
        if (!options.skipResolver) {
          await step2_InstallResolver(options.domain);
        }

        // Step 3: Add example mapping
        await step3_AddExampleMapping();

        // Step 4: Start daemon
        await step4_StartDaemon();

        // Step 5: Verify everything works
        await step5_Verify();

        // Step 6: Optional - Start smart proxy
        if (!options.skipProxy) {
          await step6_SmartProxy();
        }

        // Final instructions
        showFinalInstructions();

      } catch (err) {
        error(`\nSetup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.log('\n💡 You can run individual commands manually:');
        console.log('   wildmask init');
        console.log('   sudo wildmask install');
        console.log('   wildmask up');
        process.exit(1);
      }
    });
}

async function step1_InitConfig(domain: string) {
  console.log('📋 Step 1/6: Initialize Configuration\n');
  
  const spinner = ora('Creating configuration...').start();

  try {
    const configManager = new ConfigManager();

    if (configManager.exists()) {
      spinner.info('Configuration already exists');
      const config = configManager.load();
      info(`   Domain: .${config.domain}`);
      info(`   Port: ${config.resolver.port}`);
      info(`   Mappings: ${config.mappings.length}`);
    } else {
      const { config, warnings } = await configManager.createDefaultWithPortCheck(domain);
      configManager.save(config);

      spinner.succeed('Configuration created');
      success(`   Domain: .${config.domain}`);
      success(`   Port: ${config.resolver.port}`);

      if (warnings.length > 0) {
        warnings.forEach(w => warn(`   ${w}`));
      }
    }

    console.log('');
  } catch (err) {
    spinner.fail('Failed to create configuration');
    throw err;
  }
}

async function step2_InstallResolver(domain: string) {
  console.log('📋 Step 2/6: Install DNS Resolver\n');
  
  info('This step requires sudo/admin privileges to configure your system DNS.');
  info('You will be prompted for your password.\n');

  const spinner = ora('Installing DNS resolver...').start();

  try {
    const configManager = new ConfigManager();
    const config = configManager.load();
    const port = config.resolver.port;

    // Check if already installed
    const resolverPath = `/etc/resolver/${domain}`;
    try {
      await execAsync(`test -f ${resolverPath}`);
      spinner.info('DNS resolver already installed');
      
      // Verify it's correct
      const { stdout } = await execAsync(`cat ${resolverPath}`);
      if (stdout.includes(`port ${port}`)) {
        success(`   ${resolverPath} is correctly configured`);
      } else {
        warn(`   ${resolverPath} exists but may need updating`);
        info('   Run: sudo wildmask install');
      }
      console.log('');
      return;
    } catch {
      // Not installed, proceed
    }

    spinner.text = 'Creating resolver configuration (requires sudo)...';

    // Create resolver
    const resolverContent = `nameserver 127.0.0.1\nport ${port}`;
    
    // This will prompt for sudo password
    await execAsync('sudo mkdir -p /etc/resolver');
    await execAsync(`echo "${resolverContent}" | sudo tee ${resolverPath} > /dev/null`);

    // Flush DNS cache
    spinner.text = 'Flushing DNS cache...';
    try {
      await execAsync('sudo dscacheutil -flushcache');
      await execAsync('sudo killall -HUP mDNSResponder');
    } catch {
      // Ignore flush errors
    }

    spinner.succeed('DNS resolver installed');
    success(`   ${resolverPath} created`);
    success(`   *.${domain} will resolve via 127.0.0.1:${port}`);

    console.log('');
  } catch (err) {
    spinner.fail('Failed to install DNS resolver');
    
    if (err instanceof Error && err.message.includes('sudo')) {
      warn('   Sudo access is required for this step');
      info('   You can install manually later with: sudo wildmask install');
    } else {
      throw err;
    }
    
    console.log('');
  }
}

async function step3_AddExampleMapping() {
  console.log('📋 Step 3/6: Add Example Mapping\n');

  const spinner = ora('Adding example mapping...').start();

  try {
    const configManager = new ConfigManager();
    const config = configManager.load();

    // Check if there are already mappings
    if (config.mappings.length > 0) {
      spinner.info('Mappings already exist');
      success(`   ${config.mappings.length} mapping(s) configured`);
      console.log('');
      return;
    }

    // Add example mapping
    const { MappingManager } = await import('@wildmask/core');
    const mappingManager = new MappingManager(configManager);

    mappingManager.add({
      host: 'example',
      target: '127.0.0.1',
      port: 3000,
      protocol: 'http',
      enabled: true,
      health: {
        enabled: true,
        interval: 30,
        timeout: 5,
      },
    });

    spinner.succeed('Example mapping added');
    success(`   example.${config.domain} → 127.0.0.1:3000`);
    info('   You can add more with: wildmask add <host> --target <ip> --port <port>');

    console.log('');
  } catch (err) {
    spinner.fail('Failed to add example mapping');
    throw err;
  }
}

async function step4_StartDaemon() {
  console.log('📋 Step 4/6: Start DNS Daemon\n');

  const spinner = ora('Starting daemon...').start();

  try {
    const configManager = new ConfigManager();
    const daemonManager = new DaemonManager();
    const config = configManager.load();

    // Check if already running
    const status = daemonManager.getStatus();
    if (status.running) {
      spinner.info('Daemon already running');
      success(`   PID: ${status.pid}`);
      success(`   Port: ${config.resolver.port}`);
      console.log('');
      return;
    }

    // Start daemon
    const logger = new FileLogger(
      config.logging.file || '~/.wildmask/logs/daemon.log',
      config.logging.level
    );

    const server = new DNSServer({
      port: config.resolver.port,
      domain: config.domain,
      mappings: config.mappings,
      ttl: config.options.ttl,
      upstreamDNS: config.resolver.upstreamDNS,
      logger,
    });

    await server.start();
    daemonManager.writePid(process.pid);

    spinner.succeed('Daemon started');
    success(`   Listening on port ${config.resolver.port}`);
    success(`   Active mappings: ${config.mappings.filter(m => m.enabled).length}`);

    console.log('');

    // Detach process
    if (process.send) {
      process.disconnect();
    }

  } catch (err) {
    spinner.fail('Failed to start daemon');
    throw err;
  }
}

async function step5_Verify() {
  console.log('📋 Step 5/6: Verify Installation\n');

  const spinner = ora('Running verification tests...').start();

  try {
    const configManager = new ConfigManager();
    const config = configManager.load();

    // Test 1: Config is valid
    spinner.text = 'Checking configuration...';
    configManager.load(); // Will throw if invalid
    success('   ✅ Configuration is valid');

    // Test 2: Daemon is running
    spinner.text = 'Checking daemon...';
    const { DaemonManager } = await import('@wildmask/dns-daemon');
    const daemonManager = new DaemonManager();
    const status = daemonManager.getStatus();
    
    if (status.running) {
      success(`   ✅ Daemon running (PID: ${status.pid})`);
    } else {
      warn('   ⚠️  Daemon not running');
    }

    // Test 3: DNS resolver
    spinner.text = 'Checking DNS resolver...';
    const resolverPath = `/etc/resolver/${config.domain}`;
    try {
      await execAsync(`test -f ${resolverPath}`);
      success(`   ✅ Resolver installed (${resolverPath})`);
    } catch {
      warn(`   ⚠️  Resolver not installed`);
      info('      Run: sudo wildmask install');
    }

    // Test 4: DNS resolution
    spinner.text = 'Testing DNS resolution...';
    try {
      const { stdout } = await execAsync(`dscacheutil -q host -a name example.${config.domain}`);
      if (stdout.includes('127.0.0.1')) {
        success('   ✅ DNS resolution working');
      } else {
        warn('   ⚠️  DNS resolution not working');
      }
    } catch {
      warn('   ⚠️  Could not test DNS resolution');
    }

    spinner.succeed('Verification complete');
    console.log('');

  } catch (err) {
    spinner.fail('Verification failed');
    throw err;
  }
}

async function step6_SmartProxy() {
  console.log('📋 Step 6/6: Smart Proxy (Optional)\n');

  info('The smart proxy allows you to access services without specifying port numbers.');
  info('For example: http://example.test/ instead of http://example.test:3000\n');

  info('⚠️  This step requires sudo to bind to port 80.');
  info('You can skip this and run it manually later with:');
  console.log('   sudo wildmask smart-proxy --port 80\n');

  info('Press Ctrl+C if you want to skip this step...\n');

  // Wait 3 seconds to give user chance to cancel
  await new Promise(resolve => setTimeout(resolve, 3000));

  const spinner = ora('Starting smart proxy on port 80...').start();

  try {
    // Note: This would need to be run in a separate process
    spinner.info('Smart proxy setup');
    info('   To start the proxy manually, run:');
    console.log('   sudo wildmask smart-proxy --port 80');
    console.log('');
    info('   Or use port 8080 without sudo:');
    console.log('   wildmask smart-proxy --port 8080');
    console.log('   Then access: http://example.test:8080/\n');

  } catch (err) {
    spinner.warn('Skipping smart proxy');
    info('   You can set it up later with: sudo wildmask smart-proxy --port 80\n');
  }
}

function showFinalInstructions() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                🎉 Setup Complete!                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

  console.log('✅ WildMask is now installed and ready to use!\n');

  console.log('🚀 Quick Start:\n');
  console.log('   1. Launch the TUI dashboard:');
  console.log('      wildmask\n');
  
  console.log('   2. Add a new mapping:');
  console.log('      wildmask add myapp --target 127.0.0.1 --port 3000\n');
  
  console.log('   3. Start a test server:');
  console.log('      wildmask serve-api --port 3000 --name test --add\n');
  
  console.log('   4. Test it works:');
  console.log('      curl http://test.test:3000/health\n');
  
  console.log('   5. (Optional) Start smart proxy for port-free access:');
  console.log('      sudo wildmask smart-proxy --port 80\n');
  
  console.log('📚 Documentation:\n');
  console.log('   • Quick Start:     wildmask help');
  console.log('   • All commands:    wildmask --help');
  console.log('   • TUI shortcuts:   Press [?] in the TUI');
  console.log('   • Troubleshooting: wildmask doctor\n');

  console.log('💡 Useful Commands:\n');
  console.log('   wildmask list              # View all mappings');
  console.log('   wildmask status            # Check daemon status');
  console.log('   wildmask doctor            # Run diagnostics');
  console.log('   wildmask config show       # View configuration');
  console.log('   wildmask completion zsh    # Shell completions\n');

  console.log('🎯 Examples:\n');
  console.log('   # Wildcard with dynamic port');
  console.log('   wildmask add "*.api" --target 127.0.0.1 --port 8888');
  console.log('   curl http://3000.api.test:8888/\n');
  
  console.log('   # Custom domain');
  console.log('   wildmask add backend --domain local --target 127.0.0.1 --port 4000');
  console.log('   curl http://backend.local:4000/\n');

  info('For detailed guides, check the documentation files in the project directory.\n');

  success('Happy DNS masking! 🎭\n');
}

