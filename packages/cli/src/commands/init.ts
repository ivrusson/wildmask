import { Command } from 'commander';
import ora from 'ora';
import { ConfigManager } from '@wildmask/core';
import { success, error, info, warn } from '../utils/output.js';

export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize WildMask configuration')
    .option('-d, --domain <domain>', 'Domain TLD to use', 'test')
    .option('-f, --force', 'Overwrite existing configuration')
    .action(async (options) => {
      const spinner = ora('Initializing WildMask...').start();

      try {
        const configManager = new ConfigManager();

        // Check if config already exists
        if (configManager.exists() && !options.force) {
          spinner.fail();
          error('Configuration already exists. Use --force to overwrite.');
          info('Config location: ~/.wildmask/config.yaml');
          process.exit(1);
        }

        // Create default config with port detection
        spinner.text = 'Detecting available ports...';
        const { config, warnings } = await configManager.createDefaultWithPortCheck(options.domain);
        
        // Show warnings if any
        if (warnings.length > 0) {
          spinner.warn('Port conflicts detected');
          warnings.forEach(warning => warn(`⚠️  ${warning}`));
        }
        
        configManager.save(config);

            spinner.succeed('Configuration initialized successfully!');
            success(`Domain: .${config.domain}`);
            success(`Resolver: ${config.resolver.method} on port ${config.resolver.port}`);
            
            if (warnings.length > 0) {
              info('\nNote: Port was automatically adjusted due to conflicts');
            }
            
            info('\n💡 First time using WildMask?');
            console.log('   Run the complete setup wizard:');
            console.log('   wildmask setup\n');
            
            info('Or continue manually:');
            console.log('  1. Install resolver: sudo wildmask install');
            console.log('  2. Add a mapping: wildmask add api --target 127.0.0.1 --port 3000');
            console.log('  3. Start daemon: wildmask up');
            console.log('  4. Launch TUI: wildmask\n');
      } catch (err) {
        spinner.fail();
        error(`Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}


