let entries = [];
let editingId = null;
let credentials = [];
let credIdCounter = 1;
let generatorTargetId = null;

// Login refs
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const loginTitle = document.getElementById('loginTitle');
const loginSubtitle = document.getElementById('loginSubtitle');
const loginUsername = document.getElementById('loginUsername');
const loginEmailField = document.getElementById('loginEmailField');
const loginPassword = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const loginForm = document.getElementById('loginForm');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const toggleLoginPasswordBtn = document.getElementById('toggleLoginPasswordBtn');
const switchAuthBtn = document.getElementById('switchAuthBtn');
const authModeText = document.getElementById('authModeText');

let isSignUp = false;

// Main refs
const searchInput = document.getElementById('searchInput');
const addButton = document.getElementById('addButton');
const entriesList = document.getElementById('entriesList');
const emptyState = document.getElementById('emptyState');
const entryModal = document.getElementById('entryModal');
const modalTitle = document.getElementById('modalTitle');
const entryTitle = document.getElementById('entryTitle');
const entryUrl = document.getElementById('entryUrl');
const entryNotes = document.getElementById('entryNotes');
const credentialsList = document.getElementById('credentialsList');
const addCredentialBtn = document.getElementById('addCredentialBtn');
const themeBg = document.getElementById('themeBg');
const themeBorder = document.getElementById('themeBorder');
const themeTitle = document.getElementById('themeTitle');
const themeButton = document.getElementById('themeButton');
const saveEntryBtn = document.getElementById('saveEntryBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

// Generator refs
const generatorModal = document.getElementById('generatorModal');
const genLength = document.getElementById('genLength');
const genUppercase = document.getElementById('genUppercase');
const genLowercase = document.getElementById('genLowercase');
const genDigits = document.getElementById('genDigits');
const genSymbols = document.getElementById('genSymbols');
const genResult = document.getElementById('genResult');
const useGeneratedBtn = document.getElementById('useGeneratedBtn');
const generateNewBtn = document.getElementById('generateNewBtn');
const closeGeneratorBtn = document.getElementById('closeGeneratorBtn');

const logoutButton = document.getElementById('logoutButton');

// Change password modal refs
const changePasswordModal = document.getElementById('changePasswordModal');
const cpEmail = document.getElementById('cpEmail');
const cpError = document.getElementById('cpError');
const cpSuccess = document.getElementById('cpSuccess');
const saveCpBtn = document.getElementById('saveCpBtn');
const cancelCpBtn = document.getElementById('cancelCpBtn');

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const hasSession = await window.api.getSession();
  if (hasSession) {
    await enterApp();
    return;
  }
  showLoginForm(false);

  loginButton.addEventListener('click', handleLogin);
  loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  forgotPasswordBtn.addEventListener('click', handleForgotPassword);
  switchAuthBtn.addEventListener('click', toggleAuthMode);

  searchInput.addEventListener('input', renderEntries);
  addButton.addEventListener('click', openAddModal);
  cancelModalBtn.addEventListener('click', closeEntryModal);
  saveEntryBtn.addEventListener('click', handleSaveEntry);

  addCredentialBtn.addEventListener('click', () => addCredentialRow('', '', ''));

  generateNewBtn.addEventListener('click', handleGenerate);
  useGeneratedBtn.addEventListener('click', useGeneratedPassword);
  closeGeneratorBtn.addEventListener('click', closeGenerator);

  toggleLoginPasswordBtn.addEventListener('click', () => togglePasswordVisibility(loginPassword, toggleLoginPasswordBtn));

  logoutButton.addEventListener('click', handleLogout);

  saveCpBtn.addEventListener('click', handleResetPassword);
  cancelCpBtn.addEventListener('click', () => changePasswordModal.classList.add('hidden'));

  window.api.onEntriesChanged(() => {
    refreshEntries();
  });

  loginUsername.focus();
}

// ─── Auth ───

