import { Command } from 'commander';
import ora from 'ora';
import { createServer, IncomingMessage, ServerResponse, request as httpRequest } from 'node:http';
import { ConfigManager } from '@wildmask/core';
import { success, error, info } from '../utils/output.js';
import type { Mapping } from '@wildmask/types';

interface SmartProxyOptions {
  port: number;
  host: string;
}

export function createSmartProxyCommand(): Command {
  return new Command('smart-proxy')
    .description('Start intelligent reverse proxy that handles both wildcards and direct mappings')
    .option('-p, --port <port>', 'Proxy listening port', '80')
    .option('-h, --host <host>', 'Host to bind to', '127.0.0.1')
    .action(async (options: SmartProxyOptions) => {
      const spinner = ora('Starting smart proxy...').start();

      try {
        const proxyPort = parseInt(options.port.toString(), 10);
        const host = options.host;

        const proxy = new SmartProxy({
          port: proxyPort,
          host
        });

        await proxy.start();

        spinner.succeed('Smart proxy started successfully!');
        success(`🌐 Proxy running at http://${host}:${proxyPort}`);
        
        info('\n📋 How it works:');
        console.log('   • Wildcards: http://3000.api.test → extracts port from subdomain');
        console.log('   • Direct mappings: http://test-api.test → looks up port from config');
        console.log('   • Custom domains: http://backend.myapp → uses configured port');

        info('\n💡 Examples:');
        console.log('   curl http://3002.api.test/health');
        console.log('   curl http://test-api.test/health');
        console.log('   curl http://backend.myapp/api/status');

        info('\n⌨️  Press Ctrl+C to stop the proxy');

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          info('\n\n🛑 Stopping proxy...');
          await proxy.stop();
          info('👋 Proxy stopped');
          process.exit(0);
        });

        process.on('SIGTERM', async () => {
          await proxy.stop();
          process.exit(0);
        });

      } catch (err) {
        spinner.fail('Failed to start proxy');
        error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}

class SmartProxy {
  private server: any;
  private port: number;
  private host: string;
  private configManager: ConfigManager;
  private mappings: Map<string, Mapping> = new Map();

  constructor(options: { port: number; host: string }) {
    this.port = options.port;
    this.host = options.host;
    this.configManager = new ConfigManager();
    this.loadMappings();
  }

  private loadMappings() {
    try {
      const config = this.configManager.load();
      
      // Build mapping lookup table
      for (const mapping of config.mappings) {
        const fqdn = mapping.domain ? `${mapping.host}.${mapping.domain}` : `${mapping.host}.${config.domain}`;
        this.mappings.set(fqdn, mapping);
        
        // Also add without TLD for matching
        const hostPart = mapping.domain ? `${mapping.host}.${mapping.domain}` : mapping.host;
        this.mappings.set(hostPart, mapping);
      }
      
      console.log(`📦 Loaded ${this.mappings.size} mappings`);
    } catch (err) {
      console.warn('⚠️  Could not load mappings, wildcard mode only');
    }
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleRequest(req, res);
      });

      this.server.listen(this.port, this.host, () => {
        resolve();
      });

      this.server.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    const host = req.headers.host || '';
    const url = req.url || '/';

    // Remove port from host if present
    const hostname = host.split(':')[0];
    
    console.log(`📨 Request: ${hostname}${url}`);

    // Strategy 1: Try direct mapping lookup
    const mapping = this.findMapping(hostname);
    if (mapping) {
      console.log(`  ✅ Found mapping: ${mapping.host} → ${mapping.target}:${mapping.port}`);
      this.proxyRequest(req, res, mapping.target, mapping.port, url);
      return;
    }

    // Strategy 2: Try to extract port from subdomain (e.g., 3000.api.test → port 3000)
    const portFromSubdomain = this.extractPortFromSubdomain(hostname);
    if (portFromSubdomain) {
      console.log(`  ✅ Port from subdomain: ${portFromSubdomain}`);
      this.proxyRequest(req, res, '127.0.0.1', portFromSubdomain, url);
      return;
    }

    // Strategy 3: Try wildcard pattern matching (for non-port subdomains)
    const wildcardMatch = this.findWildcardMatch(hostname);
    if (wildcardMatch) {
      // Skip if the wildcard mapping points to the proxy itself (avoid loops)
      if (wildcardMatch.port === this.port) {
        console.log(`  ⚠️  Wildcard match points to proxy itself, trying port extraction...`);
      } else {
        console.log(`  ✅ Wildcard match: ${wildcardMatch.pattern} → ${wildcardMatch.target}:${wildcardMatch.port}`);
        this.proxyRequest(req, res, wildcardMatch.target, wildcardMatch.port, url);
        return;
      }
    }

    // No match found
    console.log(`  ❌ No mapping found for: ${hostname}`);
    this.send404(res, `No mapping found for: ${hostname}`);
  }

  private findMapping(hostname: string): Mapping | null {
    // Try exact match
    const exact = this.mappings.get(hostname);
    if (exact) return exact;

    // Try without TLD
    const withoutTLD = hostname.split('.').slice(0, -1).join('.');
    return this.mappings.get(withoutTLD) || null;
  }

  private findWildcardMatch(hostname: string): { pattern: string; target: string; port: number } | null {
    // Check all mappings for wildcard patterns
    for (const [pattern, mapping] of this.mappings.entries()) {
      if (!pattern.includes('*')) continue;

      // Convert wildcard pattern to regex
      const regexPattern = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
      const regex = new RegExp(regexPattern);

      if (regex.test(hostname)) {
        return {
          pattern,
          target: mapping.target,
          port: mapping.port
        };
      }
    }

    return null;
  }

  private extractPortFromSubdomain(hostname: string): number | null {
    // Try to extract port from first subdomain part
    const parts = hostname.split('.');
    if (parts.length < 2) return null;

    const firstPart = parts[0];
    const port = parseInt(firstPart, 10);

    if (isNaN(port) || port < 1 || port > 65535) {
      return null;
    }

    return port;
  }

  private proxyRequest(
    clientReq: IncomingMessage,
    clientRes: ServerResponse,
    targetHost: string,
    targetPort: number,
    url: string
  ) {
    const options = {
      hostname: targetHost,
      port: targetPort,
      path: url,
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        host: `${targetHost}:${targetPort}`
      }
    };

    const proxyReq = httpRequest(options, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(clientRes);
    });

    proxyReq.on('error', (err) => {
      console.error(`  ❌ Proxy error for ${targetHost}:${targetPort}:`, err.message);
      this.send502(clientRes, `Cannot connect to ${targetHost}:${targetPort}`);
    });

    clientReq.pipe(proxyReq);
  }

  private send404(res: ServerResponse, message: string) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message,
      hint: 'Check your WildMask configuration and ensure the mapping exists'
    }, null, 2));
  }

  private send502(res: ServerResponse, message: string) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message,
      hint: 'Make sure the target service is running'
    }, null, 2));
  }
}
