import type { CacheEntry, DNSResponse } from '@wildmask/types';

export class DNSCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Generates cache key from query
   */
  private getCacheKey(name: string, type: string): string {
    return `${name}:${type}`;
  }

  /**
   * Gets a cached response if not expired
   */
  get(name: string, type: string): DNSResponse | null {
    const key = this.getCacheKey(name, type);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000;

    if (age > entry.ttl) {
      // Expired, remove from cache
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.response;
  }

  /**
   * Sets a cached response
   */
  set(name: string, type: string, response: DNSResponse, ttl: number): void {
    const key = this.getCacheKey(name, type);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clears all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Gets cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  /**
   * Removes expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = (now - entry.timestamp) / 1000;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}


