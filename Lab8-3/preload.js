const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nativeAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content, fileName) => ipcRenderer.invoke('save-file', { content, fileName }),

  // Notifications
  showNotification: (title, body, urgent = false) => ipcRenderer.invoke('show-notification', { title, body, urgent }),
  notifyAgentEvent: (agentName, eventType, details = {}) => ipcRenderer.invoke('notify-agent-event', { agentName, eventType, details }),

  // Tray
  onStatusChangedFromTray: (callback) => ipcRenderer.on('status-changed-from-tray', (event, data) => callback(data)),
  hideToTray: () => ipcRenderer.send('hide-to-tray'),
  showApp: () => ipcRenderer.send('show-app')
});
