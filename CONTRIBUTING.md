# Contribuyendo a Bóveda

Gracias por tu interés en contribuir. Este documento establece las pautas y el flujo de trabajo para contribuir al proyecto.

---

## Índice

1. [Código de Conducta](#código-de-conducta)
2. [Cómo empezar](#cómo-empezar)
3. [Flujo de trabajo](#flujo-de-trabajo)
4. [Estándares de código](#estándares-de-código)
5. [Commits](#commits)
6. [Issues](#issues)
7. [Pull Requests](#pull-requests)

---

## Código de Conducta

Este proyecto sigue un código de conducta basado en el respeto mutuo. No se tolerará ningún tipo de discriminación, acoso o comportamiento inapropiado.

---

## Cómo empezar

1. Haz fork del repositorio
2. Clona tu fork: `git clone https://github.com/tu-usuario/boveda-password-manager.git`
3. Instala dependencias: `npm install`
4. Crea una rama para tu feature: `git checkout -b feat/mi-feature`

---

## Flujo de trabajo

```
main ──── merge ─────────────────►
              ▲
              └─── feat/mi-feature ──► PR
```

- **main**: Rama principal, siempre estable
- **feat/***: Nuevas funcionalidades
- **fix/***: Corrección de bugs
- **docs/***: Cambios en documentación
- **refactor/***: Refactorización de código

---

## Estándares de código

### JavaScript

- **ES2020** con módulos CommonJS
- Usar `const` y `let` — nunca `var`
- Funciones flecha preferidas sobre `function` donde tenga sentido
- Nombres descriptivos en español o inglés (consistente con el código existente)
- Mantener el patrón `archivo.js` sin comentarios inline a menos que sea necesario

### CSS

- Usar **CSS Custom Properties** para temas
- Prefijo `--` para variables
- Nombres de clases en kebab-case
- Mantener el tema oscuro como base

### HTML

- HTML semántico
- `id`s para elementos únicos, `class`es para elementos reutilizables
- Las traducciones e idioma van en español (por ahora)

### Estructura de archivos

```
src/           → Código fuente (renderer)
├── database.js    → Capa de datos
├── generator.js   → Generador de contraseñas
├── index.html     → UI
├── renderer.js    → Lógica del frontend
├── styles.css     → Estilos
└── supabase.js    → Cliente Supabase
main.js        → Proceso principal de Electron
preload.js     → Bridge de contexto
```

---

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <descripción>

[tipo]: fix, feat, docs, refactor, chore, style, test, security
[scope]: opcional (database, ui, auth, build, etc.)
```

Ejemplos:

```
feat(database): agregar soporte para exportar a CSV
fix(auth): corregir error al iniciar sesión sin conexión
docs(readme): actualizar instrucciones de instalación
refactor(ui): simplificar renderizado de tarjetas
```

---

## Issues

### Reportar bugs

Usa la plantilla de Bug Report. Incluye:

- Versión de la app
- Sistema operativo
- Pasos para reproducir
- Comportamiento esperado vs actual
- Logs de la consola si están disponibles

### Solicitar features

Usa la plantilla de Feature Request. Incluye:

- Descripción de la funcionalidad
- Caso de uso
- Comportamiento esperado
- Alternativas consideradas

---

## Pull Requests

1. Asegúrate de que tu código sigue los estándares
2. Mantén los PRs pequeños y enfocados en un solo cambio
3. Incluye una descripción clara de qué cambia y por qué
4. Referencia los issues relacionados (ej: `Closes #12`)
5. Verifica que la app sigue funcionando: `npm start`
6. Verifica que el build no se rompe: `npm run build`

### Template de PR

```markdown
## Descripción

[Descripción clara de los cambios]

## Tipo de cambio

- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Refactor
- [ ] Documentación

## ¿Cómo se probó?

[Pasos para verificar]

## Checklist

- [ ] El código sigue los estándares del proyecto
- [ ] Probé la app manualmente
- [ ] No hay errores en la consola
```

---

## Dudas

Si tienes preguntas, abre un issue con la etiqueta `question` o contacta al mantenedor.
