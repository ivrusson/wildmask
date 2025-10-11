import { Command } from 'commander';
import ora from 'ora';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { request as httpRequest } from 'node:http';
import { success, error, info, warn } from '../utils/output.js';

interface ProxyOptions {
  port: number;
  host: string;
  pattern?: string;
  add?: boolean;
}

export function createProxyCommand(): Command {
  return new Command('proxy')
    .description('Start a reverse proxy that maps subdomains to ports')
    .option('-p, --port <port>', 'Proxy listening port', '80')
    .option('-h, --host <host>', 'Host to bind to', '127.0.0.1')
    .option('--pattern <pattern>', 'Subdomain pattern (default: {port}.api)', 'api')
    .option('--add', 'Automatically add wildcard mapping to WildMask')
    .action(async (options: ProxyOptions) => {
      const spinner = ora('Starting reverse proxy...').start();

      try {
        const proxyPort = parseInt(options.port.toString(), 10);
        const host = options.host;
        const pattern = options.pattern || 'api';

        const proxy = new ReverseProxy({
          port: proxyPort,
          host,
          pattern
        });

        await proxy.start();

        spinner.succeed('Reverse proxy started successfully!');
        success(`🌐 Proxy running at http://${host}:${proxyPort}`);
        success(`🎯 Pattern: *.${pattern}.test`);

        info('\n📋 How it works:');
        console.log(`   • http://3000.${pattern}.test → http://127.0.0.1:3000`);
        console.log(`   • http://3001.${pattern}.test → http://127.0.0.1:3001`);
        console.log(`   • http://8080.${pattern}.test → http://127.0.0.1:8080`);
        console.log(`   • http://anything.${pattern}.test → http://127.0.0.1:anything (if valid port)`);

        if (options.add) {
          info('\n🔗 Adding wildcard mapping to WildMask...');
          await addWildcardMapping(pattern, host, proxyPort);
        } else {
          info('\n💡 To add wildcard mapping:');
          console.log(`   wildmask add "*.${pattern}" --target ${host} --port ${proxyPort}`);
        }

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

class ReverseProxy {
  private server: any;
  private port: number;
  private host: string;
  private pattern: string;

  constructor(options: { port: number; host: string; pattern: string }) {
    this.port = options.port;
    this.host = options.host;
    this.pattern = options.pattern;
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

    // Parse subdomain to extract port
    // Examples:
    //   3000.api.test → 3000
    //   backend.api.test → try to find mapping
    //   api.test → default behavior
    
    const subdomain = this.extractSubdomain(host);
    const targetPort = this.extractPort(subdomain);

    if (!targetPort) {
      this.send404(res, `Cannot determine target port from: ${host}`);
      return;
    }

    // Proxy the request
    this.proxyRequest(req, res, targetPort, url);
  }

  private extractSubdomain(host: string): string {
    // Remove port from host if present (e.g., "3000.api.test:80" → "3000.api.test")
    const hostname = host.split(':')[0];
    
    // Extract subdomain (e.g., "3000.api.test" → "3000")
    const parts = hostname.split('.');
    
    // If it's just "api.test", no subdomain
    if (parts.length <= 2) {
      return '';
    }
    
    // Return first part as subdomain
    return parts[0];
  }

  private extractPort(subdomain: string): number | null {
    if (!subdomain) {
      return null;
    }

    // Try to parse as number
    const port = parseInt(subdomain, 10);
    
    if (isNaN(port) || port < 1 || port > 65535) {
      return null;
    }

    return port;
  }

  private proxyRequest(
    clientReq: IncomingMessage,
    clientRes: ServerResponse,
    targetPort: number,
    url: string
  ) {
    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: url,
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        host: `127.0.0.1:${targetPort}`
      }
    };

    const proxyReq = httpRequest(options, (proxyRes) => {
      // Forward status code
      clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);

      // Pipe response
      proxyRes.pipe(clientRes);
    });

    // Handle errors
    proxyReq.on('error', (err) => {
      console.error(`Proxy error for port ${targetPort}:`, err.message);
      this.send502(clientRes, `Cannot connect to service on port ${targetPort}`);
    });

    // Pipe request body
    clientReq.pipe(proxyReq);
  }

  private send404(res: ServerResponse, message: string) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message,
      hint: `Use format: {port}.${this.pattern}.test (e.g., 3000.${this.pattern}.test)`
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

async function addWildcardMapping(pattern: string, host: string, port: number) {
  try {
    const { spawn } = await import('node:child_process');
    
    const child = spawn('wildmask', [
      'add', `*.${pattern}`,
      '--target', host,
      '--port', port.toString()
    ], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        success(`✅ Added *.${pattern}.test → ${host}:${port}`);
        info(`🌐 Now accessible via: http://{port}.${pattern}.test`);
      } else {
        warn('Failed to add wildcard mapping');
      }
    });
  } catch (err) {
    warn(`Failed to add mapping: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
