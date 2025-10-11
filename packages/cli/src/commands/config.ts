import { Command } from 'commander';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ConfigManager, CONFIG_FILE } from '@wildmask/core';
import { success, error, info, warn } from '../utils/output.js';

const execAsync = promisify(exec);

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage WildMask configuration');

  // config edit
  config
    .command('edit')
    .description('Edit configuration in $EDITOR')
    .action(async () => {
      try {
        const configManager = new ConfigManager();

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
        
        info(`Opening config in ${editor}...`);
        
        try {
          await execAsync(`${editor} ${CONFIG_FILE}`);
          success('Configuration saved');
          
          // Validate the edited config
          try {
            configManager.load();
            success('✅ Configuration is valid');
          } catch (err) {
            error('⚠️  Configuration has errors. Please fix and try again.');
            console.error(err);
            process.exit(1);
          }
        } catch (err) {
          error(`Failed to open editor: ${err instanceof Error ? err.message : 'Unknown error'}`);
          process.exit(1);
        }
      } catch (err) {
        error(`Failed to edit config: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // config show
  config
    .command('show')
    .description('Display current configuration')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const cfg = configManager.load();

        if (options.json) {
          console.log(JSON.stringify(cfg, null, 2));
        } else {
          console.log('\n🎭 WildMask Configuration\n');
          console.log(`Version: ${cfg.version}`);
          console.log(`Domain: .${cfg.domain}`);
          if (cfg.domains && cfg.domains.length > 0) {
            console.log(`Additional domains: ${cfg.domains.map(d => '.' + d).join(', ')}`);
          }
          console.log(`Resolver: ${cfg.resolver.method} on port ${cfg.resolver.port}`);
          console.log(`Upstream DNS: ${cfg.resolver.upstreamDNS.join(', ')}`);
          console.log(`Mappings: ${cfg.mappings.length} configured`);
          console.log(`Active mappings: ${cfg.mappings.filter(m => m.enabled).length}`);
          console.log(`TTL: ${cfg.options.ttl}s`);
          console.log(`Log level: ${cfg.logging.level}`);
          console.log(`\nConfig file: ${CONFIG_FILE}\n`);
        }
      } catch (err) {
        error(`Failed to show config: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // config reset
  config
    .command('reset')
    .description('Reset configuration to defaults')
    .option('-f, --force', 'Skip confirmation')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();

        if (!options.force) {
          warn('This will reset your configuration to defaults.');
          warn('All mappings will be removed.');
          info('\nUse --force to confirm');
          process.exit(1);
        }

        const { config: defaultConfig, warnings } = await configManager.createDefaultWithPortCheck();
        configManager.save(defaultConfig);

        success('Configuration reset to defaults');
        
        if (warnings.length > 0) {
          warnings.forEach(w => warn(w));
        }

        info(`Domain: .${defaultConfig.domain}`);
        info(`Port: ${defaultConfig.resolver.port}`);
      } catch (err) {
        error(`Failed to reset config: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // config path
  config
    .command('path')
    .description('Show configuration file path')
    .action(() => {
      console.log(CONFIG_FILE);
    });

  // config validate
  config
    .command('validate')
    .description('Validate configuration file')
    .action(async () => {
      try {
        const configManager = new ConfigManager();

        if (!configManager.exists()) {
          error('Configuration not found.');
          process.exit(1);
        }

        const cfg = configManager.load();
        
        success('✅ Configuration is valid');
        info(`Mappings: ${cfg.mappings.length}`);
        info(`Active: ${cfg.mappings.filter(m => m.enabled).length}`);
        info(`Port: ${cfg.resolver.port}`);
      } catch (err) {
        error(`❌ Configuration is invalid: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // config export
  config
    .command('export')
    .description('Export configuration to stdout')
    .option('--file <path>', 'Export to file instead of stdout')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();

        if (!configManager.exists()) {
          error('Configuration not found.');
          process.exit(1);
        }

        const cfg = configManager.load();
        const output = JSON.stringify(cfg, null, 2);

        if (options.file) {
          const { writeFileSync } = await import('node:fs');
          writeFileSync(options.file, output, 'utf-8');
          success(`Configuration exported to ${options.file}`);
        } else {
          console.log(output);
        }
      } catch (err) {
        error(`Failed to export config: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // config import
  config
    .command('import <file>')
    .description('Import configuration from file')
    .option('-f, --force', 'Overwrite existing configuration')
    .action(async (file: string, options) => {
      try {
        const configManager = new ConfigManager();

        if (configManager.exists() && !options.force) {
          error('Configuration already exists. Use --force to overwrite.');
          process.exit(1);
        }

        const { readFileSync } = await import('node:fs');
        const { parse } = await import('yaml');
        
        const content = readFileSync(file, 'utf-8');
        
        // Try to parse as JSON or YAML
        let importedConfig;
        try {
          importedConfig = JSON.parse(content);
        } catch {
          importedConfig = parse(content);
        }

        // Validate and save
        configManager.save(importedConfig);

        success(`Configuration imported from ${file}`);
        info(`Mappings: ${importedConfig.mappings?.length || 0}`);
        info(`Domain: .${importedConfig.domain}`);
      } catch (err) {
        error(`Failed to import config: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return config;
}
