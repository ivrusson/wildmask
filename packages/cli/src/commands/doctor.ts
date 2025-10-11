import { Command } from 'commander';
import { ConfigManager, DAEMON_PID_FILE, CONFIG_FILE, getPortAnalysis } from '@wildmask/core';
import { Diagnostics } from '@wildmask/health';
import { printDiagnostics, error, success, info, warn } from '../utils/output.js';

export function createDoctorCommand(): Command {
  return new Command('doctor')
    .description('Run system diagnostics')
    .option('--fix', 'Attempt to fix issues automatically')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const config = configManager.load();
        const diagnostics = new Diagnostics();

        // Enhanced port analysis
        console.log('🔍 Analyzing port availability...');
        const portAnalysis = await getPortAnalysis();
        
        console.log('\n📊 Port Analysis:');
        portAnalysis.suggestedPorts.forEach(result => {
          const icon = result.available ? '✅' : '❌';
          const status = result.available ? 'Available' : `Occupied (${result.reason})`;
          console.log(`   ${icon} Port ${result.port}: ${status}`);
        });

        if (portAnalysis.recommendedPort && portAnalysis.recommendedPort !== config.resolver.port) {
          warn(`\n⚠️  Current port ${config.resolver.port} is not available`);
          info(`💡 Recommended port: ${portAnalysis.recommendedPort}`);
          
          if (options.fix) {
            console.log('\n🔧 Auto-fixing port configuration...');
            const updatedConfig = { ...config, resolver: { ...config.resolver, port: portAnalysis.recommendedPort } };
            configManager.save(updatedConfig);
            success(`Updated configuration to use port ${portAnalysis.recommendedPort}`);
          }
        }

        console.log('\n🩺 Running system diagnostics...');
        const report = await diagnostics.runAll({
          pidFile: DAEMON_PID_FILE,
          port: config.resolver.port,
          domain: config.domain,
          configPath: CONFIG_FILE,
        });

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          printDiagnostics(report);
        }

        // Exit with error code if there are failures
        if (report.summary.failed > 0) {
          process.exit(1);
        }
      } catch (err) {
        error(`Diagnostics failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}


