'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Send a native OS notification
  sendNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  // Update the tray badge count
  updateBadge: (count) => ipcRenderer.send('update-badge', count),

  // Window controls (for custom title bar)
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Platform detection
  platform: process.platform,

  // Listen for events from main process
  onFocusMessages: (callback) => ipcRenderer.on('focus-messages', (_, ...args) => callback(...args)),

  // Deep link navigation (educore:// protocol)
  onDeepLink: (callback) => ipcRenderer.on('deep-link', (_, payload) => callback(payload)),

  // Auto-updater events
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, ...args) => callback(...args)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, ...args) => callback(...args)),
})
