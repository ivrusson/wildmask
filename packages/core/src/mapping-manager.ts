import { randomBytes } from 'node:crypto';
import type { Mapping } from '@wildmask/types';
import { ConfigManager } from './config-manager.js';

export class MappingManager {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Generates a unique ID for a mapping
   */
  private generateId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Gets all mappings
   */
  list(): Mapping[] {
    const config = this.configManager.load();
    return config.mappings;
  }

  /**
   * Gets a mapping by ID
   */
  get(id: string): Mapping | undefined {
    const mappings = this.list();
    return mappings.find((m) => m.id === id);
  }

  /**
   * Finds mappings by host pattern
   */
  findByHost(host: string): Mapping[] {
    const mappings = this.list();
    return mappings.filter((m) => m.host === host);
  }

  /**
   * Adds a new mapping
   */
  add(mapping: Omit<Mapping, 'id'>): Mapping {
    const config = this.configManager.load();

    // Check for duplicates
    const existing = config.mappings.find((m) => m.host === mapping.host);
    if (existing) {
      throw new Error(`Mapping for host "${mapping.host}" already exists`);
    }

    const newMapping: Mapping = {
      id: this.generateId(),
      ...mapping,
    };

    config.mappings.push(newMapping);
    this.configManager.save(config);

    return newMapping;
  }

  /**
   * Updates an existing mapping
   */
  update(id: string, updates: Partial<Omit<Mapping, 'id'>>): Mapping {
    const config = this.configManager.load();
    const index = config.mappings.findIndex((m) => m.id === id);

    if (index === -1) {
      throw new Error(`Mapping with id "${id}" not found`);
    }

    // Check for duplicate host if host is being changed
    if (updates.host && updates.host !== config.mappings[index].host) {
      const duplicate = config.mappings.find(
        (m) => m.host === updates.host && m.id !== id
      );
      if (duplicate) {
        throw new Error(`Mapping for host "${updates.host}" already exists`);
      }
    }

    config.mappings[index] = {
      ...config.mappings[index],
      ...updates,
    };

    this.configManager.save(config);
    return config.mappings[index];
  }

  /**
   * Removes a mapping by ID
   */
  remove(id: string): boolean {
    const config = this.configManager.load();
    const initialLength = config.mappings.length;

    config.mappings = config.mappings.filter((m) => m.id !== id);

    if (config.mappings.length === initialLength) {
      return false; // No mapping was removed
    }

    this.configManager.save(config);
    return true;
  }

  /**
   * Removes mappings by host pattern
   */
  removeByHost(host: string): number {
    const config = this.configManager.load();
    const initialLength = config.mappings.length;

    config.mappings = config.mappings.filter((m) => m.host !== host);

    const removed = initialLength - config.mappings.length;
    if (removed > 0) {
      this.configManager.save(config);
    }

    return removed;
  }

  /**
   * Clears all mappings
   */
  clear(): void {
    const config = this.configManager.load();
    config.mappings = [];
    this.configManager.save(config);
  }

  /**
   * Enables or disables a mapping
   */
  setEnabled(id: string, enabled: boolean): Mapping {
    return this.update(id, { enabled });
  }

  /**
   * Gets enabled mappings only
   */
  getEnabled(): Mapping[] {
    return this.list().filter((m) => m.enabled);
  }

  /**
   * Exports mappings to JSON
   */
  export(): string {
    const mappings = this.list();
    return JSON.stringify(mappings, null, 2);
  }

  /**
   * Imports mappings from JSON
   */
  import(json: string, merge: boolean = false): Mapping[] {
    const imported = JSON.parse(json) as Mapping[];

    if (!merge) {
      this.clear();
    }

    const added: Mapping[] = [];
    for (const mapping of imported) {
      try {
        // Remove id to generate new one
        const { id, ...rest } = mapping;
        const newMapping = this.add(rest);
        added.push(newMapping);
      } catch (error) {
        // Skip duplicates
        console.warn(`Skipping duplicate mapping: ${mapping.host}`);
      }
    }

    return added;
  }
}


