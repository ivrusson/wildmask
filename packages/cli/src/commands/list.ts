import { Command } from 'commander';
import { ConfigManager, MappingManager } from '@wildmask/core';
import { printMappings, error } from '../utils/output.js';

export function createListCommand(): Command {
  return new Command('list')
    .alias('ls')
    .description('List all DNS mappings')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        const mappingManager = new MappingManager(configManager);

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const mappings = mappingManager.list();

        if (options.json) {
          console.log(JSON.stringify(mappings, null, 2));
        } else {
          printMappings(mappings);
        }
      } catch (err) {
        error(`Failed to list mappings: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}


