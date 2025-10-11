import { Command } from 'commander';
import { ConfigManager, MappingManager } from '@wildmask/core';
import { success, error } from '../utils/output.js';

export function createRemoveCommand(): Command {
  return new Command('remove')
    .alias('rm')
    .description('Remove a DNS mapping')
    .argument('<id-or-host>', 'Mapping ID or host pattern')
    .action(async (idOrHost: string) => {
      try {
        const configManager = new ConfigManager();
        const mappingManager = new MappingManager(configManager);

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        // Try to remove by ID first
        let removed = mappingManager.remove(idOrHost);

        // If not found by ID, try by host
        if (!removed) {
          const count = mappingManager.removeByHost(idOrHost);
          if (count > 0) {
            success(`Removed ${count} mapping(s) for host: ${idOrHost}`);
            return;
          }
        }

        if (removed) {
          success(`Removed mapping: ${idOrHost}`);
        } else {
          error(`Mapping not found: ${idOrHost}`);
          process.exit(1);
        }
      } catch (err) {
        error(`Failed to remove mapping: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}


