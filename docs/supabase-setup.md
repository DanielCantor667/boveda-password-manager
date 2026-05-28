# Configuración de Supabase

Sigue estos pasos para configurar Supabase para Bóveda.

---

## 1. Crear un proyecto Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Crea un nuevo proyecto
3. Guarda la **URL del proyecto** y la **anon key** de la sección Settings > API

## 2. Ejecutar el schema SQL

En el panel de Supabase, ve a **SQL Editor** y ejecuta el contenido de:

```
resources/supabase-schema.sql
```

Esto creará:
- Tabla `entries` con RLS
- Tabla `usernames` con RLS
- Políticas de seguridad para ambas tablas

## 3. Habilitar autenticación por email

1. Ve a **Authentication > Providers**
2. Asegúrate de que **Email** esté habilitado
3. Deshabilita **Confirm email** si quieres registro inmediato (opcional)

## 4. Configurar la app

Copia `.env.example` a `.env` y completa:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## 5. Migrar datos existentes (opcional)

Si ya tienes datos en el JSON local:

```bash
node migrate-to-supabase.js tu@email.com tu-contraseña
```

## 6. Verificar la conexión

Inicia la app y regístrate con un email y contraseña. Si todo funciona:
- El registro se completa en Supabase
- Las entradas se sincronizan
- Los cambios en tiempo real se reflejan entre dispositivos
