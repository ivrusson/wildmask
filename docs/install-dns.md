# 🔧 DNS Resolver Installation Guide

Este guía te ayudará a configurar el resolver DNS del sistema para que las consultas a `*.test` se resuelvan automáticamente a través de WildMask.

## 📋 Requisitos Previos

1. **WildMask iniciado**: Asegúrate de que el daemon esté corriendo
   ```bash
   wildmask status
   # Debería mostrar "● Running"
   
   # Si no está corriendo:
   wildmask up
   ```

2. **Puerto configurado**: Verifica el puerto que usa el daemon
   ```bash
   wildmask status
   # Nota el puerto (ej: 5354)
   ```

## 🍎 macOS

### Instalación Automática

```bash
# Ejecuta el comando de instalación
sudo wildmask install
```

Esto creará automáticamente:
- `/etc/resolver/test` con la configuración DNS
- Flusheará el caché DNS

### Instalación Manual

Si prefieres hacerlo manualmente:

```bash
# 1. Crea el directorio
sudo mkdir -p /etc/resolver

# 2. Crea el archivo de configuración (reemplaza 5354 con tu puerto)
echo "nameserver 127.0.0.1
port 5354" | sudo tee /etc/resolver/test

# 3. Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Verificación

```bash
# Verifica que el resolver esté configurado
cat /etc/resolver/test

# Debería mostrar:
# nameserver 127.0.0.1
# port 5354

# Prueba la resolución DNS
dig api.test @127.0.0.1 -p 5354

# Prueba con curl
curl http://api.test:3000
```

### Desinstalación

```bash
# Automática
sudo wildmask uninstall

# Manual
sudo rm /etc/resolver/test
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

## 🐧 Linux

### Con systemd-resolved (Ubuntu 18.04+, Fedora, etc.)

```bash
# Instalación automática
sudo wildmask install

# Manual
sudo mkdir -p /etc/systemd/resolved.conf.d
echo "[Resolve]
DNS=127.0.0.1:5354
Domains=~test" | sudo tee /etc/systemd/resolved.conf.d/test.conf

sudo systemctl restart systemd-resolved
```

### Con dnsmasq (Ubuntu/Debian antiguo)

```bash
# 1. Instala dnsmasq si no está instalado
sudo apt install dnsmasq

# 2. Configura el resolver
echo "server=/test/127.0.0.1#5354" | sudo tee /etc/dnsmasq.d/test.conf

# 3. Reinicia dnsmasq
sudo systemctl restart dnsmasq
```

### Verificación

```bash
# Verifica la configuración
systemd-resolve --status | grep -A5 "test"

# O con dnsmasq
cat /etc/dnsmasq.d/test.conf

# Prueba la resolución
dig api.test @127.0.0.1 -p 5354
curl http://api.test:3000
```

### Desinstalación

```bash
# Automática
sudo wildmask uninstall

# Manual (systemd-resolved)
sudo rm /etc/systemd/resolved.conf.d/test.conf
sudo systemctl restart systemd-resolved

# Manual (dnsmasq)
sudo rm /etc/dnsmasq.d/test.conf
sudo systemctl restart dnsmasq
```

## 🪟 Windows

**Nota**: El soporte para Windows está en desarrollo. Por ahora, puedes usar una de estas alternativas:

### Opción 1: Editar el archivo hosts (Simple pero limitado)

```powershell
# Ejecuta como Administrador
notepad C:\Windows\System32\drivers\etc\hosts

# Añade líneas para cada mapping:
127.0.0.1 api.test
127.0.0.1 frontend.test
```

**Limitación**: No soporta wildcards como `*.api.test`

### Opción 2: Usar Acrylic DNS Proxy (Recomendado)

1. Descarga [Acrylic DNS Proxy](https://mayakron.altervista.org/support/acrylic/Home.htm)
2. Instala y configura:
   ```
   # En AcrylicHosts.txt
   127.0.0.1 *.test
   ```
3. Configura tu adaptador de red para usar `127.0.0.1` como DNS

## 🧪 Testing

### 1. Verifica que el daemon esté corriendo

```bash
wildmask status
# ✅ Debe mostrar "● Running"
```

### 2. Prueba la resolución DNS directa

```bash
# Usando dig
dig api.test @127.0.0.1 -p 5354

# Debería responder con la IP configurada (ej: 127.0.0.1)
```

### 3. Prueba la resolución del sistema

```bash
# Sin especificar servidor DNS
ping api.test

# Debería resolver correctamente
```

### 4. Prueba con curl

```bash
# Si tienes un servidor corriendo en el puerto 3000:
wildmask serve-api --port 3000 --name api --add

# Prueba el acceso:
curl http://api.test:3000/health
```

## 🔍 Troubleshooting

### El DNS no resuelve

1. **Verifica el daemon**:
   ```bash
   wildmask status
   wildmask doctor
   ```

2. **Verifica el resolver**:
   ```bash
   # macOS
   cat /etc/resolver/test
   
   # Linux (systemd-resolved)
   systemd-resolve --status
   ```

3. **Flush DNS cache**:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

4. **Prueba directamente el daemon**:
   ```bash
   dig api.test @127.0.0.1 -p 5354
   ```

### Puerto ocupado

Si el puerto 5353 está ocupado (por mDNS/Bonjour):

1. **Usa un puerto alternativo**:
   ```bash
   # WildMask detectará automáticamente
   wildmask init --force
   ```

2. **Actualiza el resolver**:
   ```bash
   sudo wildmask uninstall
   sudo wildmask install
   ```

### Permisos denegados

Si ves errores de permisos:

```bash
# Asegúrate de usar sudo
sudo wildmask install

# O instala manualmente (ver arriba)
```

## 📚 Recursos Adicionales

- [Documentación completa](./README.md)
- [Troubleshooting avanzado](./docs/troubleshooting.md)
- [Configuración avanzada](./docs/configuration.md)

## 💡 Tips

1. **Usa dominios específicos**: `.test` es el recomendado por IETF
2. **Wildcards**: Configura `*.api.test` para subdominios
3. **Health checks**: Activa health checks para monitorear servicios
4. **Múltiples dominios**: Puedes instalar resolvers para varios TLDs

## 🎯 Quick Start (Completo)

```bash
# 1. Inicializa WildMask
wildmask init

# 2. Instala el resolver
sudo wildmask install

# 3. Añade un mapping
wildmask add api --target 127.0.0.1 --port 3000

# 4. Inicia el daemon
wildmask up

# 5. Lanza un servidor de prueba
wildmask serve-api --port 3000 --name api

# 6. Prueba!
curl http://api.test:3000/health
```

¡Listo! 🎉
