# 🧪 Guía de Testing del TUI

Esta guía te ayuda a probar todas las funcionalidades del TUI de WildMask.

## 🚀 Lanzar el TUI

```bash
cd /Users/ivanrubiosubsierra/wildmask
node packages/cli/dist/cli.js
# o simplemente:
node packages/cli/dist/cli.js tui
```

## ✅ Tests a Realizar

### 1️⃣ Dashboard Principal

**Qué probar:**
- [ ] Se muestra el StatusBar con versión, estado del daemon, dominio y hora
- [ ] Se muestra la lista de mappings con FQDNs completos
- [ ] El estado del daemon es correcto (🟢 Running o 🔴 Stopped)
- [ ] Los health status indicators aparecen para cada mapping
- [ ] El HelpBar muestra los shortcuts correctos

**Teclas a probar:**
- [ ] `↑` / `↓` - Navegación entre mappings
- [ ] `j` / `k` - Navegación alternativa (vim-style)
- [ ] `q` - Sale del TUI
- [ ] `Ctrl+C` - Sale del TUI

### 2️⃣ Añadir Mapping (Tecla `n`)

**Pasos:**
1. Presiona `n` en el dashboard
2. El formulario "New Mapping" debería aparecer
3. Completa cada campo presionando Enter:
   - **Host**: `test-new` (prueba validación con caracteres inválidos)
   - **Domain**: `local` (o déjalo vacío para default)
   - **Target**: `127.0.0.1` (prueba IP inválida como `999.999.999.999`)
   - **Port**: `5000` (prueba puerto inválido como `99999`)
   - **Protocol**: `http` (prueba protocolo inválido como `ftp`)

**Qué verificar:**
- [ ] Cada campo muestra hints contextuales
- [ ] La validación muestra errores en rojo si introduces datos inválidos
- [ ] Presionar `Escape` cancela y vuelve al dashboard
- [ ] Al completar todos los campos, el mapping se añade a la lista
- [ ] El nuevo mapping aparece con su FQDN completo

### 3️⃣ Editar Mapping (Tecla `e`)

**Pasos:**
1. Navega a un mapping con `↑`/`↓`
2. Presiona `e`
3. El formulario "Edit Mapping" debería aparecer con valores pre-llenados
4. Modifica algún campo (ej: cambia el puerto)
5. Presiona Enter hasta completar

**Qué verificar:**
- [ ] Los valores actuales se muestran correctamente
- [ ] Puedes modificar cada campo
- [ ] `Escape` cancela la edición
- [ ] Los cambios se reflejan en la lista

### 4️⃣ Eliminar Mapping (Tecla `d`)

**Pasos:**
1. Navega a un mapping
2. Presiona `d`
3. El mapping debería desaparecer inmediatamente

**Qué verificar:**
- [ ] El mapping se elimina
- [ ] La lista se actualiza
- [ ] El cursor se ajusta si era el último item

### 5️⃣ Refresh (Tecla `r`)

**Pasos:**
1. Haz cambios desde CLI en otra terminal:
   ```bash
   node packages/cli/dist/cli.js add cli-test --target 127.0.0.1 --port 7000
   ```
2. Vuelve al TUI y presiona `r`

**Qué verificar:**
- [ ] Los cambios del CLI aparecen en el TUI
- [ ] El health status se actualiza
- [ ] El estado del daemon se refresca

### 6️⃣ Logs Viewer (Tecla `l`)

**Pasos:**
1. Presiona `l` en el dashboard
2. Debería aparecer el panel de logs

**Qué verificar:**
- [ ] Se muestran los logs del daemon
- [ ] Los logs tienen color coding (debug=blanco, info=azul, warn=amarillo, error=rojo)
- [ ] Los logs se actualizan automáticamente cada 2 segundos
- [ ] Muestra "Showing last X entries (auto-refresh every 2s)"
- [ ] `Escape` vuelve al dashboard

### 7️⃣ Diagnostics (Tecla `Ctrl+D`)

**Pasos:**
1. Presiona `Ctrl+D` en cualquier vista
2. El panel de diagnósticos debería aparecer

**Qué verificar:**
- [ ] Muestra "Running diagnostics..." mientras carga
- [ ] Muestra los 4 checks: Daemon Process, Port Available, System Resolver, Configuration File
- [ ] Cada check tiene icono (✅/❌/⚠️) y color
- [ ] El summary muestra "X passed · Y failed · Z warnings"
- [ ] `f` toggle las "Suggested Fixes"
- [ ] `Escape` vuelve al dashboard

### 8️⃣ Start/Stop Daemon (Tecla `s`)

**Pasos:**
1. Si el daemon está corriendo, presiona `s` para detenerlo
2. El StatusBar debería cambiar a 🔴 Stopped
3. El HelpBar debería cambiar de `[s] Stop` a `[s] Start`
4. Presiona `s` de nuevo para iniciarlo
5. El StatusBar debería cambiar a 🟢 Running

