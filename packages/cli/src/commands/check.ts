import { Command } from 'commander';
import { ConfigManager, MappingManager } from '@wildmask/core';
import { HealthChecker } from '@wildmask/health';
import { success, error, warn } from '../utils/output.js';
import chalk from 'chalk';

export function createCheckCommand(): Command {
  return new Command('check')
    .description('Check connectivity to a mapping')
    .argument('<host>', 'Host to check (e.g., api.test)')
    .action(async (host: string) => {
      try {
        const configManager = new ConfigManager();
        const mappingManager = new MappingManager(configManager);

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const config = configManager.load();
        
        // Extract subdomain from full hostname
        const domain = config.domain;
        if (!host.endsWith(`.${domain}`)) {
          error(`Host must end with .${domain}`);
          process.exit(1);
        }

        const subdomain = host.slice(0, -(domain.length + 1));
        const mappings = mappingManager.findByHost(subdomain);

        if (mappings.length === 0) {
          error(`No mapping found for: ${host}`);
          process.exit(1);
        }

        const mapping = mappings[0];
        console.log(chalk.bold(`\nChecking ${host}...\n`));

        const checker = new HealthChecker();
        const result = await checker.check(mapping);

        console.log('Target:', `${mapping.target}:${mapping.port}`);
        console.log('Status:', getStatusIcon(result.status), result.status.toUpperCase());
        
        if (result.latency) {
          console.log('Latency:', `${result.latency}ms`);
        }

        if (result.message) {
          console.log('Message:', result.message);
        }

        if (result.error) {
          error(`Error: ${result.error}`);
          process.exit(1);
        }

        if (result.status === 'healthy') {
          success('\nConnection successful!');
        } else if (result.status === 'degraded') {
          warn('\nConnection degraded');
        } else {
          error('\nConnection failed');
          process.exit(1);
        }
      } catch (err) {
        error(`Check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy':
      return chalk.green('●');
    case 'degraded':
      return chalk.yellow('●');
    case 'unhealthy':
      return chalk.red('●');
    default:
      return chalk.gray('○');
  }
}


