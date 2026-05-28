const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Auth
  getSession: () => ipcRenderer.invoke('get-session'),
  signUp: (username, email, password) => ipcRenderer.invoke('sign-up', username, email, password),
  signIn: (login, password) => ipcRenderer.invoke('sign-in', login, password),
  signOut: () => ipcRenderer.invoke('sign-out'),
  resetPassword: (email) => ipcRenderer.invoke('reset-password', email),
  // Entries
  getEntries: () => ipcRenderer.invoke('get-entries'),
  addEntry: (entry) => ipcRenderer.invoke('add-entry', entry),
  updateEntry: (id, entry) => ipcRenderer.invoke('update-entry', id, entry),
  deleteEntry: (id) => ipcRenderer.invoke('delete-entry', id),
  // Utils
  generatePassword: (length, options) => ipcRenderer.invoke('generate-password', length, options),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  // Realtime
  onEntriesChanged: (callback) => {
    ipcRenderer.on('entries-changed', () => callback());
  }
});
