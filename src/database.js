const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const EventEmitter = require('events');
const supabase = require('./supabase');

const dbEvents = new EventEmitter();
const LOCAL_USER_ID = 'local-user';

let currentUserId = null;
let supabaseUserId = null;
let store = null;
let realtimeSubscription = null;
let credentialIdCounter = 100;

function migrateEntry(entry) {
  if (!entry.credentials && (entry.username !== undefined || entry.password !== undefined)) {
    const creds = [];
    if (entry.username || entry.password) {
      creds.push({
        id: credentialIdCounter++,
        label: 'Principal',
        username: entry.username || '',
        password: entry.password || ''
      });
    }
    entry.credentials = creds;
    delete entry.username;
    delete entry.password;
  }
  entry.credentials = entry.credentials || [];
  entry.credentials.forEach(c => { if (!c.id) c.id = credentialIdCounter++; });

  if (!entry.theme) {
    if (entry.color) {
      entry.theme = {
        background: adjustColor(entry.color, -40),
        borderColor: entry.color,
        titleColor: '#f0f6fc',
        buttonColor: entry.color
      };
      delete entry.color;
    } else {
      entry.theme = {
        background: '#0d1117',
        borderColor: '#30363d',
        titleColor: '#f0f6fc',
        buttonColor: '#238636'
      };
    }
  }
  return entry;
}

function adjustColor(hex, amount) {
  if (!hex) return '#0d1117';
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getUserStorePath() {
  return path.join(app.getPath('userData'), 'contrasenas.json');
}

function getSeedPath() {
  if (process.resourcesPath) {
    return path.join(process.resourcesPath, 'contrasenas.json');
  }
  return path.join(__dirname, '..', 'resources', 'contrasenas.json');
}

function createEmptyStore() {
  return {
    entries: [],
    users: [
      { id: LOCAL_USER_ID, username: 'brandon', email: '', password: 'brandon123' }
    ],
    nextId: 1
  };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function ensureStore() {
  if (store) return store;
  const userStorePath = getUserStorePath();
  try {
    store = await readJson(userStorePath);
  } catch {
    try {
      store = await readJson(getSeedPath());
    } catch {
      store = createEmptyStore();
    }
    await saveStore();
  }
  store.entries ||= [];
  store.users ||= [];
  let changed = false;
  store.entries = store.entries.map(e => {
    if (!e.credentials) { changed = true; return migrateEntry(e); }
    return e;
  });
  if (!store.users.some(u => u.username === 'brandon')) {
    store.users.push({ id: LOCAL_USER_ID, username: 'brandon', email: '', password: 'brandon123' });
    changed = true;
  }
  store.nextId ||= store.entries.reduce((max, e) => Math.max(max, Number(e.id) || 0), 0) + 1;
  if (changed) await saveStore();
  return store;
}

async function saveStore() {
  const userStorePath = getUserStorePath();
  await fs.mkdir(path.dirname(userStorePath), { recursive: true });
  await fs.writeFile(userStorePath, JSON.stringify(store || createEmptyStore(), null, 2));
}

// Supabase helpers
async function getSupabaseSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function startRealtime() {
  stopRealtime();
  realtimeSubscription = supabase
    .channel('entries-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'entries' },
      async () => {
        const entries = await fetchFromSupabase();
        if (entries) {
          const storeData = await ensureStore();
          const remoteIds = new Set(entries.map(e => e.id));
          storeData.entries = storeData.entries.filter(e => !e._supabaseId || !remoteIds.has(e._supabaseId));
          entries.forEach(e => storeData.entries.push(e));
          await saveStore();
          dbEvents.emit('entries-changed');
        }
      }
    )
    .subscribe();
}

function stopRealtime() {
  if (realtimeSubscription) {
    supabase.removeChannel(realtimeSubscription);
    realtimeSubscription = null;
  }
}

async function tryEnsureSupabaseSchema() {
  try {
    const { error } = await supabase.from('entries').select('credentials').limit(1);
    if (error && error.code === '42703') {
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE entries ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '[]'::jsonb;
              ALTER TABLE entries ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}'::jsonb;`
      });
      if (alterError) console.warn('Could not auto-migrate Supabase schema:', alterError.message);
    }
  } catch {
    // columns probably already exist
  }
}

