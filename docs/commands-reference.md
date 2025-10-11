# 📖 WildMask - Referencia Completa de Comandos

Todos los comandos disponibles en WildMask v0.1.0

## 🎯 Índice Rápido

- [Initialization](#initialization)
- [Configuration](#configuration)
- [Mappings](#mappings)
- [Daemon Control](#daemon-control)
- [System Integration](#system-integration)
- [Testing & Development](#testing--development)
- [Diagnostics](#diagnostics)
- [TUI](#tui)
- [Utilities](#utilities)

---

## Initialization

### `wildmask init`

Inicializa la configuración de WildMask.

**Opciones:**
- `--domain <tld>` - Dominio TLD a usar (default: `test`)
- `--force` - Sobrescribir configuración existente

**Ejemplos:**
```bash
wildmask init
wildmask init --domain local
wildmask init --domain dev --force
```

**Output:**
- Crea `~/.wildmask/config.yaml`
- Detecta automáticamente puerto disponible
- Muestra warnings si hay conflictos de puerto

---

## Configuration

### `wildmask config edit`

Abre el archivo de configuración en tu editor preferido.

**Variables de entorno:**
- `$EDITOR` - Editor a usar (default: nano)
- `$VISUAL` - Editor visual alternativo

**Ejemplos:**
```bash
wildmask config edit
EDITOR=vim wildmask config edit
EDITOR=code wildmask config edit  # VSCode
```

### `wildmask config show`

Muestra la configuración actual.

**Opciones:**
- `--json` - Output en formato JSON

**Ejemplos:**
```bash
wildmask config show
wildmask config show --json | jq .
```

### `wildmask config reset`

Resetea la configuración a valores por defecto.

**Opciones:**
- `--force` - Skip confirmación

**Ejemplos:**
```bash
wildmask config reset --force
```

**⚠️ Warning:** Elimina todos los mappings!

### `wildmask config path`

Muestra la ruta del archivo de configuración.

**Ejemplos:**
```bash
wildmask config path
cat $(wildmask config path)
```

### `wildmask config validate`

Valida el archivo de configuración.

**Ejemplos:**
```bash
wildmask config validate
```

### `wildmask config export`

Exporta la configuración.

**Opciones:**
- `--file <path>` - Exportar a archivo

**Ejemplos:**
```bash
wildmask config export > backup.json
wildmask config export --file ~/wildmask-backup.json
```

### `wildmask config import <file>`

Importa configuración desde archivo.

**Opciones:**
- `--force` - Sobrescribir configuración existente

**Ejemplos:**
```bash
wildmask config import backup.json --force
wildmask config import backup.yaml
```

---

## Mappings

### `wildmask add <host>`

Añade un nuevo mapping DNS.

**Argumentos:**
- `<host>` - Patrón de host (ej: `api`, `*.assets`, `api.backend`)

**Opciones requeridas:**
- `--target <ip>`, `-t` - IP destino
- `--port <port>`, `-p` - Puerto destino

**Opciones:**
- `--protocol <proto>` - Protocolo: http, https, tcp (default: http)
- `--domain <domain>`, `-d` - Dominio personalizado
- `--health-path <path>` - Path para health check
- `--health-interval <secs>` - Intervalo de health check (default: 30)
- `--no-health` - Deshabilitar health checks

**Ejemplos:**
```bash
# Mapping básico
wildmask add api --target 127.0.0.1 --port 3000

# Con dominio personalizado
wildmask add api --domain local --target 127.0.0.1 --port 3000

# Wildcard
wildmask add "*.cdn" --target 127.0.0.1 --port 8080

# Wildcard con dominio custom
wildmask add "*.assets" --domain cdn --target 127.0.0.1 --port 8080

# Con health check personalizado
wildmask add api --target 127.0.0.1 --port 3000 --health-path /health --health-interval 10

# HTTPS
wildmask add secure --target 127.0.0.1 --port 443 --protocol https

# TCP puro
wildmask add db --target 127.0.0.1 --port 5432 --protocol tcp
```

### `wildmask remove <id-or-host>`

Elimina un mapping.

**Aliases:** `rm`

**Argumentos:**
- `<id-or-host>` - ID del mapping o nombre del host

**Ejemplos:**
```bash
wildmask remove api
wildmask remove abc12345
wildmask rm test-api
```

### `wildmask list`

Lista todos los mappings.

**Aliases:** `ls`

**Opciones:**
- `--json` - Output en formato JSON

**Ejemplos:**
```bash
wildmask list
wildmask ls
wildmask list --json | jq '.[] | select(.enabled == true)'
```

---

## Daemon Control

### `wildmask up`

Inicia el daemon DNS.

**Opciones:**
- `--detach` - Ejecutar en background (default: true)

**Ejemplos:**
```bash
wildmask up
wildmask up --no-detach  # Foreground con logs
```

**Features:**
- Valida puerto antes de iniciar
- Auto-ajusta si hay conflictos
- Carga todos los mappings
- Escribe PID file

### `wildmask down`

Detiene el daemon DNS.

**Ejemplos:**
```bash
wildmask down
```

### `wildmask restart`

Reinicia el daemon DNS.

**Ejemplos:**
```bash
wildmask restart
```

**Equivalente a:**
```bash
wildmask down && wildmask up
```

### `wildmask status`

Muestra el estado del daemon.

**Opciones:**
- `--json` - Output en formato JSON

**Ejemplos:**
```bash
wildmask status
wildmask status --json
```

**Output incluye:**
- Estado (Running/Stopped)
- PID del proceso
- Puerto en uso
- Uptime (si está disponible)

---

## System Integration

### `sudo wildmask install`

Instala la configuración del DNS resolver en el sistema.

**⚠️ Requiere:** sudo/admin privileges

**Plataformas:**
- **macOS**: Crea `/etc/resolver/<domain>`
- **Linux**: Configura systemd-resolved o dnsmasq
- **Windows**: (Planned)

**Ejemplos:**
```bash
sudo wildmask install
```

**Qué hace:**
1. Verifica que el daemon esté configurado
2. Detecta el sistema operativo
3. Crea el archivo de resolver con el puerto correcto
4. Flush del caché DNS
5. Verifica la instalación

### `sudo wildmask uninstall`

Desinstala la configuración del DNS resolver.

**Ejemplos:**
```bash
sudo wildmask uninstall
```

### `wildmask doctor`

Ejecuta diagnósticos completos del sistema.

**Opciones:**
- `--fix` - Intentar arreglar problemas automáticamente
- `--json` - Output en formato JSON

**Ejemplos:**
```bash
wildmask doctor
wildmask doctor --fix
wildmask doctor --json
```

**Checks incluidos:**
- Daemon process status
- Port availability analysis
- DNS resolver configuration
- Config file validation
- Conflictos con mDNS

**Output incluye:**
- Análisis de puertos (5353, 5354, 5355, etc.)
- Puerto recomendado si hay conflictos
- Suggested fixes
- Summary (passed/failed/warnings)

---

## Testing & Development

### `wildmask serve-api`

Inicia un servidor API dummy para testing.

**Opciones:**
- `--port <port>`, `-p` - Puerto (default: 3001)
- `--host <host>`, `-h` - Host (default: 127.0.0.1)
- `--name <name>`, `-n` - Nombre para el mapping
- `--add` - Auto-añadir como mapping de WildMask

**Ejemplos:**
```bash
wildmask serve-api --port 3000 --name my-api
wildmask serve-api --port 3001 --name test --add
```

**Endpoints disponibles:**
- `GET /` - Página HTML interactiva
- `GET /health` - Health check con métricas
- `GET /api/test` - Test endpoint
- `GET /api/users` - Mock users data
- `POST /api/echo` - Echo endpoint
- `GET /api/status` - Server status

### `wildmask serve`

Inicia un servidor HTTP estático.

**Opciones:**
- `--port <port>`, `-p` - Puerto (default: 3000)
- `--host <host>`, `-h` - Host (default: 127.0.0.1)
- `--dir <directory>`, `-d` - Directorio a servir
- `--name <name>`, `-n` - Nombre para el mapping
- `--add` - Auto-añadir como mapping
- `--protocol <proto>` - Protocolo (default: http)

**Ejemplos:**
```bash
wildmask serve --port 8080 --dir ./dist --name frontend --add
wildmask serve --port 3000
```

**Usa:** `serve` (npx) internamente

### `wildmask proxy`

Inicia un proxy reverso básico.

**Opciones:**
- `--port <port>`, `-p` - Puerto del proxy (default: 8080)
- `--host <host>`, `-h` - Host (default: 127.0.0.1)
- `--pattern <pattern>` - Patrón de subdominio (default: api)
- `--add` - Auto-añadir mapping wildcard

**Ejemplos:**
```bash
wildmask proxy --port 8080
wildmask proxy --port 8888 --pattern backend --add
```

**Cómo funciona:**
- Extrae puerto del subdominio
- `3000.api.test:8080` → `127.0.0.1:3000`

### `sudo wildmask smart-proxy`

Inicia el proxy reverso inteligente (recomendado).

**Opciones:**
- `--port <port>`, `-p` - Puerto del proxy (default: 80)
- `--host <host>`, `-h` - Host (default: 127.0.0.1)

**Ejemplos:**
```bash
sudo wildmask smart-proxy --port 80
wildmask smart-proxy --port 8888  # Sin sudo para puerto >1024
```

**Estrategias:**
1. Direct mapping lookup (busca en config)
2. Port extraction (extrae del subdomain)
3. Wildcard matching

**Beneficios:**
- ✅ `test-api.test` funciona (directo)
- ✅ `3002.api.test` funciona (wildcard)
- ✅ `backend.myapp` funciona (custom domain)

---

## Diagnostics

### `wildmask check <host>`

Verifica conectividad a un mapping.

**Argumentos:**
- `<host>` - Host a verificar (ej: `api.test`)

**Ejemplos:**
```bash
wildmask check api.test
wildmask check test-api.test
wildmask check backend.myapp
```

**Output:**
- Target (IP:Puerto)
- Status (HEALTHY/DEGRADED/UNHEALTHY)
- Latency
- Mensaje descriptivo

---

## TUI

### `wildmask` o `wildmask tui`

Lanza el dashboard interactivo.

**Keyboard Shortcuts:**

**Dashboard:**
- `n` - New mapping
- `e` - Edit selected mapping
- `d` - Delete selected mapping
- `r` - Refresh
- `l` - View logs
- `Ctrl+D` - Run diagnostics
- `s` - Start/Stop daemon
- `↑↓` / `j/k` - Navigate
- `q` / `Escape` - Quit

**Form:**
- `Enter` - Next field / Submit
- `Escape` - Cancel

**Logs / Doctor:**
- `Escape` - Back to dashboard

**Global:**
- `Ctrl+C` - Exit immediately

**Ejemplos:**
```bash
wildmask
wildmask tui
```

---

## Utilities

### `wildmask completion <shell>`

Genera scripts de autocompletado.

**Argumentos:**
- `<shell>` - Tipo de shell: bash, zsh, fish, powershell

**Ejemplos:**
```bash
# Bash
wildmask completion bash > /usr/local/etc/bash_completion.d/wildmask

# Zsh
mkdir -p ~/.zsh/completions
wildmask completion zsh > ~/.zsh/completions/_wildmask

# Fish
wildmask completion fish > ~/.config/fish/completions/wildmask.fish

# PowerShell
wildmask completion powershell > wildmask-completion.ps1
```

**Zsh Installation:**
```bash
wildmask completion zsh > ~/.zsh/completions/_wildmask
# Add to ~/.zshrc:
fpath=(~/.zsh/completions $fpath)
autoload -Uz compinit && compinit
```

---

## 🎯 Workflows Comunes

### Setup Completo (Primera Vez)

```bash
# 1. Initialize
wildmask init --domain test

# 2. Install DNS resolver  
sudo wildmask install

# 3. Start daemon
wildmask up

# 4. Start smart proxy (opcional pero recomendado)
sudo wildmask smart-proxy --port 80

# 5. Add your first mapping
wildmask add api --target 127.0.0.1 --port 3000

# 6. Restart daemon to load mapping
wildmask restart

# 7. Test
curl http://api.test/
```

### Uso Diario

```bash
# Launch TUI for management
wildmask

# Or use CLI
wildmask add myapp --target 127.0.0.1 --port 3000
wildmask restart
curl http://myapp.test/
```

### Testing Rápido

```bash
# Start dummy server with auto-add
wildmask serve-api --port 3000 --name test --add

# Access immediately (if smart-proxy running)
curl http://test.test/health

# Or with wildcard
curl http://3000.api.test/health
```

### Troubleshooting

```bash
# Check everything
wildmask doctor

# Auto-fix issues
wildmask doctor --fix

# Verify specific host
wildmask check api.test

# View config
wildmask config show

# Validate config
wildmask config validate

# Restart everything
wildmask restart
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Backup & Restore

```bash
# Backup
wildmask config export --file ~/wildmask-backup-$(date +%Y%m%d).json

# Restore
wildmask config import ~/wildmask-backup-20251011.json --force
wildmask restart
```

### Multi-Domain Setup

```bash
# Add mappings with different domains
wildmask add api --domain test --target 127.0.0.1 --port 3000
wildmask add api --domain local --target 127.0.0.1 --port 3001
wildmask add api --domain dev --target 127.0.0.1 --port 3002

# Install resolvers for each domain
sudo sh -c 'echo "nameserver 127.0.0.1\nport 5354" > /etc/resolver/test'
sudo sh -c 'echo "nameserver 127.0.0.1\nport 5354" > /etc/resolver/local'
sudo sh -c 'echo "nameserver 127.0.0.1\nport 5354" > /etc/resolver/dev'

# Flush DNS
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Restart daemon
wildmask restart

# Access
curl http://api.test/      # Port 3000
curl http://api.local/     # Port 3001
curl http://api.dev/       # Port 3002
```

---

## 🔑 Exit Codes

- `0` - Success
- `1` - Error (configuration, network, validation, etc.)
- `127` - Command not found

---

## 💡 Tips & Tricks

### Aliases Útiles

Añade a tu `~/.zshrc` o `~/.bashrc`:

```bash
# WildMask shortcuts
alias wm='wildmask'
alias wm-add='wildmask add'
alias wm-list='wildmask list'
alias wm-up='wildmask up'
alias wm-down='wildmask down'
alias wm-restart='wildmask down && wildmask up'
alias wm-doctor='wildmask doctor --fix'
alias wm-serve='wildmask serve-api'
alias wm-proxy='sudo wildmask smart-proxy --port 80'
```

### Quick Operations

```bash
# One-liner: Add mapping and restart
wildmask add myapp -t 127.0.0.1 -p 3000 && wildmask restart

# Check if daemon is running
wildmask status | grep -q "Running" && echo "OK" || echo "NOT RUNNING"

# List only enabled mappings
wildmask list --json | jq '.[] | select(.enabled == true)'

# Count active mappings
wildmask list --json | jq '[.[] | select(.enabled == true)] | length'

# Export with timestamp
wildmask config export --file ~/wildmask-$(date +%Y%m%d-%H%M%S).json
```

### Environment Variables

```bash
# Change editor
export EDITOR=vim
export VISUAL=code

# Change config path (advanced)
export WILDMASK_CONFIG=~/my-custom-wildmask.yaml
```

---

## 🆘 Help

Para ayuda en cualquier comando:

```bash
wildmask --help
wildmask <command> --help

# Ejemplos:
wildmask add --help
wildmask config --help
wildmask doctor --help
```

---

**Version:** 0.1.0  
**Last Updated:** 2025-10-11
