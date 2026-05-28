# Guía de desarrollo

## Entorno de desarrollo

### Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x
- macOS (para build)

### Setup inicial

```bash
git clone https://github.com/DanielCantor667/boveda-password-manager.git
cd boveda-password-manager
npm install
npm start
```

### Hot reload

Electron no tiene hot reload nativo. Para desarrollo:

1. Mantén `npm start` corriendo
2. Para ver cambios en el renderer: recarga con `Cmd+R`
3. Para cambios en `main.js`, `preload.js` o `database.js`: reinicia la app

---

## Estructura del proyecto

```
boveda-password-manager/
├── main.js           # Electron main process
├── preload.js        # Context bridge (IPC)
├── build.sh          # Script de build para macOS
├── src/
│   ├── index.html    # UI principal
│   ├── styles.css    # Estilos (tema oscuro)
│   ├── renderer.js   # Lógica del frontend
│   ├── database.js   # Capa de datos (local + Supabase)
│   ├── generator.js  # Generador de contraseñas
│   └── supabase.js   # Cliente Supabase
├── resources/        # Seed data + schema SQL
├── assets/           # Íconos de la app
├── docs/             # Documentación
└── .github/          # CI/CD + templates
```

---

## Flujo de trabajo típico

### Agregar una nueva funcionalidad

1. Identifica qué capa afecta el cambio:
   - **UI**: `src/index.html`, `src/styles.css`, `src/renderer.js`
   - **Lógica de negocio**: `src/database.js`
   - **Nuevo IPC**: `main.js` + `preload.js`
2. Implementa el cambio
3. Prueba manualmente con `npm start`
4. Si agregas dependencias: `npm install <paquete>`

### Ejemplo: Agregar un nuevo IPC

1. En `main.js`:
```javascript
ipcMain.handle('mi-nuevo-comando', async (_event, param) => {
  const resultado = await database.miFuncion(param);
  return resultado;
});
```

2. En `database.js`:
```javascript
async function miFuncion(param) {
  // lógica aquí
}
module.exports = { /* ..., */ miFuncion };
```

3. En `preload.js`:
```javascript
miNuevoComando: (param) => ipcRenderer.invoke('mi-nuevo-comando', param),
```

---

## Build

### macOS

```bash
npm run build
# o
./build.sh
```

Esto genera:
- `dist-new/Bóveda.app` — Bundle de la app
- `dist-new/Bóveda.dmg` — Instalador DMG

El script:
1. Limpia `dist-new/`
2. Copia Electron.app y lo renombra a `Bóveda.app`
3. Copia el código fuente en el bundle
4. Configura Info.plist
5. Firma ad-hoc todos los ejecutables
6. Genera el DMG con symlink a `/Applications`

---

## Convenciones

### Código

| Regla | Estándar |
|---|---|
| Indentación | 2 espacios |
| Comillas | Simples en JS |
| Punto y coma | Obligatorios |
| Nombres de variables | camelCase |
| Nombres de clases CSS | kebab-case |
| Nombres de archivos | kebab-case.js |
| Módulos | CommonJS (`require`/`module.exports`) |

### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): mensaje en español

Ejemplos:
feat(database): agregar exportación CSV
fix(auth): corregir error de sesión expirada
docs(readme): actualizar instrucciones
```

---

## Debugging

### Logs de la app

La app usa `console.log`/`console.warn` para depuración. Puedes ver los logs:

- **Main process logs**: Salen en la terminal donde ejecutaste `npm start`
- **Renderer logs**: Abre DevTools con `Cmd+Option+I` dentro de la app

### Errores comunes

| Error | Causa probable | Solución |
|---|---|---|
| `Cannot find module 'electron'` | Dependencias no instaladas | `npm install` |
| `Supabase connection failed` | Sin internet o URL incorrecta | Verifica `.env` |
| `User already registered` | Email ya existe en Supabase | Usa otro email o inicia sesión |
| `entries-changed no emitido` | Realtime no conectado | Verifica sesión Supabase |

---

## Testing

Actualmente no hay tests automatizados. Las pruebas son manuales:

1. `npm start` para la app
2. Prueba CRUD de entradas
3. Prueba login local (sin conexión)
4. Prueba login Supabase (con conexión)
5. Prueba generador de contraseñas
6. Prueba build: `npm run build`

---

## Próximos pasos técnicos

- [ ] Migrar a `electron-builder` para builds cross-platform
- [ ] Agregar ESLint con configuración estándar
- [ ] Agregar tests unitarios con Vitest
- [ ] Agregar tests end-to-end con Playwright
- [ ] Migrar a SQLite local (mejor performance y seguridad)
- [ ] CI/CD completo con GitHub Actions
