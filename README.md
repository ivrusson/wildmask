# 🎭 WildMask

> Modern CLI + TUI for managing local DNS masks with wildcard support

WildMask is a powerful developer tool that allows you to map local domain patterns (like `*.test`) to your development servers using a local DNS daemon with real wildcard support, plus a beautiful terminal UI for management.

## ✨ Features

- 🌐 **Real Wildcard DNS** - Support for patterns like `*.assets.test`
- 🎨 **Beautiful TUI** - Interactive terminal dashboard built with Ink
- ⚡ **Fast CLI** - Quick commands for all operations
- 🏥 **Health Checks** - Automatic TCP/HTTP health monitoring
- 🔍 **Diagnostics** - Built-in doctor command to troubleshoot issues
- 🖥️ **Cross-Platform** - Works on macOS, Linux, and Windows
- 📦 **Zero Config** - Works out of the box with sensible defaults

## 🚀 Quick Start

### Installation

```bash
# Using pnpm (recommended)
pnpm add -g wildmask

# Using npm
npm install -g wildmask

# Using yarn
yarn global add wildmask
```

### Usage - Option 1: Quick Setup (Recommended for first-time users)

```bash
# Run the interactive setup wizard
wildmask setup

# That's it! The wizard will:
# • Initialize configuration with automatic port detection
# • Install DNS resolver (will ask for sudo password)
# • Add example mapping
# • Start the daemon
# • Verify everything works
# • Guide you through optional smart proxy setup
```

### Usage - Option 2: Manual Setup (90 seconds)

```bash
# 1. Initialize configuration
wildmask init --domain test

# 2. Install DNS resolver (requires sudo)
sudo wildmask install

# 3. Add your first mapping
wildmask add api --target 127.0.0.1 --port 3000

# 4. Start the DNS daemon
wildmask up

# 5. (Optional) Start a test server
wildmask serve-api --port 3000 --name api

# 6. Verify it works
curl http://api.test:3000/health

# 7. Launch the TUI dashboard (or just run 'wildmask' with no args)
wildmask
# or
wildmask tui
```

That's it! Now `api.test` resolves to `127.0.0.1:3000`.

> **📝 Note**: The `wildmask install` command configures your system's DNS resolver to use WildMask for `*.test` domains. This step requires sudo/admin privileges. See [DNS Installation Guide](./docs/install-dns.md) for detailed instructions and troubleshooting.

## 📖 Commands

### Configuration

```bash
# Initialize WildMask
wildmask init [--domain <tld>]

# Configuration management
wildmask config edit          # Edit in $EDITOR
wildmask config show          # Display configuration
wildmask config reset         # Reset to defaults
wildmask config path          # Show config file path
wildmask config validate      # Validate configuration
wildmask config export        # Export configuration
wildmask config import <file> # Import configuration
```

### Mappings

```bash
# Add a mapping
wildmask add <host> --target <ip> --port <port>
wildmask add api --target 127.0.0.1 --port 3000

# Add wildcard mapping
wildmask add "*.cdn" --target 127.0.0.1 --port 8080

# Remove a mapping
wildmask remove <id-or-host>

# List all mappings
wildmask list [--json]
```

### System Integration

```bash
# Install DNS resolver (requires sudo)
sudo wildmask install

# Uninstall DNS resolver
sudo wildmask uninstall

# Run diagnostics
wildmask doctor [--fix]
```

### Daemon Control

```bash
# Start daemon
wildmask up

# Stop daemon
wildmask down

# Restart daemon
wildmask restart

# Check daemon status
wildmask status
```

### Diagnostics

```bash
# Check specific host
wildmask check api.test

# Run full diagnostics
wildmask doctor [--fix]
```

### Testing & Development

```bash
# Start a dummy API server for testing
wildmask serve-api --port 3000 --name api --add

# Start a static file server
wildmask serve --port 8080 --dir ./dist --name frontend --add

# Start smart proxy (access without specifying port)
sudo wildmask smart-proxy --port 80

# Start basic proxy
wildmask proxy --port 8888 --pattern api

# The --add flag automatically creates a WildMask mapping
```

### Utilities

```bash
# Generate shell completions
wildmask completion bash
wildmask completion zsh
wildmask completion fish
wildmask completion powershell

# To install zsh completion:
wildmask completion zsh > ~/.zsh/completions/_wildmask
```

### TUI Dashboard

```bash
# Launch interactive dashboard
# Running 'wildmask' with no arguments launches the TUI by default
wildmask

# Or use the explicit command
wildmask tui

# Keyboard shortcuts:
#   n - New mapping
#   e - Edit mapping
#   d - Delete mapping
#   r - Refresh
#   l - View logs
#   ctrl+d - Run diagnostics
#   s - Start/Stop daemon
#   q - Quit
```

## 🎯 Examples

### Basic HTTP API

```bash
wildmask add api --target 127.0.0.1 --port 3000
# Access: http://api.test:3000
```

