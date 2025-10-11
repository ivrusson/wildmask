# 📁 WildMask - Project Structure

## Root Directory

```
wildmask/
├── README.md                   # Main documentation
├── CHANGELOG.md                # Version history
├── LICENSE                     # MIT License
├── package.json                # Project metadata & scripts
├── pnpm-workspace.yaml         # Monorepo configuration
├── tsconfig.json               # Base TypeScript config
├── turbo.json                  # Build orchestration
├── vitest.config.ts            # Test configuration
├── .gitignore                  # Git ignore rules
├── .eslintrc.json              # Linting configuration
│
├── packages/                   # Monorepo packages →
├── docs/                       # Documentation →
└── scripts/                    # Utility scripts →
```

---

## 📦 Packages (Monorepo)

```
packages/
├── types/                      # TypeScript types & Zod schemas
│   ├── src/
│   │   ├── config.schema.ts    # Config validation schemas
│   │   ├── daemon.types.ts     # Daemon-related types
│   │   ├── health.types.ts     # Health check types
│   │   ├── logger.types.ts     # Logging interfaces
│   │   └── platform.types.ts   # Platform-specific types
│   └── package.json
│
├── core/                       # Core business logic
│   ├── src/
│   │   ├── config-manager.ts   # Configuration management
│   │   ├── mapping-manager.ts  # CRUD for mappings
│   │   ├── logger.ts           # File logger with rotation
│   │   ├── port-finder.ts      # Port detection utility
│   │   ├── constants.ts        # App constants
│   │   └── utils.ts            # Helper functions
│   └── package.json
│
├── dns-daemon/                 # DNS server implementation
│   ├── src/
│   │   ├── server.ts           # UDP DNS server
│   │   ├── matcher.ts          # Wildcard domain matching
│   │   ├── cache.ts            # DNS response caching
│   │   ├── forwarder.ts        # Upstream DNS forwarding
│   │   ├── daemon-manager.ts   # Daemon lifecycle
│   │   └── dns-packet.d.ts     # Type definitions
│   └── package.json
│
├── health/                     # Health checks & diagnostics
│   ├── src/
│   │   ├── tcp-check.ts        # TCP connectivity checks
│   │   ├── http-check.ts       # HTTP/HTTPS health checks
│   │   ├── health-checker.ts   # Health check orchestration
│   │   └── diagnostics.ts      # System diagnostics
│   └── package.json
│
├── cli/                        # Command-line interface
│   ├── src/
│   │   ├── cli.ts              # CLI entry point
│   │   ├── index.ts            # Command registration
│   │   ├── commands/           # 23 command implementations
│   │   │   ├── init.ts
│   │   │   ├── setup.ts
│   │   │   ├── config.ts
│   │   │   ├── add.ts
│   │   │   ├── remove.ts
│   │   │   ├── list.ts
│   │   │   ├── up.ts
│   │   │   ├── down.ts
│   │   │   ├── restart.ts
│   │   │   ├── status.ts
│   │   │   ├── check.ts
│   │   │   ├── doctor.ts
│   │   │   ├── install.ts
│   │   │   ├── tui.ts
│   │   │   ├── serve.ts
│   │   │   ├── serve-api.ts
│   │   │   ├── serve-api-command.ts
│   │   │   ├── proxy.ts
│   │   │   ├── proxy-smart.ts
│   │   │   └── completion.ts
│   │   └── utils/
│   │       └── output.ts       # Colored output utilities
│   └── package.json
│
└── tui/                        # Terminal User Interface
    ├── src/
    │   ├── App.tsx             # Main TUI application
    │   ├── index.tsx           # TUI entry point
    │   └── components/
    │       ├── Dashboard.tsx   # Main dashboard
    │       ├── StatusBar.tsx   # Status display
    │       ├── MappingsList.tsx # Mappings table
    │       ├── MappingForm.tsx  # Add/Edit form
    │       ├── LogsViewer.tsx   # Logs panel
    │       ├── DoctorPanel.tsx  # Diagnostics panel
    │       └── HelpBar.tsx      # Keyboard shortcuts
    └── package.json
```

