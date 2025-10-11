# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-01-XX

### Added

- Initial release of WildMask
- DNS daemon with UDP server for local DNS resolution
- Wildcard support using micromatch patterns
- CLI with commands: init, add, remove, list, up, down, status, check, doctor
- Full TUI dashboard with Ink (React for terminal)
- Interactive mapping management in TUI
- Health checks (TCP and HTTP)
- Cross-platform support (macOS, Linux, Windows)
- Config management with YAML and Zod validation
- Platform-specific DNS resolver installation scripts
- Diagnostics and troubleshooting with doctor command
- DNS query caching with TTL
- Upstream DNS forwarding
- Logging with rotation
- TypeScript monorepo with pnpm workspaces
- Comprehensive test suite with Vitest
- CI/CD with GitHub Actions

### Features

#### CLI
- `wildmask init` - Initialize configuration
- `wildmask add` - Add DNS mapping
- `wildmask remove` - Remove DNS mapping
- `wildmask list` - List all mappings
- `wildmask up` - Start DNS daemon
- `wildmask down` - Stop DNS daemon
- `wildmask status` - Show daemon status
- `wildmask check` - Check host connectivity
- `wildmask doctor` - Run system diagnostics

#### TUI
- Interactive dashboard with real-time updates
- Mapping list with health status indicators
- Add/Edit/Delete mappings with forms
- Logs viewer (planned)
- Diagnostics panel
- Keyboard shortcuts for all operations

#### DNS
- Real wildcard support (`*.cdn.test`)
- Query forwarding to upstream DNS
- Response caching with TTL
- Support for A records
- Port configuration (default 5353)

#### Health Checks
- TCP connectivity checks
- HTTP/HTTPS health endpoints
- Latency measurement
- Configurable check intervals
- Visual status indicators

#### Platform Support
- macOS: `/etc/resolver/` integration
- Linux: `systemd-resolved` integration
- Windows: Network adapter DNS configuration

### Technical

- **Packages:**
  - `@wildmask/types` - Type definitions and Zod schemas
  - `@wildmask/core` - Core logic and config management
  - `@wildmask/dns-daemon` - DNS server implementation
  - `@wildmask/health` - Health checks and diagnostics
  - `@wildmask/cli` - Command-line interface
  - `@wildmask/tui` - Terminal user interface

- **Dependencies:**
  - `dns-packet` - DNS packet encoding/decoding
  - `micromatch` - Wildcard pattern matching
  - `ink` - React for terminal UI
  - `commander` - CLI framework
  - `zod` - Schema validation
  - `yaml` - Config file parsing

- **Dev Tools:**
  - `typescript` - Type checking
  - `vitest` - Testing framework
  - `turbo` - Build orchestration
  - `eslint` - Linting

### Known Limitations

- Windows support is functional but may require additional configuration
- Only A record queries are handled (AAAA, MX, etc. forwarded to upstream)
- Daemon must be started manually (autostart planned for v0.2.0)
- No GUI (terminal only)

### Security

- Minimal privilege escalation (only during initial setup)
- Input validation for all user-provided data
- DNS queries limited to configured domains
- Rate limiting to prevent DoS (basic implementation)

[Unreleased]: https://github.com/yourusername/wildmask/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/wildmask/releases/tag/v0.1.0


