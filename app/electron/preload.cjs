const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('recallWindow', {
  close: () => ipcRenderer.send('window:close'),
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleFullscreen: () => ipcRenderer.send('window:toggle-fullscreen'),
  isElectron: true
});

contextBridge.exposeInMainWorld('recallAPI', {
  isElectron: true,
  store: {
    load: () => ipcRenderer.invoke('store:get'),
    save: (data) => ipcRenderer.invoke('store:set', data)
  },
  getScreenSource: () => ipcRenderer.invoke('capture:get-screen-source'),
  getPermissionStatus: () => ipcRenderer.invoke('capture:permission-status'),
  requestMic: () => ipcRenderer.invoke('capture:request-mic'),
  saveRecording: (buffer, meetingId) => ipcRenderer.invoke('recording:save', buffer, meetingId),
  transcribe: (filePath) => ipcRenderer.invoke('recording:transcribe', filePath),
  analyze: (fullText, lines, context) => ipcRenderer.invoke('recording:analyze', fullText, lines, context),
  onDeepLink: (callback) => {
    const listener = (_e, link) => callback(link);
    ipcRenderer.on('deep-link', listener);
    return () => ipcRenderer.removeListener('deep-link', listener);
  }
});
