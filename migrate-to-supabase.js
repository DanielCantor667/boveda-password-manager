/**
 * Script para migrar datos locales a Supabase.
 * Uso: node migrate-to-supabase.js <email> <password>
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SUPABASE_URL = 'https://tczfwoysbqcicqkblkdn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjemZ3b3lzYnFjaWNxa2Jsa2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTM4OTUsImV4cCI6MjA5NTI4OTg5NX0.MeDtHzbBapHid99nBKv8kNYJT8iSWbWfK1hVXdQp3KE';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node migrate-to-supabase.js <email> <contraseña>');
    process.exit(1);
  }

  // Buscar archivo local
  const possiblePaths = [
    path.join(os.homedir(), 'Library/Application Support/contrasenas/contrasenas.json'),
    path.join(os.homedir(), 'Library/Application Support/boveda/contrasenas.json'),
    path.join(__dirname, 'resources/contrasenas.json')
  ];

  let localData = null;
  let localPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        localData = JSON.parse(fs.readFileSync(p, 'utf8'));
        localPath = p;
        break;
      } catch {}
    }
  }

  if (!localData || !localData.entries || localData.entries.length === 0) {
    console.error('No se encontraron entradas locales para migrar');
    process.exit(1);
  }

  console.log(`Archivo local encontrado: ${localPath}`);
  console.log(`Entradas encontradas: ${localData.entries.length}`);

  // Conectar a Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: session, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    console.error('Error al iniciar sesión:', loginError.message);
    process.exit(1);
  }

  const userId = session.user.id;
  console.log(`Sesión iniciada como: ${email} (${userId})`);

  // Migrar entradas
  let migrated = 0;
  for (const entry of localData.entries) {
    const { error } = await supabase.from('entries').insert({
      user_id: userId,
      title: entry.title,
      entry_username: entry.username || '',
      password: entry.password || '',
      url: entry.url || '',
      notes: entry.notes || '',
      color: entry.color || '',
      created_at: entry.createdAt || new Date().toISOString(),
      updated_at: entry.updatedAt || new Date().toISOString()
    });

    if (error) {
      console.error(`Error al migrar "${entry.title}":`, error.message);
    } else {
      migrated++;
      console.log(`✓ Migrado: ${entry.title}`);
    }
  }

  console.log(`\nMigración completada: ${migrated}/${localData.entries.length} entradas`);
}

main();
