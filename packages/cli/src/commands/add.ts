import { Command } from 'commander';
import { ConfigManager, MappingManager } from '@wildmask/core';
import type { Mapping } from '@wildmask/types';
import { success, error } from '../utils/output.js';

export function createAddCommand(): Command {
  return new Command('add')
    .description('Add a new DNS mapping')
    .argument('<host>', 'Host pattern (e.g., "api", "*.assets", "api.backend")')
    .requiredOption('-t, --target <ip>', 'Target IP address')
    .requiredOption('-p, --port <port>', 'Target port', parsePort)
    .option('--protocol <protocol>', 'Protocol (http, https, tcp)', 'http')
    .option('-d, --domain <domain>', 'Custom domain (default: use config domain)', undefined)
    .option('--health-path <path>', 'Health check path')
    .option('--health-interval <seconds>', 'Health check interval', parseInterval, 30)
    .option('--no-health', 'Disable health checks')
    .action(async (host: string, options) => {
      try {
        const configManager = new ConfigManager();
        const mappingManager = new MappingManager(configManager);

        if (!configManager.exists()) {
          error('Configuration not found. Run "wildmask init" first.');
          process.exit(1);
        }

        const mapping: Omit<Mapping, 'id'> = {
          host,
          domain: options.domain, // Optional custom domain
          target: options.target,
          port: options.port,
          protocol: options.protocol,
          enabled: true,
        };

        // Add health check if enabled
        if (options.health) {
          mapping.health = {
            enabled: true,
            path: options.healthPath,
            interval: options.healthInterval,
            timeout: 5,
          };
        }

        const newMapping = mappingManager.add(mapping);

        const fullDomain = options.domain ? `${host}.${options.domain}` : host;
        success(`Added mapping: ${fullDomain} → ${options.target}:${options.port}`);
        console.log(`ID: ${newMapping.id}`);
      } catch (err) {
        error(`Failed to add mapping: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}

function parsePort(value: string): number {
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }
  return port;
}

function parseInterval(value: string): number {
  const interval = parseInt(value, 10);
  if (isNaN(interval) || interval < 5) {
    throw new Error('Interval must be at least 5 seconds');
  }
  return interval;
}


