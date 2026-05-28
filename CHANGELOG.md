# Changelog

Todas las changes notables de Bóveda serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-05-28

### Changed

- Migrado a `electron-builder` para builds multiplataforma (macOS, Windows, Linux)
- Reemplazado `build.sh` por configuración declarativa en `package.json`
- Directorio de salida cambiado de `dist-new/` a `dist-electron/`

### Added

- Scripts NPM: `build:win`, `build:linux`, `build:all`, `pack`
- Icono `.ico` para Windows en `assets/`
- Soporte para NSIS installer en Windows
- Soporte para AppImage + deb en Linux
- Configuración de artefactos multiplataforma con versionado automático

---

## [1.0.0] — 2026-05-28

### Added

- Gestor de contraseñas de escritorio con Electron
- CRUD completo de entradas con múltiples credenciales por entrada
- Generador de contraseñas criptográficamente seguro (crypto.randomBytes)
- Temas visuales personalizables por entrada (fondo, borde, título, botón)
- Búsqueda en tiempo real por título, URL, usuario y etiqueta
- Agrupación automática por empresa con acordeones colapsables
- Autenticación híbrida: login local (offline) y Supabase Auth
- Sincronización con Supabase (PostgreSQL + Realtime)
- Modo offline-first: funciona sin conexión, sincroniza cuando hay red
- Copiado al portapapeles con auto-borrado a los 30 segundos
- Migración automática de entradas legacy (username/password único a múltiples credenciales)
- Script de migración CLI (`migrate-to-supabase.js`)
- Esquema SQL completo con Row Level Security
- Build script personalizado que genera DMG firmado para macOS
- Ventana con `contextIsolation: true` y `nodeIntegration: false`
- Tema oscuro con CSS Custom Properties
- Toast notifications
- Modal de recuperación de contraseña vía email

### Security

- Contraseñas generadas con `crypto.randomBytes` (no `Math.random`)
- Contraseñas ocultas por defecto con opción de mostrar/ocultar
- Portapapeles limpiado 30 segundos después de copiar una contraseña
- Context isolation y sin nodeIntegration en el renderer
