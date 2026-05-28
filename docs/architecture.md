# Arquitectura de Bóveda

## Visión general

Bóveda es una aplicación de escritorio construida con **Electron** que sigue una arquitectura **offline-first** con sincronización opcional en la nube. Está diseñada para funcionar completamente sin conexión, utilizando Supabase como un complemento para autenticación, almacenamiento remoto y actualizaciones en tiempo real.

---

## Capas del sistema

```
┌────────────────────────────────────────────────────────────┐
│                      RENDERER PROCESS                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  index.html  ←→  renderer.js  ←→  styles.css         │  │
│  │              (UI + lógica de presentación)            │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │ window.api (IPC)                  │
│                         ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   preload.js                          │  │
│  │            (contextBridge → ipcRenderer)              │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │ IPC (invoke/handle)
┌─────────────────────────┼──────────────────────────────────┐
│                         ▼                                   │
│                       MAIN PROCESS                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    main.js                            │  │
│  │   ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │  │
│  │   │   Auth IPC   │  │  Entries IPC │  │  Utils    │  │  │
│  │   │ (signUp/in)  │  │ (CRUD)       │  │ (gen,clip)│  │  │
│  │   └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │  │
│  └──────────┼───────────────┼─────────────────┼───────┘  │
│             ▼               ▼                  ▼           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                database.js (Data Layer)                │  │
│  │                                                       │  │
│  │  ┌─────────────────────┐   ┌─────────────────────┐   │  │
│  │  │   Local Store        │   │   Supabase Client   │   │  │
│  │  │   (JSON file)        │◄──►  (Cloud Sync)       │   │  │
│  │  │                      │   │                      │   │  │
│  │  │  • reads/writes JSON │   │  • Auth (email/pwd) │   │  │
│  │  │  • migra datos       │   │  • CRUD remoto      │   │  │
│  │  │  • maneja seed       │   │  • Realtime (WS)    │   │  │
│  │  └─────────────────────┘   └─────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Flujo de comunicación

### 1. Renderer → Main (IPC)

El renderer **nunca** accede directamente al sistema de archivos ni a Node.js. Toda comunicación ocurre a través del `contextBridge` expuesto en `preload.js`.

```javascript
// preload.js
contextBridge.exposeInMainWorld('api', {
  getEntries: () => ipcRenderer.invoke('get-entries'),
  addEntry: (entry) => ipcRenderer.invoke('add-entry', entry),
  // ...
});
```

### 2. Main Process (main.js)

El proceso principal recibe los comandos IPC y los delega a `database.js`:

```javascript
ipcMain.handle('add-entry', async (_event, entry) => {
  return await database.addEntry(entry);
});
```

### 3. Database Layer (database.js)

`database.js` es el corazón del sistema. Maneja:

- **Local store**: Archivo JSON en `~/Library/Application Support/contrasenas/contrasenas.json`
- **Supabase sync**: Push/pull bidireccional con Supabase
- **Auth**: Login local + Supabase Auth
- **Migraciones**: Transformación automática de datos legacy
- **Realtime**: Suscripción WebSocket a cambios remotos

---

## Almacenamiento local

### Formato del JSON

```json
{
  "entries": [
    {
      "id": 10,
      "_supabaseId": 42,
      "_synced": true,
      "title": "KLINIU - Principal",
      "credentials": [
        {
          "id": 100,
          "label": "Principal",
          "username": "admin@kliniu.com",
          "password": "Kliniu4312*"
        }
      ],
      "url": "https://kliniu.com",
      "notes": "Notas opcionales",
      "theme": {
        "background": "#0d1117",
        "borderColor": "#30363d",
        "titleColor": "#f0f6fc",
        "buttonColor": "#238636"
      },
      "createdAt": "2026-05-28T10:00:00.000Z",
      "updatedAt": "2026-05-28T10:00:00.000Z"
    }
  ],
  "users": [
    {
      "id": "local-user",
      "username": "brandon",
      "email": "",
      "password": "brandon123"
    }
  ],
  "nextId": 19
}
```

### Campos especiales

| Campo | Descripción |
|---|---|
| `_supabaseId` | ID del registro en Supabase (para sincronización) |
| `_synced` | Indica si el entry está sincronizado con la nube |
| `id` (negativo) | IDs negativos son temporales (no han sido asignados por Supabase aún) |

---

## Sincronización con Supabase

### Flujo de sync

1. **On login**: Se obtienen todos los entries remotos y se mezclan con los locales
2. **On create/update**: El entry se guarda localmente y se hace push a Supabase
3. **On delete**: Se elimina localmente y en Supabase
4. **Realtime**: WebSocket escucha cambios remotos y actualiza el store local
5. **Fallback**: Si Supabase no está disponible, la app sigue funcionando offline

### Prioridad de datos

```
Local store ←→ Supabase
     ↑             ↑
   siempre     cuando hay
   disponible   conexión
```

---

## Autenticación

Bóveda soporta dos modos de autenticación:

### Local (offline)
- Usuario y contraseña almacenados en el JSON local
- Por defecto: `brandon` / `brandon123`
- Funciona sin conexión a internet

### Supabase Auth
- Email y contraseña
- Sesión persistente via JWT
- Provee sincronización en la nube
- El sistema detecta automáticamente si hay conexión y falla a local si es necesario

---

## Seguridad

### Medidas implementadas

- **Context isolation**: `contextIsolation: true`
- **Node integration desactivada**: `nodeIntegration: false`
- **Generación de contraseñas**: `crypto.randomBytes` (criptográficamente seguro)
- **Auto-borrado del portapapeles**: 30 segundos después de copiar una contraseña
- **Contenido sensible oculto por defecto**: Las contraseñas se muestran como `••••••••` hasta que el usuario explícitamente las revela
- **CSP**: Content Security Policy configurada en el HTML
- **Ad-hoc code signing**: El build script firma el bundle para macOS

### Pendiente (futuro)

- Cifrado local de la base de datos (SQLite + encryption-at-rest)
- Soporte para Windows/Linux con firmado de código
- Integración con llavero del sistema (Keychain)
