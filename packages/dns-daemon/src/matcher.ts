import micromatch from 'micromatch';
import type { Mapping } from '@wildmask/types';

export class DomainMatcher {
  private mappings: Mapping[];
  private domain: string;

  constructor(mappings: Mapping[], domain: string) {
    this.mappings = mappings.filter((m) => m.enabled);
    this.domain = domain;
  }

  /**
   * Updates the mappings
   */
  updateMappings(mappings: Mapping[]) {
    this.mappings = mappings.filter((m) => m.enabled);
  }

  /**
   * Matches a query hostname against configured mappings
   */
  match(hostname: string): Mapping | null {
    // Remove trailing dot if present
    const cleanHostname = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;

    // Check if hostname ends with our domain
    if (!cleanHostname.endsWith(`.${this.domain}`)) {
      return null;
    }

    // Extract the subdomain part
    const subdomain = cleanHostname.slice(0, -(this.domain.length + 1));

    // Try to find exact match first
    for (const mapping of this.mappings) {
      if (mapping.host === subdomain) {
        return mapping;
      }
    }

    // Try wildcard matches
    for (const mapping of this.mappings) {
      if (mapping.host.includes('*')) {
        // Use micromatch for glob patterns
        if (micromatch.isMatch(subdomain, mapping.host)) {
          return mapping;
        }
      }
    }

    return null;
  }

  /**
   * Gets all mappings that should be resolved
   */
  getAllMappings(): Mapping[] {
    return this.mappings;
  }
}


