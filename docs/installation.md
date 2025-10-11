# 🚀 WildMask - Guía de Instalación

## 📦 Instalación

### Desde npm (cuando esté publicado)

```bash
# pnpm (recomendado)
pnpm add -g wildmask

# npm
npm install -g wildmask

# yarn
yarn global add wildmask
```

### Desde el repositorio local

```bash
cd /Users/ivanrubiosubsierra/wildmask
pnpm install
pnpm build
pnpm link --global

# Verificar instalación
wildmask --version
```

---

## 🎯 Setup Inicial

### Opción 1: Setup Wizard (⭐ Recomendado para primera vez)

```bash
wildmask setup
```

**El wizard te guiará paso a paso:**

1. **Inicialización** - Crea configuración con detección automática de puertos
2. **DNS Resolver** - Instala el resolver del sistema (pide sudo)
3. **Mapping de ejemplo** - Añade `example.test`
4. **Daemon** - Inicia el daemon DNS
5. **Verificación** - Prueba que todo funciona
6. **Smart Proxy** - Opcionalmente configura el proxy (puerto 80)

**Ventajas:**
- ✅ Interactivo y guiado
- ✅ Pide sudo solo cuando es necesario
- ✅ Valida cada paso
- ✅ Muestra documentación relevante
- ✅ Error handling robusto

### Opción 2: Setup Manual

```bash
# 1. Inicializar
wildmask init

# 2. Instalar resolver (requiere sudo)
sudo wildmask install

# 3. Añadir mapping
wildmask add api --target 127.0.0.1 --port 3000

# 4. Iniciar daemon
wildmask up

# 5. Verificar
wildmask status
wildmask check api.test
```

---

## 🔍 Primera Ejecución

### Si ejecutas `wildmask` sin configuración:

```bash
wildmask
```

**Verás:**
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🎭 Welcome to WildMask!                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

It looks like this is your first time using WildMask.

Let's get you set up! You have two options:

1️⃣  Quick Setup (Recommended):
   wildmask setup

2️⃣  Manual Setup:
   wildmask init
   sudo wildmask install
   ...
```

**Esto hace que sea imposible perderse** - siempre sabes qué hacer.

---

## 🛠️ Post-Installation

Después de instalar (vía npm o global link), ejecuta:

```bash
wildmask setup
```

O si prefieres hacerlo manualmente:

```bash
# Verificar instalación
wildmask --version

# Ver ayuda
wildmask --help

# Inicializar
wildmask init

# Ver siguiente paso
wildmask  # Te dirá exactamente qué hacer
```

---

## 🎨 Personalización del Setup

### Setup con dominio personalizado

```bash
wildmask setup --domain local
```

### Setup sin resolver (solo daemon)

```bash
wildmask setup --skip-resolver
```

### Setup sin proxy

```bash
wildmask setup --skip-proxy
```

### Setup completo personalizado

```bash
wildmask setup --domain myapp --skip-proxy
```

---

## 🔧 Requisitos del Sistema

### Todos los Sistemas
- Node.js >= 18.0.0
- pnpm >= 9.0.0 (o npm/yarn)

### macOS
- `/etc/resolver/` writable (requiere sudo)
- `dscacheutil` disponible
- `lsof` disponible

### Linux
- `systemd-resolved` o `dnsmasq`
- Permisos sudo para configuración

### Windows
- PowerShell o WSL
- Admin privileges para configuración de red

---

## 🧪 Verificar Instalación

### Script automático

```bash
cd /Users/ivanrubiosubsierra/wildmask
./validate-installation.sh
```

### Verificación manual

```bash
# 1. Versión
wildmask --version

# 2. Ayuda
wildmask --help

# 3. Configuración
wildmask config path

# 4. Si está configurado
wildmask status
wildmask list
wildmask doctor
```

---

## 🐛 Troubleshooting

### "wildmask: command not found"

**Causa**: El paquete no está en el PATH

**Solución:**
```bash
# Si instalaste localmente
cd /Users/ivanrubiosubsierra/wildmask
pnpm link --global

# Verificar
which wildmask

# O usa directamente
node packages/cli/dist/cli.js --help
```

### "Configuration not found"

**Causa**: No has ejecutado `init` o `setup`

**Solución:**
```bash
wildmask setup
# o
wildmask init
```

### "Permission denied" durante setup

**Causa**: El paso de instalación del resolver requiere sudo

**Solución:**
```bash
# El setup pedirá la contraseña automáticamente
wildmask setup

# O hazlo manualmente
sudo wildmask install
```

### Daemon no inicia

**Causa**: Puerto ocupado o configuración inválida

**Solución:**
```bash
# Diagnósticos
wildmask doctor --fix

# Ver qué está usando el puerto
lsof -i :5354

# Reiniciar con validación
wildmask restart
```

---

## 📚 Próximos Pasos

Después de la instalación:

1. **Lanza el TUI** para explorar visualmente:
   ```bash
   wildmask
   ```

2. **Añade tus servicios**:
   ```bash
   wildmask add myapp --target 127.0.0.1 --port 3000
   ```

3. **Prueba con un servidor dummy**:
   ```bash
   wildmask serve-api --port 3000 --name test --add
   curl http://test.test:3000/health
   ```

4. **Configura el smart proxy** (opcional):
   ```bash
   sudo wildmask smart-proxy --port 80
   # Ahora: curl http://test.test/health (sin puerto)
   ```

5. **Instala shell completion**:
   ```bash
   wildmask completion zsh > ~/.zsh/completions/_wildmask
   ```

---

## 🎊 ¡Listo!

WildMask está instalado y listo para usar.

**Documentación completa:**
- `README.md` - Overview y comandos principales
- `GETTING_STARTED.md` - Tutorial paso a paso
- `COMMANDS_REFERENCE.md` - Referencia completa
- `PROXY_GUIDE.md` - Guía del proxy
- `INSTALL_DNS.md` - Detalles de DNS

**Soporte:**
- Ejecuta `wildmask doctor` para diagnósticos
- Revisa los logs en `~/.wildmask/logs/`
- Consulta la documentación en el proyecto

---

**Happy DNS Masking! 🎭**
