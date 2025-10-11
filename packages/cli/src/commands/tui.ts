import { Command } from 'commander';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export function createTuiCommand(): Command {
  return new Command('tui')
    .description('Launch interactive TUI dashboard')
    .action(async () => {
      launchTUI();
    });
}

export function launchTUI(): void {
  try {
    // Get the path to the TUI package
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const tuiPath = join(__dirname, '../../../tui/dist/index.js');
    
    // Spawn the TUI as a child process
    const child = spawn('node', [tuiPath], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', (error) => {
      console.error('Failed to launch TUI:', error.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } catch (error) {
    console.error('Failed to launch TUI:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

