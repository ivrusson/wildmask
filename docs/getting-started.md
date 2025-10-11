# 🚀 Getting Started with WildMask

## ⚡ Absolute Fastest Way

```bash
wildmask setup
```

The interactive wizard handles everything! You'll be prompted for sudo when needed.

---

## Quick Start Guide

Congratulations! WildMask has been set up and is ready to use. Follow these steps to get started.

## Installation

First, install dependencies and build the project:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Development

For development with hot reload:

```bash
# Start development mode (watches for changes)
pnpm dev
```

## Testing Locally

Link the CLI globally to test it:

```bash
# Link globally
pnpm link --global

# Verify installation
wildmask --version
```

## First Run

### 1. Initialize Configuration

```bash
wildmask init --domain test
```

This will create `~/.wildmask/config.yaml` with default settings.

### 2. Add Your First Mapping

```bash
wildmask add api --target 127.0.0.1 --port 3000
```

### 3. Install System Resolver (Requires sudo)

On **macOS/Linux**:
```bash
sudo bash scripts/install-daemon.sh test 5353
```

On **Windows** (Run as Administrator):
```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-daemon.ps1 -Domain test -Port 5353
```

This configures your system to use WildMask for `.test` domains.

### 4. Start the DNS Daemon

```bash
wildmask up
```

### 5. Verify It Works

```bash
# Check daemon status
wildmask status

# Check if api.test resolves
wildmask check api.test

# Run diagnostics
wildmask doctor
```

### 6. Launch the TUI

The TUI (Terminal User Interface) launches by default when you run `wildmask` without arguments:

```bash
# Launch TUI (default behavior)
wildmask

# Or use explicit command
wildmask tui
```

Use these keyboard shortcuts:
- `n` - Add new mapping
- `e` - Edit selected mapping
- `d` - Delete selected mapping
- `r` - Refresh status
- `l` - View logs
- `ctrl+d` - Run diagnostics
- `q` - Quit

## Example Workflow

Here's a complete example for a full-stack app:

```bash
# Initialize
wildmask init --domain test

# Add backend API
wildmask add api --target 127.0.0.1 --port 3000 \
  --health-path /health --health-interval 30

# Add frontend
wildmask add app --target 127.0.0.1 --port 5173

# Add database proxy
wildmask add db --target 127.0.0.1 --port 5432

# Add CDN with wildcard
wildmask add "*.cdn" --target 127.0.0.1 --port 8080

# Start daemon
wildmask up

# Check status
wildmask list

# Now you can access:
# - http://api.test:3000
# - http://app.test:5173
# - http://db.test:5432
# - http://img.cdn.test:8080
# - http://static.cdn.test:8080
```

## Testing Without System Installation

If you don't want to install the system resolver yet, you can test DNS resolution manually:

```bash
# Start daemon
wildmask up

# Query directly
dig api.test @127.0.0.1 -p 5353

# Or use host
host api.test 127.0.0.1
```

## Common Commands

```bash
# TUI (Default)
wildmask                         # Launch interactive dashboard (default)
wildmask tui                     # Launch dashboard (explicit)

# Configuration
wildmask init                    # Initialize config
wildmask config edit             # Edit config in $EDITOR
wildmask --help                  # Show help

# Mappings
wildmask add <host> ...          # Add mapping
wildmask remove <id>             # Remove mapping
wildmask list                    # List all mappings

# Daemon
wildmask up                      # Start daemon
wildmask down                    # Stop daemon
wildmask restart                 # Restart daemon
wildmask status                  # Show status

# Diagnostics
wildmask check <host>            # Check specific host
wildmask doctor                  # Run full diagnostics
```

## Troubleshooting

### "Config not found" error

Run `wildmask init` first to create the configuration file.

### "Permission denied" when starting daemon

The daemon tries to bind to port 5353. On some systems, ports below 1024 require elevated privileges. By default, WildMask uses port 5353 which shouldn't require sudo.

If you get permission errors, check:
```bash
# Check what's using port 5353
lsof -i :5353  # macOS/Linux
netstat -ano | findstr :5353  # Windows
```

### DNS not resolving

1. Check daemon is running: `wildmask status`
2. Run diagnostics: `wildmask doctor`
3. Verify resolver installation:
   - macOS: `ls -la /etc/resolver/`
   - Linux: `resolvectl status`
   - Windows: `Get-DnsClientServerAddress`

### Build errors

```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

## Next Steps

- Read the [Architecture Documentation](docs/architecture.md)
- Check the [Development Guide](docs/development.md)
- Review the [API Documentation](docs/api.md)
- Explore example configurations in `examples/`

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/yourusername/wildmask/issues)
- 💬 [Discussions](https://github.com/yourusername/wildmask/discussions)

## Uninstalling

To completely remove WildMask:

```bash
# Stop daemon
wildmask down

# Remove system resolver
# macOS/Linux:
sudo bash scripts/uninstall-daemon.sh test

# Windows (as Administrator):
powershell -ExecutionPolicy Bypass -File scripts\uninstall-daemon.ps1 -Domain test

# Unlink global command
pnpm unlink --global

# Remove config (optional)
rm -rf ~/.wildmask
```

---

Happy developing! 🎭