function showLoginForm(signUpMode) {
  isSignUp = signUpMode;
  if (signUpMode) {
    loginTitle.textContent = 'Crear cuenta';
    loginSubtitle.textContent = 'Crea tu cuenta';
    loginButton.textContent = 'Crear cuenta';
    loginUsername.placeholder = 'Nombre de usuario';
    loginEmailField.classList.remove('hidden');
    authModeText.textContent = '¿Ya tienes cuenta?';
    switchAuthBtn.textContent = 'Iniciar sesión';
    forgotPasswordBtn.classList.add('hidden');
  } else {
    loginTitle.textContent = 'Iniciar sesión';
    loginSubtitle.textContent = 'Ingresa tu usuario y contraseña';
    loginButton.textContent = 'Iniciar sesión';
    loginUsername.placeholder = 'Usuario o correo';
    loginEmailField.classList.add('hidden');
    authModeText.textContent = '¿No tienes cuenta?';
    switchAuthBtn.textContent = 'Crear cuenta';
    forgotPasswordBtn.classList.remove('hidden');
  }
  loginUsername.value = '';
  loginPassword.value = '';
  loginError.classList.add('hidden');
  loginUsername.focus();
}

function toggleAuthMode() {
  showLoginForm(!isSignUp);
}

async function handleLogin() {
  const login = loginUsername.value.trim();
  const password = loginPassword.value.trim();
  if (!login || !password) return;

  let result;
  if (isSignUp) {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
      loginError.textContent = 'Ingresa tu correo electrónico';
      loginError.classList.remove('hidden');
      return;
    }
    result = await window.api.signUp(login, email, password);
  } else {
    result = await window.api.signIn(login, password);
  }

  if (result.ok) {
    await enterApp();
  } else {
    loginError.textContent = result.error || (isSignUp ? 'Error al crear la cuenta' : 'Correo o contraseña incorrectos');
    loginError.classList.remove('hidden');
    loginPassword.value = '';
    loginPassword.focus();
  }
}

async function enterApp() {
  loginScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
  loginUsername.value = '';
  loginPassword.value = '';
  loginError.classList.add('hidden');
  await refreshEntries();
}

async function handleLogout() {
  await window.api.signOut();
  mainScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  showLoginForm(false);
  loginUsername.focus();
}

function togglePasswordVisibility(input, btn) {
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.title = 'Ocultar contraseña';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.title = 'Mostrar contraseña';
  }
}

async function handleForgotPassword() {
  changePasswordModal.classList.remove('hidden');
  cpEmail.value = '';
  cpError.classList.add('hidden');
  cpSuccess.classList.add('hidden');
  cpEmail.focus();
}

async function handleResetPassword() {
  const email = cpEmail.value.trim();
  cpError.classList.add('hidden');
  cpSuccess.classList.add('hidden');
  if (!email) {
    cpError.textContent = 'Ingresa tu correo';
    cpError.classList.remove('hidden');
    return;
  }
  const ok = await window.api.resetPassword(email);
  if (ok) {
    cpSuccess.textContent = 'Revisa tu correo para restablecer la contraseña';
    cpSuccess.classList.remove('hidden');
    cpEmail.value = '';
    setTimeout(() => changePasswordModal.classList.add('hidden'), 2000);
  } else {
    cpError.textContent = 'Error al enviar el correo';
    cpError.classList.remove('hidden');
  }
}

// ─── Entries CRUD ───

async function refreshEntries() {
  entries = await window.api.getEntries();
  renderEntries();
}

function renderEntries() {
  const query = searchInput.value.toLowerCase().trim();

  const filtered = query
    ? entries.filter(e => {
        const inTitle = e.title.toLowerCase().includes(query);
        const inUrl = e.url.toLowerCase().includes(query);
        const inCreds = (e.credentials || []).some(c =>
          c.username.toLowerCase().includes(query) || c.label.toLowerCase().includes(query)
        );
        return inTitle || inUrl || inCreds;
      })
    : entries;

  entriesList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    entriesList.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  entriesList.classList.remove('hidden');

  getCompanyGroups(filtered).forEach(group => {
    entriesList.appendChild(createCompanyGroup(group));
  });
}

