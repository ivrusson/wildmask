# Development Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 9+
- **Git**

Optional:
- **Docker** for testing
- **VS Code** recommended

## Getting Started

### Clone Repository

```bash
git clone https://github.com/yourusername/wildmask.git
cd wildmask
```

### Install Dependencies

```bash
# Install pnpm if needed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### Build All Packages

```bash
# Build all packages (in dependency order)
pnpm build

# Build and watch for changes
pnpm dev
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

## Project Structure

```
wildmask/
├── packages/
│   ├── types/            # Shared types and schemas
│   ├── core/             # Core logic
│   ├── dns-daemon/       # DNS server
│   ├── health/           # Health checks
│   ├── cli/              # CLI commands
│   └── tui/              # TUI components
├── scripts/              # Build and install scripts
├── docs/                 # Documentation
├── .github/              # GitHub Actions
├── pnpm-workspace.yaml   # pnpm workspaces config
├── turbo.json            # Turbo build config
└── package.json          # Root package
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

Work in the relevant package(s). Turbo will handle incremental builds.

### 3. Test Your Changes

```bash
# Build
pnpm build

# Test
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### 4. Test Locally

Link the package globally for testing:

```bash
# From project root
pnpm link --global

# Now wildmask command uses your local version
wildmask --version
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` tests
- `refactor:` code refactoring
- `chore:` maintenance

### 6. Push and Create PR

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

## Package-Specific Development

### Types Package

```bash
cd packages/types
pnpm dev
```

Edit schemas in `src/` and they'll be validated immediately.

### Core Package

```bash
cd packages/core
pnpm test -- --watch
```

Tests use Vitest for fast feedback.

### DNS Daemon

Test DNS server locally:

```bash
cd packages/dns-daemon
pnpm build

# Run test server
node dist/server.js
```

Query it:

```bash
dig @127.0.0.1 -p 5353 api.test
```

### CLI

Test commands:

```bash
cd packages/cli
pnpm build

# Run CLI
node dist/cli.js --help
```

### TUI

Run TUI in dev mode:

```bash
cd packages/tui
pnpm dev
```

## Testing

### Unit Tests

Located in `src/__tests__/` directories:

```bash
# Test specific package
pnpm --filter @wildmask/core test

# Test with coverage
pnpm test -- --coverage
```

### Integration Tests

Test full workflows:

```bash
# Build first
pnpm build

# Run integration tests
pnpm test:e2e
```

### Manual Testing

```bash
# Link globally
pnpm link --global

# Initialize
wildmask init --domain test

# Add mapping
wildmask add api --target 127.0.0.1 --port 3000

# Start daemon (requires sudo first time)
wildmask up

# Check status
wildmask status

# Run diagnostics
wildmask doctor

# Launch TUI
wildmask
```

## Debugging

### CLI/TUI

Use Node.js inspector:

```bash
node --inspect dist/cli.js <command>
```

Then attach VS Code debugger or Chrome DevTools.

### DNS Daemon

Add debug logging:

```typescript
logger.debug('Query received', { hostname, type });
```

Set log level in config:

```yaml
logging:
  level: "debug"
```

### VS Code Configuration

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "CLI",
      "program": "${workspaceFolder}/packages/cli/dist/cli.js",
      "args": ["status"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

## Common Tasks

### Adding a New Package

```bash
mkdir packages/new-package
cd packages/new-package

# Copy package.json template
# Edit and customize

# Add to workspace
cd ../..
pnpm install
```

### Updating Dependencies

```bash
# Update all packages
pnpm up -r

# Update specific package
pnpm up -r typescript

# Check for outdated
pnpm outdated
```

### Building for Release

```bash
# Clean build
pnpm clean
pnpm build

# Run full test suite
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

### Type Errors

```bash
# Check all packages
pnpm typecheck

# Generate declaration files
pnpm build
```

### Test Failures

```bash
# Run tests with verbose output
pnpm test -- --reporter=verbose

# Run specific test file
pnpm test src/__tests__/config.test.ts
```

## Performance Profiling

### DNS Server

```bash
node --prof dist/server.js
# Run queries
# Stop server
node --prof-process isolate-*.log > processed.txt
```

### Memory Leaks

```bash
node --inspect --expose-gc dist/cli.js
```

Use Chrome DevTools Memory profiler.

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `git commit -m "chore: release v0.1.0"`
4. Tag: `git tag v0.1.0`
5. Push: `git push && git push --tags`
6. CI will publish to npm

## Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Ink Documentation](https://github.com/vadimdemedes/ink)


