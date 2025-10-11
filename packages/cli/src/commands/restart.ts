import { Command } from 'commander';
import ora from 'ora';
import { DaemonManager } from '@wildmask/dns-daemon';
import { ConfigManager } from '@wildmask/core';
import { DNSServer } from '@wildmask/dns-daemon';
import { FileLogger } from '@wildmask/core';
import { success, error } from '../utils/output.js';

export function createRestartCommand(): Command {
  return new Command('restart')
    .description('Restart the DNS daemon')
    .action(async () => {
      const spinner = ora('Restarting DNS daemon...').start();

      try {
        const configManager = new ConfigManager();
        const daemonManager = new DaemonManager();

        if (!configManager.exists()) {
          spinner.fail();
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        // Stop daemon if running
        spinner.text = 'Stopping daemon...';
        try {
          await daemonManager.stop();
        } catch {
          // Daemon might not be running, that's OK
        }

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Validate port
        spinner.text = 'Validating port configuration...';
        let config = configManager.load();
        const validation = await configManager.validatePort(config);
        
        if (validation.portChanged) {
          configManager.save(validation.config);
          config = validation.config;
        }

        // Start daemon
        spinner.text = 'Starting daemon...';
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

        spinner.succeed('DNS daemon restarted successfully!');
        success(`Listening on port ${config.resolver.port}`);
        success(`Active mappings: ${config.mappings.filter(m => m.enabled).length}`);

      } catch (err) {
        spinner.fail();
        error(`Failed to restart daemon: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}