function getCompanyName(entry) {
  const title = entry.title || 'Sin empresa';
  const [company] = title.split(/\s+-\s+/);
  return (company || title).trim().toUpperCase();
}

function getEntryLabel(entry) {
  const title = entry.title || '';
  const parts = title.split(/\s+-\s+/);
  return (parts.length > 1 ? parts.slice(1).join(' - ') : title).trim();
}

function getCompanyGroups(list) {
  const groups = new Map();
  list.forEach(entry => {
    const company = getCompanyName(entry);
    if (!groups.has(company)) groups.set(company, { company, entries: [] });
    groups.get(company).entries.push(entry);
  });
  return [...groups.values()].sort((a, b) => a.company.localeCompare(b.company));
}

function createCompanyGroup(group) {
  const wrapper = document.createElement('div');
  wrapper.className = 'company-group';

  const header = document.createElement('button');
  header.className = 'company-header';
  header.type = 'button';
  header.innerHTML = `
    <div class="company-info">
      <div class="company-title">${escapeHtml(group.company)}</div>
      <div class="company-meta">${group.entries.length} ${group.entries.length === 1 ? 'registro' : 'registros'}</div>
    </div>
    <span class="company-chevron">⌄</span>
  `;

  const body = document.createElement('div');
  body.className = 'company-body';

  group.entries.forEach(entry => {
    body.appendChild(createEntryItem(entry));
  });

  header.addEventListener('click', () => {
    wrapper.classList.toggle('open');
  });

  wrapper.appendChild(header);
  wrapper.appendChild(body);
  return wrapper;
}

function createEntryItem(entry) {
  const item = document.createElement('div');
  item.className = 'entry-item';

  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.id = entry.id;

  const theme = entry.theme || {};
  applyThemeToCard(card, theme);

  const creds = entry.credentials || [];
  const firstCred = creds[0];
  const credSummary = creds.length > 1
    ? `${creds.length} credenciales`
    : (firstCred ? firstCred.username : '');

  const glow = document.createElement('div');
  glow.className = 'card-glow';
  card.appendChild(glow);

  const info = document.createElement('div');
  info.className = 'entry-info';
  info.innerHTML = `
    <div class="entry-title">${escapeHtml(getEntryLabel(entry))}</div>
    <div class="entry-meta">${escapeHtml(credSummary)}${entry.url ? ' · ' + escapeHtml(entry.url) : ''}</div>
  `;
  card.appendChild(info);

  const actions = document.createElement('div');
  actions.className = 'entry-actions';
  actions.innerHTML = `
    <button class="btn btn-secondary edit-btn" data-id="${entry.id}">✏️</button>
    <button class="btn btn-danger delete-btn" data-id="${entry.id}">🗑️</button>
  `;
  card.appendChild(actions);

  const details = document.createElement('div');
  details.className = 'entry-details';
  details.id = `details-${entry.id}`;

  if (creds.length > 0) {
    creds.forEach((cred, idx) => {
      const credDiv = document.createElement('div');
      credDiv.className = 'credential-item-detail';
      credDiv.innerHTML = `
        <div class="credential-header">${escapeHtml(cred.label || 'Credencial ' + (idx + 1))}</div>
        <div class="detail-row">
          <span class="detail-label">Usuario</span>
          <span class="detail-value">${escapeHtml(cred.username)}</span>
          <button class="btn btn-secondary copy-btn" data-value="${escapeHtml(cred.username)}">Copiar</button>
        </div>
        <div class="detail-row">
          <span class="detail-label">Contraseña</span>
          <span class="detail-value"><span class="password-mask">••••••••</span></span>
          <button class="btn btn-secondary toggle-pwd-btn" data-password="${escapeHtml(cred.password)}">Mostrar</button>
          <button class="btn btn-secondary copy-btn" data-value="${escapeHtml(cred.password)}">Copiar</button>
        </div>
      `;
      details.appendChild(credDiv);
    });
  }

  if (entry.url) {
    const row = document.createElement('div');
    row.className = 'detail-row';
    row.innerHTML = `
      <span class="detail-label">URL</span>
      <span class="detail-value">${escapeHtml(entry.url)}</span>
      <button class="btn btn-secondary copy-btn" data-value="${escapeHtml(entry.url)}">Copiar</button>
    `;
    details.appendChild(row);
  }

  if (entry.notes) {
    const row = document.createElement('div');
    row.className = 'detail-row';
    row.innerHTML = `
      <span class="detail-label">Notas</span>
      <span class="detail-value">${escapeHtml(entry.notes)}</span>
      <button class="btn btn-secondary copy-btn" data-value="${escapeHtml(entry.notes)}">Copiar</button>
    `;
    details.appendChild(row);
  }

  item.appendChild(card);
  item.appendChild(details);

  card.addEventListener('click', (e) => {
    if (e.target.closest('.entry-actions')) return;
    details.classList.toggle('open');
  });

  card.querySelector('.edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(entry);
  });

  card.querySelector('.delete-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar "${entry.title}"?`)) {
      await window.api.deleteEntry(entry.id);
      await refreshEntries();
      showToast('Entrada eliminada');
    }
  });

  details.querySelectorAll('.toggle-pwd-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pwd = btn.dataset.password;
      const valueSpan = btn.closest('.detail-row').querySelector('.detail-value');
      const mask = valueSpan.querySelector('.password-mask');
      if (mask) {
        mask.replaceWith(document.createTextNode(pwd));
        btn.textContent = 'Ocultar';
      } else {
        valueSpan.innerHTML = '<span class="password-mask">••••••••</span>';
        btn.textContent = 'Mostrar';
      }
    });
  });

  details.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const val = btn.dataset.value;
      await window.api.copyToClipboard(val);
      showToast('Copiado al portapapeles');
      if (btn.closest('.detail-row')?.querySelector('.password-mask') === null) {
        setTimeout(() => window.api.copyToClipboard(''), 30000);
      }
    });
  });

  return item;
}

