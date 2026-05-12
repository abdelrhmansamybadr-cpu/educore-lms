'use strict'

const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, nativeImage, shell, Notification } = require('electron')
const path = require('path')
const fs = require('fs')

// Auto-updater (gracefully skip if not installed in dev)
let autoUpdater = null
try {
  autoUpdater = require('electron-updater').autoUpdater
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
} catch (_) {}

// Deep link protocol
const DEEP_LINK_PROTOCOL = 'educore'
if (!app.isDefaultProtocolClient(DEEP_LINK_PROTOCOL)) {
  app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL)
}

const WEB_URL = 'http://localhost:4001'
const CONFIG_PATH = path.join(app.getPath('userData'), 'window-state.json')

let mainWindow = null
let tray = null
let isQuitting = false

// ── Window State ─────────────────────────────────────────────────────────────

function loadWindowState() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    }
  } catch {}
  return { width: 1280, height: 800, x: undefined, y: undefined }
}

function saveWindowState(win) {
  try {
    const bounds = win.getBounds()
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(bounds))
  } catch {}
}

// ── Loading Screen ────────────────────────────────────────────────────────────

const LOADING_HTML = `data:text/html;charset=utf-8,<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: linear-gradient(135deg, #1e3a5f 0%, #0f2542 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    flex-direction: column;
    gap: 16px;
    -webkit-app-region: drag;
  }
  .logo { font-size: 42px; font-weight: 700; letter-spacing: -1px; }
  .logo span { color: #60a5fa; }
  .subtitle { opacity: 0.6; font-size: 14px; }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: #60a5fa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-top: 8px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="logo">Edu<span>Core</span></div>
  <div class="subtitle">Loading application...</div>
  <div class="spinner"></div>
</body>
</html>`

// ── Tray Icon (inline 16×16 PNG as base64) ───────────────────────────────────

// Simple colored square icon (will be replaced with real icon if assets/icon.png exists)
function getTrayIcon() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png')
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  }
  // Fallback: create a simple blue 16×16 icon programmatically
  return nativeImage.createEmpty()
}

// ── Create Main Window ────────────────────────────────────────────────────────

function createWindow() {
  const state = loadWindowState()

  mainWindow = new BrowserWindow({
    width: state.width || 1280,
    height: state.height || 800,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    title: 'EduCore LMS',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    show: false,
    backgroundColor: '#0f2542',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading localhost
    },
  })

  // Show loading screen first
  mainWindow.loadURL(LOADING_HTML)
  mainWindow.once('ready-to-show', () => mainWindow.show())

  // Try to load the actual web app
  loadWebApp()

  // Save window state on resize/move
  mainWindow.on('resize', () => saveWindowState(mainWindow))
  mainWindow.on('move', () => saveWindowState(mainWindow))

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      if (process.platform === 'darwin') app.dock?.hide()
    }
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('http://localhost')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

function loadWebApp(attempt = 1) {
  if (!mainWindow) return

  mainWindow.loadURL(WEB_URL).catch(() => {
    // Web app not ready yet — retry after delay
    if (attempt < 15) {
      setTimeout(() => loadWebApp(attempt + 1), 2000)
    }
  })
}

// ── System Tray ───────────────────────────────────────────────────────────────

function createTray() {
  const icon = getTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('EduCore LMS')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'EduCore LMS',
      enabled: false,
      icon: icon.isEmpty() ? undefined : icon,
    },
    { type: 'separator' },
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        if (process.platform === 'darwin') app.dock?.show()
      },
    },
    {
      label: 'Open Dashboard',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.loadURL(WEB_URL)
      },
    },
    {
      label: 'Messages',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('focus-messages')
      },
    },
    { type: 'separator' },
    {
      label: 'Quit EduCore',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.focus()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })

  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

function setupIPC() {
  // Native notification
  ipcMain.on('show-notification', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body, silent: false }).show()
    }
  })

  // Update tray badge / tooltip
  ipcMain.on('update-badge', (_, count) => {
    const label = count > 0 ? `EduCore LMS (${count} unread)` : 'EduCore LMS'
    tray?.setToolTip(label)
    if (process.platform === 'darwin') app.setBadgeCount(count)
  })

  // Window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window-close', () => {
    if (!isQuitting) mainWindow?.hide()
  })
}

// ── Global Shortcuts ──────────────────────────────────────────────────────────

function setupShortcuts() {
  // Ctrl+Shift+M → navigate to messages
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('focus-messages')
    }
  })

  // Ctrl+Shift+D → navigate to dashboard
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.loadURL(WEB_URL)
    }
  })
}

// ── App Lifecycle ─────────────────────────────────────────────────────────────

// ── Deep Link Handler ─────────────────────────────────────────────────────────

function handleDeepLink(url) {
  if (!mainWindow || !url) return
  try {
    // educore://path/to/page?param=value → navigate web app to that path
    const parsed = new URL(url)
    const route = parsed.pathname || '/'
    const search = parsed.search || ''
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('deep-link', { route, search, raw: url })
  } catch (_) {}
}

// ── Auto Updater Setup ────────────────────────────────────────────────────────

function setupAutoUpdater() {
  if (!autoUpdater) return
  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-available')
  })
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
  })
  autoUpdater.on('error', () => {})
  try {
    autoUpdater.checkForUpdatesAndNotify()
  } catch (_) {}
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  setupIPC()
  setupShortcuts()
  setupAutoUpdater()

  app.on('activate', () => {
    // macOS: re-show when clicking dock icon
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  console.log('EduCore Desktop ready')
  console.log(`Loading: ${WEB_URL}`)
})

app.on('window-all-closed', () => {
  // Don't quit on macOS when all windows closed (keep in tray/dock)
  if (process.platform !== 'darwin') {
    // Still keep running for tray — only quit via tray menu
  }
})

// Deep link: macOS (open-url event)
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (mainWindow) {
    handleDeepLink(url)
  }
})

// Deep link: Windows/Linux (second-instance event)
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_, argv) => {
    const deepLinkUrl = argv.find(arg => arg.startsWith(`${DEEP_LINK_PROTOCOL}://`))
    if (deepLinkUrl) handleDeepLink(deepLinkUrl)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.on('before-quit', () => {
  isQuitting = true
  globalShortcut.unregisterAll()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
