import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { HealthCheckResult } from '@wildmask/types';

export interface HttpCheckOptions {
  url: string;
  method?: string;
  timeout?: number;
  expectedStatus?: number;
}

export async function httpCheck(options: HttpCheckOptions): Promise<HealthCheckResult> {
  const { url, method = 'GET', timeout = 5000, expectedStatus = 200 } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const request = isHttps ? httpsRequest : httpRequest;

    const req = request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method,
        timeout,
      },
      (res) => {
        const latency = Date.now() - startTime;
        const statusCode = res.statusCode || 0;

        // Consume response data to free up memory
        res.resume();

        if (statusCode === expectedStatus) {
          resolve({
            status: 'healthy',
            latency,
            timestamp: new Date(),
            message: `HTTP ${statusCode} OK`,
          });
        } else if (statusCode >= 200 && statusCode < 300) {
          resolve({
            status: 'healthy',
            latency,
            timestamp: new Date(),
            message: `HTTP ${statusCode} OK (expected ${expectedStatus})`,
          });
        } else if (statusCode >= 500) {
          resolve({
            status: 'unhealthy',
            latency,
            timestamp: new Date(),
            message: `HTTP ${statusCode} Server Error`,
          });
        } else {
          resolve({
            status: 'degraded',
            latency,
            timestamp: new Date(),
            message: `HTTP ${statusCode}`,
          });
        }
      }
    );

    req.on('error', (error) => {
      resolve({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
        message: `HTTP request failed: ${error.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'unhealthy',
        error: 'Request timeout',
        timestamp: new Date(),
        message: `HTTP request timeout after ${timeout}ms`,
      });
    });

    req.end();
  });
}


