import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { ConfigSchema, type Config, type PartialConfig } from '@wildmask/types';
import { CONFIG_FILE } from './constants.js';
import { findAvailablePort, getPortAnalysis } from './port-finder.js';

export class ConfigManager {
  private configPath: string;

  constructor(configPath: string = CONFIG_FILE) {
    this.configPath = configPath;
  }

  /**
   * Checks if config file exists
   */
  exists(): boolean {
    return existsSync(this.configPath);
  }

  /**
   * Loads and validates config from file
   */
  load(): Config {
    if (!this.exists()) {
      throw new Error(`Config file not found: ${this.configPath}`);
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      const data = parse(content);
      const config = ConfigSchema.parse(data);
      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load config: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Saves config to file
   */
  save(config: Config): void {
    try {
      // Validate config
      const validated = ConfigSchema.parse(config);

      // Ensure directory exists
      const dir = dirname(this.configPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Write config
      const content = stringify(validated);
      writeFileSync(this.configPath, content, 'utf-8');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save config: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Updates config with partial data
   */
  update(partial: PartialConfig): Config {
    const current = this.load();
    const updated = { ...current, ...partial };
    this.save(updated);
    return updated;
  }

  /**
   * Creates a default config
   */
  createDefault(domain: string = 'test'): Config {
    const defaultConfig: Config = {
      version: '1.0',
      domain,
      resolver: {
        method: 'dns-daemon',
        port: 5353,
        fallback: true,
        upstreamDNS: ['8.8.8.8', '1.1.1.1'],
      },
      mappings: [],
      options: {
        ttl: 60,
        autoStart: false,
        checkUpdates: true,
        telemetry: false,
      },
      logging: {
        level: 'info',
        maxSize: '10mb',
        maxFiles: 5,
      },
    };

    return ConfigSchema.parse(defaultConfig);
  }

  /**
   * Creates a default config with automatic port detection
   */
  async createDefaultWithPortCheck(domain: string = 'test'): Promise<{ config: Config; warnings: string[] }> {
    const warnings: string[] = [];
    
    try {
      // Find an available port
      const availablePort = await findAvailablePort(5353);
      
      const defaultConfig: Config = {
        version: '1.0',
        domain,
        resolver: {
          method: 'dns-daemon',
          port: availablePort,
          fallback: true,
          upstreamDNS: ['8.8.8.8', '1.1.1.1'],
        },
        mappings: [],
        options: {
          ttl: 60,
          autoStart: false,
          checkUpdates: true,
          telemetry: false,
        },
        logging: {
          level: 'info',
          maxSize: '10mb',
          maxFiles: 5,
        },
      };

      if (availablePort !== 5353) {
        warnings.push(`Port 5353 is not available, using port ${availablePort} instead`);
      }

      return { config: ConfigSchema.parse(defaultConfig), warnings };
    } catch (error) {
      warnings.push(`Could not find available port: ${error instanceof Error ? error.message : 'unknown error'}`);
      
      // Fallback to default config
      return { 
        config: this.createDefault(domain), 
        warnings 
      };
    }
  }

  /**
   * Validates and updates port if needed
   */
  async validatePort(config: Config): Promise<{ config: Config; portChanged: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    let portChanged = false;
    let newConfig = { ...config };

    try {
      const analysis = await getPortAnalysis();
      
      // Check if current port is available
      const currentPortResult = analysis.suggestedPorts.find(p => p.port === config.resolver.port);
      
      if (!currentPortResult?.available) {
        if (analysis.recommendedPort) {
          warnings.push(`Port ${config.resolver.port} is not available (${currentPortResult?.reason || 'unknown reason'})`);
          warnings.push(`Switching to port ${analysis.recommendedPort}`);
          
          newConfig.resolver.port = analysis.recommendedPort;
          portChanged = true;
        } else {
          warnings.push(`Port ${config.resolver.port} is not available and no alternative found`);
        }
      }
    } catch (error) {
      warnings.push(`Could not validate port: ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    return { config: newConfig, portChanged, warnings };
  }

  /**
   * Initializes config with default values
   */
  init(domain: string = 'test'): Config {
    if (this.exists()) {
      throw new Error('Config already exists. Use --force to overwrite.');
    }

    const config = this.createDefault(domain);
    this.save(config);
    return config;
  }

  /**
   * Resets config to default
   */
  reset(domain?: string): Config {
    const config = this.createDefault(domain || 'test');
    this.save(config);
    return config;
  }

  /**
   * Validates config file
   */
  validate(): { valid: boolean; errors?: string[] } {
    try {
      this.load();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

export const configManager = new ConfigManager();


