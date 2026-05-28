<div align="center">
  <img src="assets/icon.png" alt="Bóveda" width="96" height="96">
  <h1 align="center">Bóveda</h1>
  <p align="center">
    Gestor de contraseñas de escritorio — offline-first, con sincronización en la nube
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#arquitectura">Arquitectura</a> •
    <a href="#stack">Stack</a> •
    <a href="#instalación">Instalación</a> •
    <a href="#configuración">Configuración</a> •
    <a href="#scripts">Scripts</a> •
    <a href="#roadmap">Roadmap</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Electron-41.7-47848F?logo=electron&logoColor=white" alt="Electron">
    <img src="https://img.shields.io/badge/Supabase-2.106-3FCF8E?logo=supabase&logoColor=white" alt="Supabase">
    <img src="https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
    <img src="https://img.shields.io/badge/Plataforma-macOS-lightgrey?logo=apple" alt="Platform">
  </p>
</div>

---

## Descripción

**Bóveda** es un gestor de contraseñas de escritorio construido con Electron. Está diseñado para ser **rápido, seguro y offline-first**: tus contraseñas se almacenan localmente y se sincronizan opcionalmente con Supabase cuando hay conexión.

Cada entrada puede contener **múltiples credenciales** (útil para servicios con varios usuarios o roles), incluye un **generador de contraseñas** criptográficamente seguro y permite personalizar la **apariencia visual** de cada tarjeta.

---

## Features

| Característica | Detalle |
|---|---|
| **🔐 Gestión de credenciales** | CRUD completo con múltiples credenciales por entrada |
| **🎲 Generador de contraseñas** | Longitud configurable, mayúsculas, minúsculas, dígitos, símbolos |
| **🎨 Temas por entrada** | Personaliza color de fondo, borde, título y botón por tarjeta |
| **🔍 Búsqueda** | Filtra por título, URL, nombre de usuario y etiqueta |
| **🏢 Agrupación por empresa** | Las entradas se organizan automáticamente en grupos colapsables |
| **☁️ Sincronización Supabase** | Opcional. Autenticación, almacenamiento remoto y actualizaciones en tiempo real |
| **📴 Modo offline** | Funciona sin conexión; sincroniza cuando hay red |
| **👤 Autenticación híbrida** | Soporta login local (offline) y Supabase Auth |
| **📋 Copiado seguro** | Copia al portapapeles con auto-borrado a los 30 segundos |
| **🔒 Aislamiento de contexto** | `contextIsolation: true`, `nodeIntegration: false` |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  Electron Main Process               │
│                   main.js + preload.js                │
├─────────────────────────────────────────────────────┤
│                       │ IPC                           │
├─────────────────────────────────────────────────────┤
│                 Renderer Process                      │
│            index.html + renderer.js + styles.css      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────┐    ┌────────────────────┐    │
│  │   Database Layer    │    │    Supabase Client  │    │
│  │   (Local JSON)      │◄──►│   (Cloud Sync)     │    │
│  └────────────────────┘    └────────────────────┘    │
│                                                       │
│  ┌────────────────────┐    ┌────────────────────┐    │
│  │ Password Generator  │    │      Clipboard      │    │
│  │   (crypto.random)   │    │   (auto-clear)      │    │
│  └────────────────────┘    └────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Flujo de datos

1. El **Renderer** envía comandos via `window.api` (IPC)
2. El **Main Process** recibe los comandos y opera sobre la base de datos local
3. Si hay sesión de Supabase activa, los cambios se replican al remoto
4. Las actualizaciones remotas llegan via **WebSocket (Realtime)** y se mezclan con datos locales
5. Todo funciona offline: Supabase es un plus, no un requisito

---

## Stack

| Capa | Tecnología |
|---|---|
| **Runtime** | Electron 41 |
| **Lenguaje** | JavaScript (CommonJS) |
| **Frontend** | HTML5 + CSS3 + Vanilla JS |
| **Estilos** | CSS Custom Properties (tema oscuro) |
| **Base de datos local** | JSON file (vía `fs/promises`) |
| **Cloud** | Supabase (PostgreSQL + Auth + Realtime) |
| **Build** | Bash script personalizado |
| **Distribución** | DMG (macOS) |

---

## Instalación

### Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **macOS** (para build y distribución)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/DanielCantor667/boveda-password-manager.git
cd boveda-password-manager

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm start
```

---

## Configuración

### Supabase (opcional — necesario solo para sincronización en la nube)

Copia el archivo de ejemplo y completa tus credenciales:

```bash
cp .env.example .env
```

Luego edita `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
```

> **Nota**: Si no configuras Supabase, la app funciona en modo completamente local con el usuario por defecto (`brandon` / `brandon123`).

Para configurar Supabase desde cero, sigue la [guía de configuración de Supabase](docs/supabase-setup.md).

---

## Scripts

| Script | Comando | Descripción |
|---|---|---|
| `start` | `electron .` | Inicia la app en modo desarrollo |
| `build` | `./build.sh` | Genera el bundle `.app` y el DMG en `dist-new/` |
| `build:mac` | `./build.sh` | Alias de `build` |

---

## Roadmap

| Hito | Versión | Estado |
|---|---|---|
| App funcional offline + Supabase | v1.0.0 | ✅ **Listo** |
| Migrar a electron-builder | v1.1.0 | 🔜 Próximo |
| Tests automatizados | v1.1.0 | 🔜 Próximo |
| Soporte Windows / Linux | v1.2.0 | 📅 Planeado |
| Export / Import CSV y JSON | v1.2.0 | 📅 Planeado |
| Cifrado local (SQLite + encryption) | v2.0.0 | 📅 Planeado |
| Autofill e integración con navegador | v2.1.0 | 🔮 Futuro |
| Soporte multi-idioma | v2.2.0 | 🔮 Futuro |

---

## Contribuir

Las contribuciones son bienvenidas. Por favor lee [CONTRIBUTING.md](CONTRIBUTING.md) para conocer el flujo de trabajo, estándares de código y buenas prácticas.

---

## Licencia

Distribuido bajo licencia MIT. Ver [LICENSE](LICENSE) para más información.

---

<div align="center">
  <sub>Hecho con ❤️ por Daniel Cantor</sub>
</div>
