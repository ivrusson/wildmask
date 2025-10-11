#!/usr/bin/env node

import { homedir, platform } from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.wildmask');
const LOGS_DIR = join(CONFIG_DIR, 'logs');

console.log('🎭 WildMask Post-Install Setup\n');

// Create config directory
try {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
    console.log(`✓ Created config directory: ${CONFIG_DIR}`);
  }
  
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
    console.log(`✓ Created logs directory: ${LOGS_DIR}`);
  }
} catch (error) {
  console.error(`⚠ Could not create config directory: ${error.message}`);
}

// Platform-specific info
const os = platform();
console.log(`\n📋 Detected OS: ${os}`);

if (os === 'darwin') {
  console.log('   macOS detected - DNS daemon will use /etc/resolver/');
} else if (os === 'linux') {
  console.log('   Linux detected - DNS daemon will integrate with systemd-resolved');
} else if (os === 'win32') {
  console.log('   Windows detected - DNS daemon will use netsh for configuration');
}

console.log('\n🎉 Installation Complete!\n');

console.log('🚀 Quick Start (First Time Users):');
console.log('   Run the interactive setup wizard:');
console.log('   \x1b[36mwildmask setup\x1b[0m\n');

console.log('   The wizard will guide you through:');
console.log('   • Configuration initialization');
console.log('   • DNS resolver installation (requires sudo)');
console.log('   • Example mapping creation');
console.log('   • Daemon startup');
console.log('   • Verification tests\n');

console.log('📚 Or run manually:');
console.log('   wildmask init');
console.log('   sudo wildmask install');
console.log('   wildmask add api --target 127.0.0.1 --port 3000');
console.log('   wildmask up\n');

console.log('💡 Useful Commands:');
console.log('   wildmask --help            # See all commands');
console.log('   wildmask                   # Launch TUI dashboard');
console.log('   wildmask doctor            # Run diagnostics');
console.log('   wildmask serve-api         # Start test server\n');

console.log('📖 Documentation:');
console.log('   README.md                  # Main documentation');
console.log('   GETTING_STARTED.md         # Quick start guide');
console.log('   INSTALL_DNS.md             # DNS installation guide');
console.log('   COMMANDS_REFERENCE.md      # All commands\n');