### Multiple Microservices

```bash
wildmask add api --target 127.0.0.1 --port 3000
wildmask add auth --target 127.0.0.1 --port 3001
wildmask add db --target 127.0.0.1 --port 5432
```

### CDN with Wildcards

```bash
wildmask add "*.cdn" --target 127.0.0.1 --port 8080
# Access: img.cdn.test, static.cdn.test, etc.
```

### HTTPS Development

```bash
wildmask add app --target 127.0.0.1 --port 5173 --protocol https
```

### With Health Checks

```bash
wildmask add api --target 127.0.0.1 --port 3000 \
  --health-path /health \
  --health-interval 30
```

## 🏗️ Architecture

```
Query: api.test
   ↓
System DNS Resolver (127.0.0.1:5353)
   ↓
WildMask DNS Daemon (UDP server)
   ↓
Match in config? → Yes: Return mapped IP
                 → No:  Forward to upstream DNS (8.8.8.8)
```

### Components

- **CLI** - Commander.js based commands
- **TUI** - Ink (React for terminal) dashboard
- **DNS Daemon** - Node.js UDP server with dns-packet
- **Core** - Config management with Zod validation
- **Health** - TCP/HTTP health checks

## 🖥️ Platform Support

### macOS

Uses `/etc/resolver/<domain>` for DNS resolution. Requires sudo during `init`.

```bash
# Verify resolver
scutil --dns | grep test
```

### Linux

Integrates with `systemd-resolved`. Requires sudo during `init`.

```bash
# Verify resolver
resolvectl status
```

### Windows

Configures DNS via network adapters. Requires Administrator privileges during `init`.

```powershell
# Verify DNS
Get-DnsClientServerAddress
```

## ⚙️ Configuration

Config file location: `~/.wildmask/config.yaml`

```yaml
version: "1.0"
domain: "test"

resolver:
  method: "dns-daemon"
  port: 5353
  fallback: true
  upstreamDNS:
    - "8.8.8.8"
    - "1.1.1.1"

mappings:
  - id: "abc123"
    host: "api"
    target: "127.0.0.1"
    port: 3000
    protocol: "http"
    enabled: true
    health:
      enabled: true
      path: "/health"
      interval: 30
      timeout: 5

options:
  ttl: 60
  autoStart: false
  checkUpdates: true
  telemetry: false

logging:
  level: "info"
  maxSize: "10mb"
  maxFiles: 5
```

## 🔧 Troubleshooting

### Daemon won't start

```bash
# Run diagnostics
wildmask doctor

# Check for port conflicts
lsof -i :5353  # macOS/Linux
netstat -ano | findstr :5353  # Windows

# View logs
cat ~/.wildmask/logs/wildmask.log
```

### DNS not resolving

```bash
# Verify daemon is running
wildmask status

# Check resolver configuration
# macOS:
ls -la /etc/resolver/
# Linux:
resolvectl status

# Test DNS manually
dig api.test @127.0.0.1 -p 5353
```

### Permission issues

WildMask needs elevated privileges only during:
- Initial setup (`wildmask init`)
- Installing system resolver

All other operations run without privileges.

## 📦 Development

```bash
# Clone repository
git clone https://github.com/yourusername/wildmask.git
cd wildmask

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Link locally
pnpm link --global
```

### Project Structure

```
wildmask/
├── packages/
│   ├── cli/          # CLI commands
│   ├── tui/          # TUI components
│   ├── core/         # Core logic
│   ├── dns-daemon/   # DNS server
│   ├── health/       # Health checks
│   └── types/        # TypeScript types
├── scripts/          # Installation scripts
└── docs/             # Documentation
```

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

- **[Getting Started](./docs/getting-started.md)** - Quick start guide
- **[Installation](./docs/installation.md)** - Setup wizard & manual installation
- **[Commands Reference](./docs/commands-reference.md)** - All commands documented
- **[DNS Installation](./docs/install-dns.md)** - DNS resolver setup (macOS/Linux/Windows)
- **[Proxy Guide](./docs/proxy-guide.md)** - Reverse proxy & wildcards
- **[TUI Guide](./docs/tui-guide.md)** - TUI testing & shortcuts
- **[Architecture](./docs/architecture.md)** - Technical architecture
- **[Development](./docs/development.md)** - Contributing guide

**[Browse all documentation →](./docs/README.md)**

## 🤝 Contributing

Contributions are welcome! Please read our [Development Guide](./docs/development.md) for details.

## 📄 License

MIT © Ivan Rubio

## 🙏 Acknowledgments

- [dns-packet](https://github.com/mafintosh/dns-packet) - DNS packet parsing
- [ink](https://github.com/vadimdemedes/ink) - React for terminal
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation

## 🔗 Links

- [Documentation](https://wildmask.dev/docs)
- [Issues](https://github.com/yourusername/wildmask/issues)
- [Changelog](CHANGELOG.md)


