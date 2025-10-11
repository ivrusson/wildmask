# 🛠️ WildMask Scripts

Utility scripts for installation, setup, and maintenance.

---

## 📦 Installation Scripts (For package distribution)

### `postinstall.js`
**When it runs**: Automatically after `pnpm install` or npm install  
**What it does**:
- Creates `~/.wildmask/` directory
- Creates `~/.wildmask/logs/` directory
- Shows welcome message with setup instructions

**Usage**: Runs automatically, no manual execution needed.

### `install-daemon.sh` (macOS/Linux)
**Purpose**: Install WildMask daemon as system service  
**Usage**: 
```bash
sudo ./scripts/install-daemon.sh
```

**What it does**:
- Creates launchd plist (macOS) or systemd service (Linux)
- Configures auto-start on boot
- Sets up proper permissions

### `uninstall-daemon.sh` (macOS/Linux)
**Purpose**: Uninstall daemon system service  
**Usage**:
```bash
sudo ./scripts/uninstall-daemon.sh
```

### `install-daemon.ps1` (Windows)
**Purpose**: Install WildMask daemon as Windows service  
**Usage**:
```powershell
.\scripts\install-daemon.ps1
```

### `uninstall-daemon.ps1` (Windows)
**Purpose**: Uninstall Windows service  
**Usage**:
```powershell
.\scripts\uninstall-daemon.ps1
```

---

## 🚀 User Utility Scripts

### `quick-start.sh`
**Purpose**: Automated setup for development/testing  
**Usage**:
```bash
./scripts/quick-start.sh
```

**What it does**:
- Verifies configuration
- Checks DNS resolver
- Starts daemon
- Shows status and mappings
- Provides next steps

**When to use**: After cloning the repo or resetting your setup

### `validate-installation.sh`
**Purpose**: Comprehensive system validation  
**Usage**:
```bash
./scripts/validate-installation.sh
```

**What it does**:
- Checks if CLI/TUI are compiled
- Validates configuration
- Checks DNS resolver installation
- Verifies daemon status
- Tests DNS resolution
- Tests connectivity
- **Runs 13 automated checks**

**When to use**: 
- After installation to verify everything works
- When troubleshooting issues
- Before deploying to production

### `start-smart-proxy.sh`
**Purpose**: Start smart proxy on port 80  
**Usage**:
```bash
./scripts/start-smart-proxy.sh
```

**What it does**:
- Kills any existing proxy
- Starts smart-proxy on port 80 with sudo
- Shows access examples
- Provides stop instructions

**When to use**: When you want port-free access to services

---

## 📋 Which Script to Use?

### First Time Setup
```bash
# 1. Install dependencies
pnpm install  # Runs postinstall.js automatically

# 2. Build
pnpm build

# 3. Run setup wizard (recommended)
wildmask setup

# OR run quick-start script
./scripts/quick-start.sh
```

### Validation
```bash
# Verify everything works
./scripts/validate-installation.sh
```

### Daily Use
```bash
# Start smart proxy
./scripts/start-smart-proxy.sh

# Or use the CLI directly
wildmask up
wildmask smart-proxy --port 80
```

### System Integration (Optional)
```bash
# Auto-start daemon on boot
sudo ./scripts/install-daemon.sh

# Remove auto-start
sudo ./scripts/uninstall-daemon.sh
```

---

## 🔧 Script Permissions

All scripts need execute permissions:

```bash
chmod +x scripts/*.sh
```

This is already done in the repository, but if you clone fresh you might need to run this.

---

## 💡 Advanced Usage

### Custom Port in Quick Start
Edit `quick-start.sh` and change the port if needed (default uses config port).

### Custom Domain in Scripts
Scripts use the domain from your config file (`~/.wildmask/config.yaml`).

### Logging
- `quick-start.sh` - Logs to stdout
- `start-smart-proxy.sh` - Logs to `/tmp/smart-proxy-80.log`
- `validate-installation.sh` - Logs to stdout

---

## 🐛 Troubleshooting

### "Permission denied" when running script
```bash
chmod +x scripts/script-name.sh
```

### "sudo: command not found" (Windows)
Use PowerShell scripts (`.ps1`) instead of bash scripts (`.sh`).

### Script fails with error
Check the logs or run with verbose output:
```bash
bash -x ./scripts/script-name.sh
```

---

## 📚 Related Documentation

- **[Installation Guide](../docs/installation.md)** - Complete installation guide
- **[Getting Started](../docs/getting-started.md)** - First steps
- **[Commands Reference](../docs/commands-reference.md)** - All CLI commands

---

**Need help?** Run `wildmask doctor` or check the main documentation.
