import { Command } from 'commander';
import ora from 'ora';
import { DummyAPIServer } from './serve-api.js';
import { success, error, info, warn } from '../utils/output.js';

interface ServeAPIOptions {
  port: number;
  host: string;
  name?: string;
  add?: boolean;
}

export function createServeAPICommand(): Command {
  return new Command('serve-api')
    .description('Launch a dummy API server for testing')
    .option('-p, --port <port>', 'Port to serve on', '3001')
    .option('-h, --host <host>', 'Host to bind to', '127.0.0.1')
    .option('-n, --name <name>', 'Name for the mapping (default: auto-generated)')
    .option('--add', 'Automatically add as WildMask mapping')
    .action(async (options: ServeAPIOptions) => {
      const spinner = ora('Starting dummy API server...').start();
      
      try {
        const port = parseInt(options.port.toString(), 10);
        const host = options.host;
        const name = options.name || `api-${port}`;
        
        const apiServer = new DummyAPIServer({
          port,
          host,
          name
        });

        await apiServer.start();

        spinner.succeed('API server started successfully!');
        success(`🌐 API server running at http://${host}:${port}`);
        success(`🏷️  Server name: ${name}`);
        
        info('\n📋 Available endpoints:');
        console.log(`   • http://${host}:${port}/ - Interactive test page`);
        console.log(`   • http://${host}:${port}/health - Health check`);
        console.log(`   • http://${host}:${port}/api/test - Test API endpoint`);
        console.log(`   • http://${host}:${port}/api/users - Mock users data`);
        console.log(`   • http://${host}:${port}/api/echo - Echo endpoint`);
        console.log(`   • http://${host}:${port}/api/status - Server status`);
        
        if (options.add) {
          console.log('\n🔗 Adding to WildMask mappings...');
          await addToWildMask(name, host, port, 'http');
        } else {
          info('\n💡 Tip: Run with --add to automatically add this as a WildMask mapping');
          info(`   wildmask add ${name} --target ${host} --port ${port}`);
        }
        
        info('\n🧪 Test commands:');
        console.log(`   curl http://${host}:${port}/health`);
        console.log(`   curl http://${host}:${port}/api/test`);
        console.log(`   curl -X POST http://${host}:${port}/api/echo -d '{"test":"data"}'`);
        
        info('\n⌨️  Press Ctrl+C to stop the server');

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          info('\n\n🛑 Stopping API server...');
          await apiServer.stop();
          info('👋 API server stopped');
          process.exit(0);
        });

        process.on('SIGTERM', async () => {
          await apiServer.stop();
          process.exit(0);
        });

      } catch (err) {
        spinner.fail('Failed to start API server');
        error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}

async function addToWildMask(name: string, host: string, port: number, protocol: string) {
  try {
    const { spawn } = await import('node:child_process');
    
    const child = spawn('wildmask', [
      'add', name,
      '--target', host,
      '--port', port.toString(),
      '--protocol', protocol
    ], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        success(`✅ Added ${name}.test → ${host}:${port}`);
        info(`🌐 Now accessible via: http://${name}.test`);
      } else {
        warn('Failed to add to WildMask mappings');
      }
    });
  } catch (err) {
    warn(`Failed to add to WildMask: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
