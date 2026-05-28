-- Ejecutar esto en el SQL Editor de Supabase
-- Agrega las columnas necesarias para el nuevo formato de Bóveda

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}'::jsonb;