async function fetchFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(e => {
      const entry = {
        id: e.id,
        _supabaseId: e.id,
        _synced: true,
        title: e.title || '',
        credentials: e.credentials || [],
        url: e.url || '',
        notes: e.notes || '',
        theme: e.theme || null,
        createdAt: e.created_at,
        updatedAt: e.updated_at
      };
      if ((!entry.credentials || entry.credentials.length === 0) && (e.entry_username || e.password)) {
        entry.credentials = [{ id: credentialIdCounter++, label: 'Principal', username: e.entry_username || '', password: e.password || '' }];
      }
      if (!entry.theme && e.color) {
        entry.theme = { background: adjustColor(e.color, -40), borderColor: e.color, titleColor: '#f0f6fc', buttonColor: e.color };
      }
      return entry;
    });
  } catch {
    return null;
  }
}

async function pushEntryToSupabase(entry) {
  try {
    const payload = {
      user_id: supabaseUserId,
      title: entry.title,
      credentials: entry.credentials || [],
      theme: entry.theme || null,
      url: entry.url || '',
      notes: entry.notes || '',
      updated_at: new Date().toISOString()
    };
    if (entry._supabaseId) {
      const { error } = await supabase.from('entries').update(payload).eq('id', entry._supabaseId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('entries').insert(payload).select();
      if (error) throw error;
      if (data && data[0]) {
        entry._supabaseId = data[0].id;
        entry.id = data[0].id;
      }
    }
    entry._synced = true;
    return true;
  } catch (err) {
    console.warn('[Supabase] Push failed para "' + entry.title + '":', err.message);
    return false;
  }
}

async function deleteFromSupabase(supabaseId) {
  try {
    await supabase.from('entries').delete().eq('id', supabaseId);
  } catch {
    // ignore
  }
}

async function migrateLocalToSupabase() {
  const storeData = await ensureStore();
  const unsynced = storeData.entries.filter(e => !e._synced);
  if (unsynced.length === 0) return;
  for (const entry of unsynced) {
    const ok = await pushEntryToSupabase(entry);
    if (!ok) {
      console.warn('[Supabase] No se pudo sincronizar:', entry.title, '- se reintentará después');
    }
  }
  await saveStore();
}

// Auth
async function signUp(username, email, password) {
  console.log(`[Auth] signUp → email: ${email}, username: ${username}`);

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.log(`[Auth] signUp SUPABASE ERROR: ${error.message} (code: ${error.code || 'N/A'})`);

    const isNetworkError = !error.code || error.message.includes('fetch') ||
      error.message.includes('network') || error.message.includes('Failed');

    if (isNetworkError) {
      console.log('[Auth] Sin conexión a Supabase → usando registro LOCAL (offline)');
      const storeData = await ensureStore();
      const exists = storeData.users.some(u => u.username === username || u.email === email);
      if (exists) throw new Error('Usuario ya existe (local)');
      storeData.users.push({ id: LOCAL_USER_ID, username, email: email || '', password });
      currentUserId = LOCAL_USER_ID;
      await saveStore();
      return { user: { id: LOCAL_USER_ID, email } };
    }

    if (error.message.includes('already registered') || error.message.includes('User already')) {
      throw new Error('Este correo ya está registrado en Supabase');
    }

    throw new Error(`Error en Supabase: ${error.message}`);
  }

  if (!data?.user) {
    console.log('[Auth] signUp: data.user es null - verificar que Email provider esté habilitado en Supabase');
    throw new Error('No se pudo crear el usuario. Revisa que el proveedor Email esté habilitado en Authentication > Providers en Supabase.');
  }

  console.log(`[Auth] signUp EXITOSO → Supabase user id: ${data.user.id}`);
  supabaseUserId = data.user.id;
  currentUserId = supabaseUserId;
  startRealtime();
  await migrateLocalToSupabase();

  const storeData = await ensureStore();
  storeData.users.push({ id: supabaseUserId, username, email: email || '', password, supabase: true });
  await saveStore();

  return { user: data.user };
}