function applyThemeToCard(card, theme) {
  if (!theme) return;
  if (theme.background) card.style.setProperty('--card-bg', theme.background);
  if (theme.borderColor) card.style.setProperty('--card-border', theme.borderColor);
  if (theme.titleColor) card.style.setProperty('--card-title', theme.titleColor);
  if (theme.buttonColor) card.style.setProperty('--card-btn', theme.buttonColor);
}

// ─── Modal: Add / Edit ───

function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Nueva entrada';
  entryTitle.value = '';
  entryUrl.value = '';
  entryNotes.value = '';
  credentials = [{ id: credIdCounter++, label: 'Principal', username: '', password: '' }];
  renderCredentialRows();

  themeBg.value = '#0d1117';
  themeBorder.value = '#30363d';
  themeTitle.value = '#f0f6fc';
  themeButton.value = '#238636';

  entryModal.classList.remove('hidden');
  entryTitle.focus();
}

function openEditModal(entry) {
  editingId = entry.id;
  modalTitle.textContent = 'Editar entrada';
  entryTitle.value = entry.title;
  entryUrl.value = entry.url || '';
  entryNotes.value = entry.notes || '';

  const theme = entry.theme || {};
  themeBg.value = theme.background || '#0d1117';
  themeBorder.value = theme.borderColor || '#30363d';
  themeTitle.value = theme.titleColor || '#f0f6fc';
  themeButton.value = theme.buttonColor || '#238636';

  credentials = (entry.credentials || []).map(c => ({
    id: c.id || credIdCounter++,
    label: c.label || '',
    username: c.username || '',
    password: c.password || ''
  }));
  if (credentials.length === 0) {
    credentials = [{ id: credIdCounter++, label: 'Principal', username: '', password: '' }];
  }
  renderCredentialRows();

  entryModal.classList.remove('hidden');
  entryTitle.focus();
}

function closeEntryModal() {
  entryModal.classList.add('hidden');
}

