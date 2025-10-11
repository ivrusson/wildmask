import type { Mapping, HealthCheckResult, MappingHealth } from '@wildmask/types';
import { tcpCheck } from './tcp-check.js';
import { httpCheck } from './http-check.js';

export class HealthChecker {
  /**
   * Performs health check for a single mapping
   */
  async check(mapping: Mapping): Promise<HealthCheckResult> {
    // If health check is disabled, return unknown
    if (!mapping.health?.enabled) {
      return {
        status: 'unknown',
        timestamp: new Date(),
        message: 'Health check disabled',
      };
    }

    const { target, port, protocol, health } = mapping;

    try {
      // For HTTP/HTTPS, perform HTTP check
      if ((protocol === 'http' || protocol === 'https') && health.path) {
        const url = `${protocol}://${target}:${port}${health.path}`;
        return await httpCheck({
          url,
          timeout: (health.timeout || 5) * 1000,
        });
      }

      // Fallback to TCP check
      return await tcpCheck({
        host: target,
        port,
        timeout: (health.timeout || 5) * 1000,
      });
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        message: 'Health check failed',
      };
    }
  }

  /**
   * Performs health checks for multiple mappings
   */
  async checkAll(mappings: Mapping[]): Promise<MappingHealth[]> {
    const results = await Promise.all(
      mappings.map(async (mapping) => {
        const result = await this.check(mapping);
        return {
          mappingId: mapping.id,
          host: mapping.host,
          result,
        };
      })
    );

    return results;
  }

  /**
   * Starts periodic health checks
   */
  startMonitoring(
    mappings: Mapping[],
    onResult: (result: MappingHealth) => void
  ): () => void {
    const intervals: NodeJS.Timeout[] = [];

    for (const mapping of mappings) {
      if (!mapping.health?.enabled) continue;

      const intervalMs = (mapping.health.interval || 30) * 1000;
      const interval = setInterval(async () => {
        const result = await this.check(mapping);
        onResult({
          mappingId: mapping.id,
          host: mapping.host,
          result,
        });
      }, intervalMs);

      intervals.push(interval);
    }

    // Return cleanup function
    return () => {
      for (const interval of intervals) {
        clearInterval(interval);
      }
    };
  }
}


