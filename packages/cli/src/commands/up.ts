import { Command } from 'commander';
import ora from 'ora';
import { ConfigManager } from '@wildmask/core';
import { DNSServer, DaemonManager } from '@wildmask/dns-daemon';
import { FileLogger } from '@wildmask/core';
import { success, error, warn, info } from '../utils/output.js';

export function createUpCommand(): Command {
  return new Command('up')
    .description('Start the DNS daemon')
    .option('-d, --detach', 'Run in background (daemon mode)', true)
    .action(async (options) => {
      const spinner = ora('Starting DNS daemon...').start();

      try {
        const configManager = new ConfigManager();
        const daemonManager = new DaemonManager();

        if (!configManager.exists()) {
          spinner.fail();
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        // Check if daemon is already running
        const status = daemonManager.getStatus();
        if (status.running) {
          spinner.warn();
          warn(`Daemon is already running (PID: ${status.pid})`);
          return;
        }

        let config = configManager.load();
        
        // Validate port before starting
        spinner.text = 'Validating port configuration...';
        const validation = await configManager.validatePort(config);
        
        if (validation.portChanged) {
          spinner.warn('Port conflict detected');
          validation.warnings.forEach(warning => warn(`⚠️  ${warning}`));
          
          // Save updated config
          configManager.save(validation.config);
          config = validation.config;
          
          info(`Updated configuration to use port ${config.resolver.port}`);
        }

        const logger = new FileLogger(
          config.logging.file || '~/.wildmask/logs/daemon.log',
          config.logging.level
        );

        // Create DNS server
        const server = new DNSServer({
          port: config.resolver.port,
          domain: config.domain,
          mappings: config.mappings,
          ttl: config.options.ttl,
          upstreamDNS: config.resolver.upstreamDNS,
          logger,
        });

        // Start server
        spinner.text = 'Starting DNS server...';
        await server.start();

        // Write PID file
        daemonManager.writePid(process.pid);

        spinner.succeed('DNS daemon started successfully!');
        success(`Listening on port ${config.resolver.port}`);
        success(`Domain: *.${config.domain}`);
        success(`Active mappings: ${config.mappings.filter(m => m.enabled).length}`);

        if (!options.detach) {
          console.log('\nPress Ctrl+C to stop...\n');

          // Handle graceful shutdown
          process.on('SIGINT', async () => {
            console.log('\n\nShutting down...');
            await server.stop();
            daemonManager.removePid();
            process.exit(0);
          });

          process.on('SIGTERM', async () => {
            await server.stop();
            daemonManager.removePid();
            process.exit(0);
          });
        } else {
          // Detach process (this is simplified, real implementation would use proper daemonization)
          success('Daemon is running in the background');
        }
      } catch (err) {
        spinner.fail();
        error(`Failed to start daemon: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}


