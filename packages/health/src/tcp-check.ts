import { connect, Socket } from 'node:net';
import type { HealthCheckResult } from '@wildmask/types';

export interface TcpCheckOptions {
  host: string;
  port: number;
  timeout?: number;
}

export async function tcpCheck(options: TcpCheckOptions): Promise<HealthCheckResult> {
  const { host, port, timeout = 5000 } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const socket: Socket = connect({ host, port, timeout });

    const cleanup = () => {
      socket.destroy();
    };

    socket.on('connect', () => {
      const latency = Date.now() - startTime;
      cleanup();
      resolve({
        status: 'healthy',
        latency,
        timestamp: new Date(),
        message: `TCP connection successful`,
      });
    });

    socket.on('error', (error) => {
      cleanup();
      resolve({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
        message: `TCP connection failed: ${error.message}`,
      });
    });

    socket.on('timeout', () => {
      cleanup();
      resolve({
        status: 'unhealthy',
        error: 'Connection timeout',
        timestamp: new Date(),
        message: `TCP connection timeout after ${timeout}ms`,
      });
    });
  });
}


