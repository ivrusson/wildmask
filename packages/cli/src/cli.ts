#!/usr/bin/env node

import { createCLI } from './index.js';
import { launchTUI } from './commands/tui.js';
import { ConfigManager } from '@wildmask/core';

const program = createCLI();

// If no arguments (just 'wildmask'), check if configured
if (process.argv.length === 2) {
  const configManager = new ConfigManager();
  
  if (!configManager.exists()) {
    // First time user - show setup wizard
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🎭 Welcome to WildMask!                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

It looks like this is your first time using WildMask.

Let's get you set up! You have two options:

1️⃣  Quick Setup (Recommended):
   wildmask setup

   This interactive wizard will:
   • Initialize configuration
   • Install DNS resolver (requires sudo)
   • Add example mapping
   • Start the daemon
   • Verify everything works

2️⃣  Manual Setup:
   wildmask init
   sudo wildmask install
   wildmask add api --target 127.0.0.1 --port 3000
   wildmask up

📚 For more help:
   wildmask --help
   wildmask setup --help

`);
    process.exit(0);
  } else {
    // Already configured - launch TUI
    launchTUI();
  }
} else {
  program.parse(process.argv);
}


