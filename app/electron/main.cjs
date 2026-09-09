const { app, BrowserWindow, ipcMain, desktopCapturer, systemPreferences } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { loadEnvFile } = require('./env.cjs');
const { readStore, writeStore } = require('./store.cjs');
const { transcribeAudio, analyzeTranscript } = require('./ai.cjs');

loadEnvFile([path.join(__dirname, '..', '.env'), path.join(process.resourcesPath || '', '.env')]);

const isDev = !app.isPackaged;

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
