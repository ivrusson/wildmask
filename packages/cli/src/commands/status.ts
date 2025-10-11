import { Command } from 'commander';
import { ConfigManager } from '@wildmask/core';
import { DaemonManager } from '@wildmask/dns-daemon';
import { printStatus, error } from '../utils/output.js';

export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show daemon status')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        const daemonManager = new DaemonManager();

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const config = configManager.load();
        const status = daemonManager.getStatus();
        
        // Add config info to status
        const fullStatus = {
          ...status,
          port: config.resolver.port,
        };

        if (options.json) {
          console.log(JSON.stringify(fullStatus, null, 2));
        } else {
          printStatus(fullStatus);
        }
      } catch (err) {
        error(`Failed to get status: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}


