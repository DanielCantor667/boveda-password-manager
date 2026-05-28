-- Ejecuta esto en el SQL Editor de Supabase (https://supabase.com/dashboard/project/tczfwoysbqcickqblkdn/sql/new)

-- Mapa de usuario -> email para login con usuario o correo
CREATE TABLE usernames (
  username TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read usernames"
  ON usernames FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert their own username"
  ON usernames FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Entries
CREATE TABLE entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  entry_username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  color TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);
