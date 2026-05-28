const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('node:path');
const database = require('./src/database');
const { generatePassword } = require('./src/generator');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 700,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Bóveda',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(async () => {
  createWindow();
  database.afterSessionRestore();

  database.dbEvents.on('entries-changed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('entries-changed');
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Auth IPC
ipcMain.handle('get-session', async () => {
  const session = await database.getSession();
  return !!session;
});

ipcMain.handle('sign-up', async (_event, username, email, password) => {
  try {
    await database.signUp(username, email, password);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('sign-in', async (_event, email, password) => {
  try {
    await database.signIn(email, password);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('sign-out', async () => {
  await database.signOut();
});

ipcMain.handle('reset-password', async (_event, email) => {
  try {
    await database.resetPasswordForEmail(email);
    return true;
  } catch {
    return false;
  }
});

// Entries
ipcMain.handle('get-entries', async () => {
  const entries = await database.getEntries();
  return entries.map(e => ({
    id: e.id,
    title: e.title,
    credentials: e.credentials || [],
    url: e.url || '',
    notes: e.notes || '',
    theme: e.theme || null,
    createdAt: e.createdAt || e.created_at,
    updatedAt: e.updatedAt || e.updated_at
  }));
});

ipcMain.handle('add-entry', async (_event, entry) => {
  return await database.addEntry(entry);
});

ipcMain.handle('update-entry', async (_event, id, entry) => {
  await database.updateEntry(id, entry);
});

ipcMain.handle('delete-entry', async (_event, id) => {
  await database.deleteEntry(id);
});

// Utils
ipcMain.handle('generate-password', (_event, length, options) => {
  return generatePassword(length, options);
});

ipcMain.handle('copy-to-clipboard', (_event, text) => {
  clipboard.writeText(text);
});
