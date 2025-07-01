/**
 * Electron Main Process
 * 
 * This file is the main entry point for the Electron application.
 * It handles window creation, lifecycle management, and IPC communication.
 */

import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
// Import news scraper using require to avoid ES module conflicts
let newsScraperMain: any = null

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = path.join(__dirname, '../')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (process.platform === 'win32') app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This is only needed for dev mode and should be removed in production
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = path.join(__dirname, 'preload.cjs')
const url = process.env.VITE_DEV_SERVER_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null)
const indexHtml = path.join(process.env.DIST, 'index.html')

/**
 * Creates the main application window
 */
async function createWindow() {
  win = new BrowserWindow({
    title: 'Ludumpulse',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: process.env.VITE_PUBLIC ? path.join(process.env.VITE_PUBLIC, 'favicon.ico') : undefined,
    webPreferences: {
      preload,
      // Secure settings for modern Electron apps
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false, // Don't show until ready-to-show
    autoHideMenuBar: true, // Hide menu bar by default
    titleBarStyle: 'default',
  })

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show()
    
    // Open DevTools in development
    if (process.env.VITE_DEV_SERVER_URL) {
      win?.webContents.openDevTools()
    }
  })

  if (url) { // electron-vite-vue#298
    win.loadURL(url)
  } else {
    win.loadFile(indexHtml)
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Apply electron-updater
  // update(win)
}

// Initialize news scraper lazily
async function getNewsScraper() {
  if (!newsScraperMain) {
    try {
      // Use require to load puppeteer in CommonJS context
      const puppeteer = require('puppeteer')
      
      // Simple news scraper implementation
      newsScraperMain = {
        browser: null,
        
        async initialize() {
          if (!this.browser) {
            this.browser = await puppeteer.launch({
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            })
          }
        },
        
        async scrapeGameNews(gameTitle: string) {
          await this.initialize()
          
          // For now, return mock data to avoid complex scraping logic
          // This can be expanded later once the ES module issues are resolved
          return [{
            sourceId: 'mock',
            success: true,
            articles: [{
              title: `Sample news for ${gameTitle}`,
              url: 'https://example.com',
              publishedAt: new Date().toISOString(),
              summary: `This is a sample news article about ${gameTitle}.`,
              source: 'Mock Source'
            }],
            scrapedAt: new Date().toISOString(),
            processingTime: 100
          }]
        },
        
        async dispose() {
          if (this.browser) {
            await this.browser.close()
            this.browser = null
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize news scraper:', error)
      throw error
    }
  }
  return newsScraperMain
}

// Set up IPC handlers for news scraping
ipcMain.handle('scrape-game-news', async (event, gameTitle: string) => {
  try {
    const scraper = await getNewsScraper()
    const results = await scraper.scrapeGameNews(gameTitle)
    return { success: true, data: results }
  } catch (error) {
    console.error('Error in scrape-game-news IPC handler:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
})

ipcMain.handle('dispose-news-scraper', async () => {
  try {
    if (newsScraperMain) {
      await newsScraperMain.dispose()
      newsScraperMain = null
    }
    return { success: true }
  } catch (error) {
    console.error('Error disposing news scraper:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  if (url) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// Set up the application menu
const createMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createMenu()
}) 