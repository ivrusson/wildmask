import { Command } from 'commander';
import { createInitCommand } from './commands/init.js';
import { createSetupCommand } from './commands/setup.js';
import { createAddCommand } from './commands/add.js';
import { createRemoveCommand } from './commands/remove.js';
import { createListCommand } from './commands/list.js';
import { createUpCommand } from './commands/up.js';
import { createDownCommand } from './commands/down.js';
import { createRestartCommand } from './commands/restart.js';
import { createStatusCommand } from './commands/status.js';
import { createCheckCommand } from './commands/check.js';
import { createDoctorCommand } from './commands/doctor.js';
import { createTuiCommand } from './commands/tui.js';
import { createServeCommand } from './commands/serve.js';
import { createServeAPICommand } from './commands/serve-api-command.js';
import { createInstallCommand, createUninstallCommand } from './commands/install.js';
import { createProxyCommand } from './commands/proxy.js';
import { createSmartProxyCommand } from './commands/proxy-smart.js';
import { createConfigCommand } from './commands/config.js';
import { createCompletionCommand } from './commands/completion.js';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('wildmask')
    .description('🎭 Modern CLI + TUI for managing local DNS masks')
    .version('0.1.0');

  // Register commands
  program.addCommand(createSetupCommand());
  program.addCommand(createInitCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createAddCommand());
  program.addCommand(createRemoveCommand());
  program.addCommand(createListCommand());
  program.addCommand(createUpCommand());
  program.addCommand(createDownCommand());
  program.addCommand(createRestartCommand());
  program.addCommand(createStatusCommand());
  program.addCommand(createCheckCommand());
  program.addCommand(createDoctorCommand());
  program.addCommand(createTuiCommand());
  program.addCommand(createServeCommand());
  program.addCommand(createServeAPICommand());
  program.addCommand(createInstallCommand());
  program.addCommand(createUninstallCommand());
  program.addCommand(createProxyCommand());
  program.addCommand(createSmartProxyCommand());
  program.addCommand(createCompletionCommand());

  return program;
}


