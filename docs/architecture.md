# WildMask Architecture

## Overview

WildMask is designed as a modular monorepo with clear separation of concerns across multiple packages. Each package has a specific responsibility and can be developed, tested, and deployed independently.

## Package Architecture

### Types Package (`@wildmask/types`)

Central type definitions and Zod schemas for the entire project.

**Responsibilities:**
- Define all TypeScript types
- Zod schemas for validation
- Shared interfaces

**Dependencies:** None (foundational package)

### Core Package (`@wildmask/core`)

Core business logic for configuration and mapping management.

**Responsibilities:**
- Config file I/O (YAML parsing)
- Config validation
- Mapping CRUD operations
- Logging infrastructure
- Utility functions

**Dependencies:** `@wildmask/types`

### DNS Daemon Package (`@wildmask/dns-daemon`)

Local DNS server implementation.

**Responsibilities:**
- UDP DNS server
- DNS packet parsing/encoding
- Wildcard matching
- Query forwarding to upstream DNS
- Response caching
- Daemon lifecycle management

**Dependencies:** `@wildmask/types`, `@wildmask/core`

### Health Package (`@wildmask/health`)

Health checking and diagnostics.

**Responsibilities:**
- TCP connectivity checks
- HTTP/HTTPS health endpoints
- Latency measurement
- System diagnostics
- Fix suggestions

**Dependencies:** `@wildmask/types`

### CLI Package (`@wildmask/cli`)

Command-line interface.

**Responsibilities:**
- CLI command definitions
- User input handling
- Terminal output formatting
- Integration of all packages

**Dependencies:** All packages

### TUI Package (`@wildmask/tui`)

Terminal user interface.

**Responsibilities:**
- Interactive dashboard
- Real-time status updates
- Forms and navigation
- Logs viewer
- Diagnostics panel

**Dependencies:** `@wildmask/types`, `@wildmask/core`, `@wildmask/health`

## Data Flow

### Config Management Flow

```
User Command (CLI/TUI)
    ↓
ConfigManager.load()
    ↓
YAML.parse(~/.wildmask/config.yaml)
    ↓
ConfigSchema.validate()
    ↓
Return validated Config
```

### DNS Resolution Flow

```
DNS Query (e.g., api.test)
    ↓
System Resolver (127.0.0.1:5353)
    ↓
DNSServer.handleQuery()
    ↓
DomainMatcher.match()
    ├─ Match found → Return mapped IP
    └─ No match → DNSForwarder.forward() → Upstream DNS
```

### Health Check Flow

```
HealthChecker.check(mapping)
    ↓
Is HTTP/HTTPS?
    ├─ Yes → httpCheck()
    └─ No → tcpCheck()
    ↓
Measure latency
    ↓
Return HealthCheckResult
```

## Key Design Decisions

### 1. Monorepo with pnpm Workspaces

**Why:** 
- Shared code across packages
- Consistent dependency versions
- Fast, efficient builds with Turbo

### 2. TypeScript + Zod

**Why:**
- Type safety throughout codebase
- Runtime validation of config
- Great DX with autocomplete

### 3. Separate CLI + TUI

**Why:**
- CLI for scripting and automation
- TUI for interactive development
- Users can choose their preference

### 4. Local DNS Daemon vs /etc/hosts

**Why DNS Daemon:**
- Real wildcard support
- No sudo for daily operations
- Dynamic updates without file edits

**Tradeoffs:**
- More complex setup
- Requires background process
- Platform-specific resolver config

### 5. Node.js over Go/Rust

**Why Node.js:**
- Rich ecosystem (dns-packet, ink)
- Familiar to web developers
- Easy to contribute
- Fast enough for local DNS

**Tradeoffs:**
- Larger runtime footprint
- Not a single compiled binary (but can use pkg if needed)

## Security Considerations

### Privilege Escalation

WildMask minimizes privileged operations:

1. **Initial Setup** - Requires sudo/admin to configure system resolver
2. **Daily Use** - Runs as normal user
3. **Daemon** - Runs as user, binds to port >1024

### Input Validation

All user inputs validated:
- Hostnames: regex validation
- IPs: Zod IP validation
- Ports: range check (1-65535)
- Config: full Zod schema validation

### DNS Security

- Rate limiting to prevent DoS
- Only responds to configured domains
- Forwards unknown queries to trusted upstream
- No DNS amplification risk (localhost only)

## Performance

### DNS Server

- **Latency:** <5ms for cached responses
- **Throughput:** ~10,000 queries/sec (local)
- **Memory:** ~50MB base + ~1KB per cached entry

### TUI

- **Refresh Rate:** 200ms (5 FPS)
- **Health Checks:** Configurable interval (default 30s)
- **Memory:** ~100MB (Ink + React)

## Future Enhancements

### v0.2.0

- Windows full support
- Auto-fix in doctor command
- Shell completion scripts

### v1.0.0

- HTTPS certificates (mkcert integration)
- Import/Export mappings
- Telemetry (opt-in)

### v1.1.0+

- HTTP proxy mode (alternative to DNS)
- Load balancing (multiple backends)
- Docker integration
- VS Code extension