async function signIn(login, password) {
  const isEmail = login.includes('@');
  console.log(`[Auth] signIn → login: ${login}, esEmail: ${isEmail}`);

  if (isEmail) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: login, password });

    if (error) {
      console.log(`[Auth] signIn SUPABASE ERROR: ${error.message} (code: ${error.code || 'N/A'})`);

      const isNetworkError = !error.code || error.message.includes('fetch') ||
        error.message.includes('network') || error.message.includes('Failed');

      if (isNetworkError) {
        console.log('[Auth] Sin conexión a Supabase → intentando login LOCAL (offline)');
        const storeData = await ensureStore();
        const user = storeData.users.find(u =>
          (u.username === login || (u.email && u.email === login)) && u.password === password
        );
        if (!user) throw new Error('Sin conexión y usuario no encontrado localmente');
        currentUserId = user.id;
        console.log('[Auth] Login LOCAL exitoso (offline)');
        return { user: { id: user.id } };
      }

      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Correo o contraseña incorrectos en Supabase');
      }

      throw new Error(`Error en Supabase: ${error.message}`);
    }

    if (!data?.user) {
      throw new Error('Error al iniciar sesión en Supabase');
    }

    console.log(`[Auth] signIn EXITOSO → Supabase user id: ${data.user.id}`);
    supabaseUserId = data.user.id;
    currentUserId = supabaseUserId;
    const storeData = await ensureStore();
    const remoteEntries = await fetchFromSupabase();

    if (remoteEntries && remoteEntries.length > 0) {
      const remoteIds = new Set(remoteEntries.map(e => e.id));
      storeData.entries = storeData.entries.filter(e => !e._supabaseId || !remoteIds.has(e._supabaseId));
      remoteEntries.forEach(e => storeData.entries.push(e));
    }

    const hasLocalEntries = storeData.entries.some(e => !e._synced && storeData.entries.length > 0);
    if (hasLocalEntries) await migrateLocalToSupabase();

    await migrateLocalToSupabase();

    if (!storeData.users.some(u => u.id === supabaseUserId)) {
      storeData.users.push({ id: supabaseUserId, username: login, email: login, password, supabase: true });
    }
    storeData.entries.forEach(e => e._synced = true);
    await saveStore();
    startRealtime();
    dbEvents.emit('entries-changed');
    return { user: data.user };
  }

  console.log('[Auth] No es email → intentando login LOCAL');
  const storeData = await ensureStore();
  const user = storeData.users.find(u =>
    (u.username === login || (u.email && u.email === login)) && u.password === password
  );
  if (!user) throw new Error('Usuario no encontrado');
  currentUserId = user.id;
  console.log(`[Auth] Login LOCAL exitoso: ${login}`);
  return { user: { id: user.id } };
}

async function signOut() {
  stopRealtime();
  const session = await getSupabaseSession();
  if (session) await supabase.auth.signOut();
  currentUserId = null;
  supabaseUserId = null;
}

async function resetPasswordForEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return !error;
}

async function getSession() {
  if (currentUserId) return { user: { id: currentUserId } };
  const session = await getSupabaseSession();
  if (session) {
    currentUserId = session.user.id;
    supabaseUserId = session.user.id;
    return { user: { id: session.user.id } };
  }
  return null;
}

async function afterSessionRestore() {
  tryEnsureSupabaseSchema();
  const session = await getSupabaseSession();
  if (session) {
    supabaseUserId = session.user.id;
    currentUserId = session.user.id;
    startRealtime();
  }
}

// CRUD
async function getEntries() {
  const storeData = await ensureStore();
  return [...storeData.entries].sort((a, b) => {
    const left = new Date(a.updatedAt || a.updated_at || 0).getTime();
    const right = new Date(b.updatedAt || b.updated_at || 0).getTime();
    return right - left;
  });
}

async function addEntry(entry) {
  const storeData = await ensureStore();
  const now = new Date().toISOString();
  const localId = -(storeData.nextId++);
  const newEntry = {
    id: localId,
    title: entry.title,
    credentials: entry.credentials || [],
    url: entry.url || '',
    notes: entry.notes || '',
    theme: entry.theme || null,
    createdAt: now,
    updatedAt: now,
    _synced: false
  };
  storeData.entries.push(newEntry);
  await saveStore();
  if (supabaseUserId) {
    await pushEntryToSupabase(newEntry);
    newEntry._synced = true;
    await saveStore();
  }
  return newEntry.id;
}

async function updateEntry(id, data) {
  const storeData = await ensureStore();
  const item = storeData.entries.find(candidate => String(candidate.id) === String(id));
  if (!item) throw new Error('Entrada no encontrada');

  item.title = data.title;
  item.credentials = data.credentials || [];
  item.url = data.url || '';
  item.notes = data.notes || '';
  item.theme = data.theme || null;
  item.updatedAt = new Date().toISOString();
  await saveStore();
  if (supabaseUserId) {
    await pushEntryToSupabase(item);
    await saveStore();
  }
}

async function deleteEntry(id) {
  const storeData = await ensureStore();
  const entry = storeData.entries.find(e => String(e.id) === String(id));
  storeData.entries = storeData.entries.filter(e => String(e.id) !== String(id));
  await saveStore();
  if (supabaseUserId && entry?._supabaseId) {
    await deleteFromSupabase(entry._supabaseId);
  }
}

async function close() {
  stopRealtime();
}

module.exports = {
  dbEvents,
  signUp, signIn, signOut, resetPasswordForEmail, getSession, afterSessionRestore,
  setUserId: (id) => { currentUserId = id || LOCAL_USER_ID; },
  getUserId: () => currentUserId,
  getEntries, addEntry, updateEntry, deleteEntry, close
};
