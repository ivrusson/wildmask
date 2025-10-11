# 🔀 Guía del Proxy Reverso con Wildcards

WildMask incluye un proxy reverso que te permite acceder a servicios usando el **número de puerto como subdominio**.

## 🎯 Concepto

En vez de recordar qué servicio corre en qué puerto, usa el puerto como subdominio:

```
3000.api.test → Redirige a 127.0.0.1:3000
3001.api.test → Redirige a 127.0.0.1:3001
8080.api.test → Redirige a 127.0.0.1:8080
```

## 🚀 Uso Rápido

### Opción 1: Con puerto explícito (sin sudo)

```bash
# 1. Inicia el proxy en puerto 8080
node packages/cli/dist/cli.js proxy --port 8080

# 2. Añade el mapping wildcard
node packages/cli/dist/cli.js add "*.api" --target 127.0.0.1 --port 8080

# 3. Instala el resolver (una vez)
sudo wildmask install

# 4. Reinicia el daemon
node packages/cli/dist/cli.js down && node packages/cli/dist/cli.js up

# 5. Accede especificando el puerto del proxy
curl http://3002.api.test:8080/health
curl http://3000.api.test:8080/
```

### Opción 2: Puerto 80 - Acceso directo (requiere sudo)

```bash
# 1. Inicia el proxy en puerto 80 (requiere sudo)
sudo node packages/cli/dist/cli.js proxy --port 80

# 2. Añade el mapping wildcard (si no lo has hecho)
node packages/cli/dist/cli.js add "*.api" --target 127.0.0.1 --port 80

# 3. Reinicia el daemon
node packages/cli/dist/cli.js down && node packages/cli/dist/cli.js up

# 4. Accede SIN especificar puerto
curl http://3002.api.test/health
curl http://3000.api.test/
```

## 📋 Ejemplo Completo

```bash
# Setup (una vez)
cd /Users/ivanrubiosubsierra/wildmask

# 1. Inicia algunos servicios de prueba en diferentes puertos
node packages/cli/dist/cli.js serve-api --port 3000 &
node packages/cli/dist/cli.js serve-api --port 3001 &
node packages/cli/dist/cli.js serve-api --port 3002 &

# 2. Inicia el proxy (elige una opción)
# Opción A: Puerto 8080 (sin sudo)
node packages/cli/dist/cli.js proxy --port 8080 &

# Opción B: Puerto 80 (con sudo, acceso directo)
sudo node packages/cli/dist/cli.js proxy --port 80 &

# 3. Configura el mapping wildcard
node packages/cli/dist/cli.js add "*.api" --target 127.0.0.1 --port 8080
# (o --port 80 si usaste sudo)

# 4. Reinicia el daemon para cargar el nuevo mapping
node packages/cli/dist/cli.js down
node packages/cli/dist/cli.js up

# 5. Prueba!
# Si usaste puerto 8080:
curl http://3000.api.test:8080/health
curl http://3001.api.test:8080/api/users
curl http://3002.api.test:8080/api/test

# Si usaste puerto 80:
curl http://3000.api.test/health
curl http://3001.api.test/api/users
curl http://3002.api.test/api/test
```

## 🔧 Port Forwarding (Alternativa sin sudo)

Si no quieres usar sudo pero quieres acceso directo sin puerto:

### macOS - pfctl

```bash
# Redirige puerto 80 → 8080
echo "rdr pass on lo0 inet proto tcp from any to any port 80 -> 127.0.0.1 port 8080" | sudo pfctl -ef -
```

### Linux - iptables

```bash
# Redirige puerto 80 → 8080
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
sudo iptables -t nat -A OUTPUT -p tcp --dport 80 -j REDIRECT --to-port 8080
```

## 🎭 Patrones Personalizados

Por defecto, el proxy usa el patrón `*.api.test`, pero puedes cambiarlo:

```bash
# Usar *.backend.test
node packages/cli/dist/cli.js proxy --port 8080 --pattern backend

# Acceso:
curl http://3000.backend.test:8080/
```

## 🌐 Múltiples Dominios

Combina el proxy con dominios personalizados:

```bash
# Proxy para .local
node packages/cli/dist/cli.js proxy --port 8080 --pattern "api" &
node packages/cli/dist/cli.js add "*.api" --domain local --target 127.0.0.1 --port 8080

# Acceso:
curl http://3000.api.local:8080/health
```

## 💡 Casos de Uso

### 1. Microservicios

```bash
# Backend en 3000, Auth en 3001, DB API en 5432
curl http://3000.api.test/users
curl http://3001.api.test/login
curl http://5432.api.test/query
```

### 2. Diferentes ambientes

```bash
# Desarrollo
curl http://3000.api.dev:8080/

# Staging
curl http://3000.api.staging:8080/

# Production (local)
curl http://3000.api.prod:8080/
```

### 3. Versiones de API

```bash
# v1 en puerto 3000, v2 en puerto 4000
curl http://3000.api.test/
curl http://4000.api.test/
```

## 🐛 Troubleshooting

### El proxy no conecta

```bash
# 1. Verifica que el proxy esté corriendo
lsof -i :8080

# 2. Verifica que el servicio target esté corriendo
lsof -i :3000

# 3. Verifica el DNS
dscacheutil -q host -a name 3000.api.test
# Debe responder: 127.0.0.1

# 4. Prueba la conexión directa al proxy
curl -v http://127.0.0.1:8080/ -H "Host: 3000.api.test"
```

### DNS no resuelve

```bash
# Verifica el mapping
node packages/cli/dist/cli.js list

# Verifica el daemon
node packages/cli/dist/cli.js status

# Reinicia el daemon
node packages/cli/dist/cli.js down && node packages/cli/dist/cli.js up

# Flush DNS cache
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### Puerto ocupado

```bash
# Ver qué está usando el puerto
lsof -i :8080

# Usar otro puerto
node packages/cli/dist/cli.js proxy --port 8888
```

## 📚 Referencia Rápida

```bash
# Comandos principales
node packages/cli/dist/cli.js proxy --port 8080              # Iniciar proxy
node packages/cli/dist/cli.js add "*.api" --target ... --port 8080  # Añadir wildcard
node packages/cli/dist/cli.js down && node packages/cli/dist/cli.js up  # Reiniciar daemon

# Acceso
curl http://PORT.PATTERN.DOMAIN:PROXY_PORT/path

# Ejemplos
curl http://3000.api.test:8080/health
curl http://8080.backend.local:8080/status
```

## 🎉 Tips

1. **Usa puerto 80 con sudo** para acceso directo sin especificar puerto
2. **Port forwarding** es una alternativa si no quieres usar sudo
3. **Patrones personalizados** para diferentes tipos de servicios (`api`, `backend`, `frontend`)
4. **Múltiples proxies** pueden correr en diferentes puertos para diferentes patrones
5. **Combina con dominios** para máxima flexibilidad (`.test`, `.local`, `.dev`, etc.)

---

**Nota**: El proxy es completamente opcional. Puedes seguir usando mappings 1:1 tradicionales si prefieres:

```bash
node packages/cli/dist/cli.js add frontend --target 127.0.0.1 --port 3000
# Acceso: http://frontend.test (puerto se infiere del mapping)
```
