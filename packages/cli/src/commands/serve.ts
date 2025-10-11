import { Command } from 'commander';
import ora from 'ora';
import { spawn } from 'node:child_process';
import { success, error, info, warn } from '../utils/output.js';

interface ServeOptions {
  port: number;
  host: string;
  dir?: string;
  name?: string;
  add?: boolean;
  protocol: 'http' | 'https';
}

export function createServeCommand(): Command {
  return new Command('serve')
    .description('Launch a dummy HTTP server for testing')
    .option('-p, --port <port>', 'Port to serve on', '3000')
    .option('-h, --host <host>', 'Host to bind to', '127.0.0.1')
    .option('-d, --dir <directory>', 'Directory to serve (default: current directory)')
    .option('-n, --name <name>', 'Name for the mapping (default: auto-generated)')
    .option('--add', 'Automatically add as WildMask mapping')
    .option('--protocol <protocol>', 'Protocol to use', 'http')
    .action(async (options: ServeOptions) => {
      const spinner = ora('Starting dummy server...').start();
      
      try {
        const port = parseInt(options.port.toString(), 10);
        const host = options.host;
        const directory = options.dir || process.cwd();
        const protocol = options.protocol;
        
        // Generate a name if not provided
        let serverName = options.name;
        if (!serverName) {
          // Try to get a meaningful name from the directory
          const dirName = directory.split('/').pop() || 'server';
          serverName = dirName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
          
          // Make sure it's not empty
          if (!serverName || serverName === '-') {
            serverName = 'dummy-server';
          }
        }

        // Note: HTML content would be created here if needed
        
        // Start the server
        const serverArgs = [
          directory,
          '-p', port.toString(),
          '-l', host,
          '-s', // Single Page Application mode
          '--no-clipboard', // Don't try to copy to clipboard
          '--no-open' // Don't open browser automatically
        ];

        spinner.text = `Starting server on ${protocol}://${host}:${port}`;
        
        const serverProcess = spawn('npx', ['serve', ...serverArgs], {
          stdio: 'pipe',
          cwd: directory
        });

        // Handle server output
        serverProcess.stdout?.on('data', (data) => {
          const output = data.toString().trim();
          if (output.includes('Local:')) {
            spinner.succeed(`Server started successfully!`);
            success(`🌐 Server running at ${protocol}://${host}:${port}`);
            success(`📁 Serving: ${directory}`);
            success(`🏷️  Server name: ${serverName}`);
            
            console.log('\n' + output);
            
            if (options.add) {
              console.log('\n🔗 Adding to WildMask mappings...');
              addToWildMask(serverName, host, port, protocol);
            } else {
              info('\n💡 Tip: Run with --add to automatically add this as a WildMask mapping');
              info(`   wildmask add ${serverName} --target ${host} --port ${port} --protocol ${protocol}`);
            }
            
            info('\n📋 Available endpoints:');
            console.log(`   • ${protocol}://${host}:${port}/ - Main page`);
            console.log(`   • ${protocol}://${host}:${port}/api/test - Test API endpoint`);
            console.log(`   • ${protocol}://${host}:${port}/health - Health check`);
            
            info('\n⌨️  Press Ctrl+C to stop the server');
          }
        });

        serverProcess.stderr?.on('data', (data) => {
          const error = data.toString().trim();
          if (error && !error.includes('Warning')) {
            warn(`Server warning: ${error}`);
          }
        });

        serverProcess.on('error', (err) => {
          spinner.fail('Failed to start server');
          error(`Error: ${err.message}`);
          process.exit(1);
        });

        serverProcess.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            spinner.fail('Server stopped unexpectedly');
            error(`Exit code: ${code}`);
          } else {
            info('\n👋 Server stopped');
          }
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => {
          info('\n\n🛑 Stopping server...');
          serverProcess.kill('SIGTERM');
          process.exit(0);
        });

        process.on('SIGTERM', () => {
          serverProcess.kill('SIGTERM');
          process.exit(0);
        });

      } catch (err) {
        spinner.fail('Failed to start server');
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
        info(`🌐 Now accessible via: ${protocol}://${name}.test`);
      } else {
        warn('Failed to add to WildMask mappings');
      }
    });
  } catch (err) {
    warn(`Failed to add to WildMask: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
