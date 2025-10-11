import { Command } from 'commander';
import ora from 'ora';
import { DaemonManager } from '@wildmask/dns-daemon';
import { error, warn } from '../utils/output.js';

export function createDownCommand(): Command {
  return new Command('down')
    .description('Stop the DNS daemon')
    .action(async () => {
      const spinner = ora('Stopping DNS daemon...').start();

      try {
        const daemonManager = new DaemonManager();
        const status = daemonManager.getStatus();

        if (!status.running) {
          spinner.warn();
          warn('Daemon is not running');
          return;
        }

        const stopped = await daemonManager.stop();

        if (stopped) {
          spinner.succeed('DNS daemon stopped successfully');
        } else {
          spinner.fail();
          error('Failed to stop daemon');
          process.exit(1);
        }
      } catch (err) {
        spinner.fail();
        error(`Failed to stop daemon: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}


