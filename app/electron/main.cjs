const { app, BrowserWindow, ipcMain, desktopCapturer, systemPreferences } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { loadEnvFile } = require('./env.cjs');
const { readStore, writeStore } = require('./store.cjs');
const { transcribeAudio, analyzeTranscript } = require('./ai.cjs');

loadEnvFile([path.join(__dirname, '..', '.env'), path.join(process.resourcesPath || '', '.env')]);

const isDev = !app.isPackaged;

const DEEP_LINK_SCHEME = 'maveriorecall';
if (isDev) {
  // Packaged builds get the scheme from build.protocols (electron-builder writes
  // it into Info.plist) — an unpackaged `electron .` needs the explicit exec
  // path/args so macOS knows how to relaunch this exact dev checkout.
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME);
}

let mainWindow = null;
let pendingDeepLink = null;

/** `maveriorecall://join/<code>` -> {kind:'join', token}; also 'reset'. Anything else is ignored. */
function parseDeepLink(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== DEEP_LINK_SCHEME + ':') return null;
    const kind = u.hostname;
    const token = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    if ((kind === 'join' || kind === 'reset') && token) return { kind, token };
  } catch {
    // malformed URL — ignore
  }
  return null;
}

function handleDeepLink(url) {
  const link = parseDeepLink(url);
  if (!link) return;
  if (mainWindow && !mainWindow.webContents.isLoadingMainFrame()) {
    mainWindow.webContents.send('deep-link', link);
  } else {
    pendingDeepLink = link;
  }
}

// Registered before app.whenReady() resolves so macOS delivers a cold-start
// launch (the app wasn't already running) through this same event, not just
// clicks while it's already open.
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

function recordingsDir() {
  const dir = path.join(app.getPath('userData'), 'recordings');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 860,
    minHeight: 560,
    frame: false,
    backgroundColor: '#E9EDEF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow = win;
  win.webContents.on('did-finish-load', () => {
    if (pendingDeepLink) {
      win.webContents.send('deep-link', pendingDeepLink);
      pendingDeepLink = null;
    }
  });
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  ipcMain.on('window:close', () => win.close());
  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:toggle-fullscreen', () => win.setFullScreen(!win.isFullScreen()));

  return win;
}

ipcMain.handle('store:get', () => readStore());
ipcMain.handle('store:set', (_e, data) => {
  writeStore(data);
  return true;
});

ipcMain.handle('capture:get-screen-source', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'], fetchWindowIcons: false });
  return sources.map((s) => ({ id: s.id, name: s.name }));
});

ipcMain.handle('capture:permission-status', () => {
  if (process.platform !== 'darwin') return { mic: 'granted', screen: 'granted' };
  return {
    mic: systemPreferences.getMediaAccessStatus('microphone'),
    screen: systemPreferences.getMediaAccessStatus('screen')
  };
});

ipcMain.handle('capture:request-mic', async () => {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.askForMediaAccess('microphone');
});

ipcMain.handle('recording:save', (_e, buffer, meetingId) => {
  const file = path.join(recordingsDir(), meetingId + '.webm');
  fs.writeFileSync(file, Buffer.from(buffer));
  return file;
});

ipcMain.handle('recording:transcribe', async (_e, filePath) => {
  const buf = fs.readFileSync(filePath);
  return transcribeAudio(buf, 'audio/webm');
});

ipcMain.handle('recording:analyze', async (_e, fullText, lines, context) => {
  return analyzeTranscript(fullText, lines, context);
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
