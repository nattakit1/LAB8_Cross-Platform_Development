const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (msg) => ipcRenderer.invoke('send-message', msg),
  sayHello: (name) => ipcRenderer.invoke('say-hello', name),
  authenticate: (creds) => ipcRenderer.invoke('authenticate', creds),
  changeAgentStatus: (data) => ipcRenderer.invoke('change-agent-status', data),
  onAgentStatusUpdated: (callback) => ipcRenderer.on('agent-status-updated', (event, data) => callback(data))
});