function renderCredentialRows() {
  credentialsList.innerHTML = '';
  credentials.forEach((cred, idx) => {
    const row = document.createElement('div');
    row.className = 'credential-row';
    row.innerHTML = `
      <div class="cred-label">
        <input type="text" class="cred-label-input" placeholder="Etiqueta" value="${escapeHtml(cred.label)}">
      </div>
      <div class="cred-username">
        <input type="text" class="cred-username-input" placeholder="Usuario o email" value="${escapeHtml(cred.username)}">
      </div>
      <div class="cred-password">
        <div class="password-row">
          <input type="password" class="cred-password-input" placeholder="Contraseña" value="${escapeHtml(cred.password)}">
          <button class="btn-icon toggle-cred-pwd" title="Mostrar">👁️</button>
          <button class="btn-icon gen-cred-pwd" title="Generar" data-cred-id="${cred.id}">🎲</button>
        </div>
      </div>
      <div class="cred-actions">
        <button class="btn-icon danger remove-cred" title="Eliminar" ${credentials.length <= 1 ? 'disabled style="opacity:0.3"' : ''}>✕</button>
      </div>
    `;

    // Store data references
    const labelInput = row.querySelector('.cred-label-input');
    const usernameInput = row.querySelector('.cred-username-input');
    const passwordInput = row.querySelector('.cred-password-input');

    labelInput.addEventListener('input', () => { cred.label = labelInput.value; });
    usernameInput.addEventListener('input', () => { cred.username = usernameInput.value; });
    passwordInput.addEventListener('input', () => { cred.password = passwordInput.value; });

    row.querySelector('.toggle-cred-pwd').addEventListener('click', () => {
      togglePasswordVisibility(passwordInput, row.querySelector('.toggle-cred-pwd'));
    });

    row.querySelector('.gen-cred-pwd').addEventListener('click', () => {
      generatorTargetId = cred.id;
      openGenerator();
    });

    row.querySelector('.remove-cred').addEventListener('click', () => {
      if (credentials.length <= 1) return;
      credentials = credentials.filter(c => c.id !== cred.id);
      renderCredentialRows();
    });

    credentialsList.appendChild(row);
  });
}

function addCredentialRow(label, username, password) {
  credentials.push({
    id: credIdCounter++,
    label: label || '',
    username: username || '',
    password: password || ''
  });
  renderCredentialRows();
}

async function handleSaveEntry() {
  const title = entryTitle.value.trim();
  if (!title) return;

  const validCreds = credentials.filter(c => c.username || c.password);
  const data = {
    title,
    credentials: validCreds.map(c => ({ id: c.id, label: c.label, username: c.username, password: c.password })),
    url: entryUrl.value.trim(),
    notes: entryNotes.value.trim(),
    theme: {
      background: themeBg.value,
      borderColor: themeBorder.value,
      titleColor: themeTitle.value,
      buttonColor: themeButton.value
    }
  };

  if (editingId) {
    await window.api.updateEntry(editingId, data);
    showToast('Entrada actualizada');
  } else {
    await window.api.addEntry(data);
    showToast('Entrada guardada');
  }

  closeEntryModal();
  await refreshEntries();
}

// ─── Password Generator ───

function openGenerator() {
  generatorModal.classList.remove('hidden');
  handleGenerate();
}

function closeGenerator() {
  generatorModal.classList.add('hidden');
  generatorTargetId = null;
}

async function handleGenerate() {
  const length = parseInt(genLength.value) || 20;
  const options = {
    includeUppercase: genUppercase.checked,
    includeLowercase: genLowercase.checked,
    includeDigits: genDigits.checked,
    includeSymbols: genSymbols.checked
  };
  const pwd = await window.api.generatePassword(length, options);
  genResult.value = pwd;
}

function useGeneratedPassword() {
  if (generatorTargetId) {
    const cred = credentials.find(c => c.id === generatorTargetId);
    if (cred) {
      cred.password = genResult.value;
      renderCredentialRows();
    }
  }
  closeGenerator();
}

// ─── Utils ───

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
