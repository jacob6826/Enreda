const { contextBridge, ipcRenderer } = require('electron');

// Safe IPC bridge exposed to React frontend window
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});