**Total**: 6 packages, ~50 TypeScript files

---

## 📚 Documentation

```
docs/
├── README.md                   # Documentation index
│
├── # User Guides (Start here!)
├── getting-started.md          # Quick start (2 min)
├── installation.md             # Installation & setup wizard
├── install-dns.md              # DNS resolver setup
├── proxy-guide.md              # Proxy & wildcards
│
├── # Reference
├── commands-reference.md       # All 23 commands
├── tui-guide.md                # TUI testing guide
│
└── # Technical
    ├── architecture.md         # System architecture
    ├── development.md          # Contributing guide
    └── technical-summary.md    # Implementation details
```

**Total**: 10 markdown files, ~4,000 lines

---

## 🛠️ Scripts

```
scripts/
├── README.md                   # This file
│
├── # Package Scripts (Automated)
├── postinstall.js              # Post-install setup
│
├── # System Integration
├── install-daemon.sh           # macOS/Linux service install
├── uninstall-daemon.sh         # macOS/Linux service uninstall
├── install-daemon.ps1          # Windows service install
├── uninstall-daemon.ps1        # Windows service uninstall
│
└── # User Utilities
    ├── quick-start.sh          # Automated setup
    ├── validate-installation.sh # System validation
    └── start-smart-proxy.sh    # Start proxy on port 80
```

**Total**: 8 scripts + README

---

## 📊 File Statistics

### Source Code
- TypeScript files: ~50
- Lines of code: ~5,000
- Packages: 6

### Documentation
- Markdown files: 12 (10 in docs/ + 2 in root)
- Lines: ~4,000
- Scripts: 8

### Configuration
- Config files: 8 (package.json, tsconfig, turbo, etc.)
- Lines: ~400

### Total Project
- **Files**: ~70 source files
- **Lines**: ~9,000+
- **Ratio docs/code**: 0.8 (excellent)

---

## 🎯 Key Files

### Essential (Don't Delete!)
- `README.md` - Main entry point
- `package.json` - Project metadata
- `CHANGELOG.md` - Version history
- `LICENSE` - Legal
- `pnpm-workspace.yaml` - Monorepo config

### Configuration (Don't Modify Unless You Know What You're Doing)
- `tsconfig.json` - TypeScript settings
- `turbo.json` - Build caching
- `vitest.config.ts` - Test settings
- `.eslintrc.json` - Linting rules

### Runtime (Generated, In .gitignore)
- `dist/` folders - Compiled JavaScript
- `node_modules/` - Dependencies
- `.turbo/` - Build cache
- `*.log` - Log files

---

## 🔍 Finding Things

### "Where is the X implementation?"
- CLI commands → `packages/cli/src/commands/`
- TUI components → `packages/tui/src/components/`
- DNS logic → `packages/dns-daemon/src/`
- Config logic → `packages/core/src/`
- Types → `packages/types/src/`

### "Where is the X documentation?"
- User guides → `docs/getting-started.md`, `docs/installation.md`
- Command reference → `docs/commands-reference.md`
- Technical → `docs/architecture.md`, `docs/technical-summary.md`

### "Where is the X script?"
- All scripts → `scripts/`
- Quick start → `scripts/quick-start.sh`
- Validation → `scripts/validate-installation.sh`

---

## 🎨 Clean Structure Benefits

1. **Clear separation** - Root solo tiene lo esencial
2. **Easy navigation** - Documentación en un solo lugar
3. **Scripts organizados** - Todos en scripts/
4. **Monorepo limpio** - Packages bien definidos
5. **Fácil de mantener** - Estructura predecible

---

## 📝 Updates

When adding new features:
- **New command** → `packages/cli/src/commands/your-command.ts`
- **New TUI component** → `packages/tui/src/components/YourComponent.tsx`
- **New documentation** → `docs/your-guide.md`
- **New script** → `scripts/your-script.sh`

---

**This structure follows best practices for TypeScript monorepos and open-source projects.**