**Qué verificar:**
- [ ] El toggle funciona correctamente
- [ ] El status se actualiza en el StatusBar
- [ ] El HelpBar refleja el estado correcto
- [ ] Mientras está toggling muestra "[s] Starting..." o "[s] Stopping..."
- [ ] Después de iniciar, los mappings se cargan correctamente

### 9️⃣ Navegación con Teclado

**Teclas a probar en el dashboard:**
- [ ] `↑` - Sube en la lista
- [ ] `↓` - Baja en la lista
- [ ] `k` - Sube (vim-style)
- [ ] `j` - Baja (vim-style)
- [ ] El cursor visual se mueve (highlighting)
- [ ] No se puede subir más del primer item
- [ ] No se puede bajar más del último item

### 🔟 Escapar de Cualquier Vista

**Prueba en cada vista:**
- [ ] Dashboard → `Escape` → Sale del TUI
- [ ] Add Form → `Escape` → Vuelve al dashboard
- [ ] Edit Form → `Escape` → Vuelve al dashboard
- [ ] Logs → `Escape` → Vuelve al dashboard
- [ ] Doctor → `Escape` → Vuelve al dashboard

## 🐛 Problemas Comunes y Soluciones

### El TUI muestra "No mappings" pero hay mappings en CLI

**Causa**: El TUI no cargó los datos correctamente

**Solución**:
- Presiona `r` para refresh
- Verifica que el config file existe: `node packages/cli/dist/cli.js config path`
- Verifica que hay mappings: `node packages/cli/dist/cli.js list`

### El daemon muestra "Stopped" pero está corriendo

**Causa**: El PID file podría estar corrupto

**Solución**:
- Verifica con CLI: `node packages/cli/dist/cli.js status`
- Reinicia el daemon desde CLI: `node packages/cli/dist/cli.js restart`
- Refresca el TUI: presiona `r`

### Escape no funciona en el formulario

**Causa**: Bug en el manejo de input

**Solución**: 
- Este bug debería estar arreglado en la versión actual
- Si persiste, usa `Ctrl+C` para salir y reporta el issue

### El TUI se ve corrupto o con caracteres extraños

**Causa**: Terminal no soporta los caracteres Unicode

**Solución**:
- Usa una terminal moderna (iTerm2, Hyper, Windows Terminal)
- Verifica que tu terminal tenga encoding UTF-8
- Prueba redimensionar la ventana

### Las teclas no responden

**Causa**: Posible conflicto de `useInput`

**Solución**:
- Asegúrate de estar en la vista correcta (ej: `n` solo funciona en dashboard)
- Prueba presionar `Escape` para volver al dashboard
- Reinicia el TUI

## 🎯 Checklist Completo

### Funcionalidades Básicas
- [ ] TUI se lanza correctamente
- [ ] Dashboard muestra información correcta
- [ ] Navegación funciona
- [ ] Escape funciona en todas las vistas
- [ ] Quit funciona (`q` o `Ctrl+C`)

### CRUD Operations
- [ ] Añadir mapping (`n`)
- [ ] Editar mapping (`e`)
- [ ] Eliminar mapping (`d`)
- [ ] Lista se actualiza después de cambios

### Features Avanzados
- [ ] Refresh manual (`r`)
- [ ] Ver logs (`l`)
- [ ] Run diagnostics (`Ctrl+D`)
- [ ] Start/Stop daemon (`s`)
- [ ] Health status indicators funcionan
- [ ] Auto-refresh cada 5 segundos

### Validación
- [ ] Formulario valida host
- [ ] Formulario valida domain
- [ ] Formulario valida target IP
- [ ] Formulario valida port (1-65535)
- [ ] Formulario valida protocol (http/https/tcp)
- [ ] Errores se muestran en rojo

### UX
- [ ] Hints contextuales en formulario
- [ ] Colors y emojis apropiados
- [ ] Bordes redondeados y diseño limpio
- [ ] Reloj en tiempo real en StatusBar
- [ ] HelpBar muestra shortcuts relevantes
- [ ] Estados de carga (loading spinners)

## 🎉 Si Todos los Tests Pasan

¡Felicidades! El TUI está completamente funcional. Puedes:

1. **Usar el TUI como herramienta principal** de gestión
2. **Alternar entre CLI y TUI** según prefieras
3. **Gestionar mappings visualmente** desde el dashboard
4. **Monitorear health status** en tiempo real
5. **Ver logs** sin salir del TUI
6. **Run diagnostics** con un shortcut

## 📝 Reportar Issues

Si encuentras algún problema:

1. Anota qué tecla presionaste
2. En qué vista estabas
3. Qué esperabas que pasara
4. Qué pasó realmente
5. Los logs de consola (si hay errores)

Ejecuta para más info:
```bash
node packages/cli/dist/cli.js doctor
```

---

**¡Happy Testing!** 🚀
