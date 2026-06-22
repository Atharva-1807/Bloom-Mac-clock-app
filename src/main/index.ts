import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 389,   // 369 + 10px shadow bleed on each side
    height: 165,  // 145 + 10px shadow bleed on each side
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: true,
    minWidth: 195,   // 50 % scale
    minHeight: 83,
    maxWidth: 778,   // 200 % scale
    maxHeight: 330,
    skipTaskbar: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setAlwaysOnTop(true, 'floating')
  // Lock width:height ratio — user can drag to any size but it stays proportional
  mainWindow.setAspectRatio(389 / 165)

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register bloom:// so the WidgetKit extension can open the app on tap
app.setAsDefaultProtocolClient('daylight')
app.on('open-url', (event, _url) => {
  event.preventDefault()
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

app.whenReady().then(() => {
  // Minimal menu bar — required by Apple HIG and for MAS review
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { label: 'About Daylight', role: 'about' },
        { type: 'separator' },
        { label: 'Quit Daylight', accelerator: 'Cmd+Q', role: 'quit' }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('quit-app', (event) => {
  if (mainWindow && event.sender === mainWindow.webContents) {
    app.quit()
  }
})

ipcMain.on('resize-window', (_event, width: number, height: number) => {
  mainWindow?.setSize(Math.round(width), Math.round(height))
})
