# Base de datos

## Esquema Supabase

### Tabla: `entries`

Almacena las entradas de contraseñas de los usuarios.

```sql
CREATE TABLE entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  entry_username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  color TEXT DEFAULT '',
  credentials JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Columnas

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `BIGSERIAL` | ID autoincremental |
| `user_id` | `UUID` | Referencia a `auth.users` |
| `title` | `TEXT` | Título de la entrada (ej: "KLINIU - Principal") |
| `entry_username` | `TEXT` | (Legacy) Nombre de usuario antiguo |
| `password` | `TEXT` | (Legacy) Contraseña antigua |
| `url` | `TEXT` | URL asociada |
| `notes` | `TEXT` | Notas adicionales |
| `color` | `TEXT` | (Legacy) Color hexadecimal antiguo |
| `credentials` | `JSONB` | Array de credenciales múltiples |
| `theme` | `JSONB` | Objeto de tema visual |
| `created_at` | `TIMESTAMPTZ` | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | Fecha de última actualización |

### Tabla: `usernames`

Mapea nombres de usuario a emails para login flexible.

```sql
CREATE TABLE usernames (
  username TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

Ambas tablas tienen RLS habilitado con políticas que restringen el acceso:

```sql
-- entries: cada usuario solo ve sus propias entradas
CREATE POLICY "Users can CRUD own entries"
  ON entries FOR ALL
  USING (auth.uid() = user_id);

-- usernames: solo lectura pública, inserción para usuarios autenticados
CREATE POLICY "Anyone can read usernames"
  ON usernames FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert"
  ON usernames FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

---

## Migraciones

### Migración 1: Multi-credential

La app migra automáticamente las entradas legacy (con `username`/`password` simple) al nuevo formato de múltiples credenciales:

```sql
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}'::jsonb;
```

### Migración desde local a Supabase

El script `migrate-to-supabase.js` permite migrar datos locales a Supabase:

```bash
node migrate-to-supabase.js <email> <password>
```

El script:
1. Busca el archivo JSON local en las rutas estándar
2. Se autentica en Supabase
3. Inserta todas las entradas locales asociadas al usuario autenticado

---

## Almacenamiento local

### Archivo

```
~/Library/Application Support/contrasenas/contrasenas.json
```

### Seed data

Si no existe el archivo local, la app busca un seed en:
```
resources/contrasenas.json
```

### Formato

El JSON contiene:
- `entries[]` — Array de entradas con sus credenciales y metadatos
- `users[]` — Array de usuarios locales
- `nextId` — Contador para IDs de entries locales
