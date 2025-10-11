import { createServer } from 'node:net';

export interface PortCheckResult {
  port: number;
  available: boolean;
  reason?: string;
}

/**
 * Check if a specific port is available
 */
export async function isPortAvailable(port: number, host: string = '0.0.0.0'): Promise<PortCheckResult> {
  return new Promise((resolve) => {
    const server = createServer();
    
    // Set a timeout to avoid hanging
    const timeout = setTimeout(() => {
      server.close();
      resolve({ port, available: false, reason: 'Timeout' });
    }, 1000);
    
    server.listen(port, host, () => {
      clearTimeout(timeout);
      server.close(() => {
        resolve({ port, available: true });
      });
    });
    
    server.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      let reason = 'Unknown error';
      
      switch (error.code) {
        case 'EADDRINUSE':
          reason = 'Port is already in use';
          break;
        case 'EACCES':
          reason = 'Permission denied';
          break;
        case 'EADDRNOTAVAIL':
          reason = 'Address not available';
          break;
        default:
          reason = error.message;
      }
      
      resolve({ port, available: false, reason });
    });
  });
}

/**
 * Find an available port starting from the preferred port
 */
export async function findAvailablePort(
  preferredPort: number = 5353,
  host: string = '0.0.0.0',
  maxAttempts: number = 10
): Promise<number> {
  const startPort = preferredPort;
  
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const result = await isPortAvailable(port, host);
    
    if (result.available) {
      return port;
    }
    
    // Skip well-known ports that are likely to be occupied
    if (port > 1024 && port < 10000) {
      continue;
    }
  }
  
  // Fallback to a random port in the dynamic range
  const randomPort = Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
  const result = await isPortAvailable(randomPort, host);
  
  if (result.available) {
    return randomPort;
  }
  
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

/**
 * Get suggested alternative ports for DNS daemon
 */
export function getSuggestedPorts(): number[] {
  return [
    5353, // Standard mDNS port (often occupied)
    5354, // Alternative mDNS
    5355, // Alternative mDNS
    8080, // Common development port
    8081, // Alternative
    9000, // Alternative
    9001, // Alternative
  ];
}

/**
 * Check multiple ports and return results
 */
export async function checkMultiplePorts(ports: number[], host: string = '0.0.0.0'): Promise<PortCheckResult[]> {
  const results = await Promise.all(
    ports.map(port => isPortAvailable(port, host))
  );
  
  return results;
}

/**
 * Get a detailed port analysis for the system
 */
export async function getPortAnalysis(): Promise<{
  suggestedPorts: PortCheckResult[];
  recommendedPort: number | null;
  conflicts: PortCheckResult[];
}> {
  const suggestedPorts = getSuggestedPorts();
  const results = await checkMultiplePorts(suggestedPorts);
  
  const availablePorts = results.filter(r => r.available);
  const conflicts = results.filter(r => !r.available);
  
  const recommendedPort = availablePorts.length > 0 ? availablePorts[0].port : null;
  
  return {
    suggestedPorts: results,
    recommendedPort,
    conflicts
  };
}
