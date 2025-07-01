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
const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
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

  console.log('Loading Electron app:', {
    url,
    VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
    NODE_ENV: process.env.NODE_ENV,
    indexHtml
  })

  if (url) { // electron-vite-vue#298
    console.log('Loading from URL:', url)
    win.loadURL(url)
  } else {
    console.log('Loading from file:', indexHtml)
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

// News sources configuration
const NEWS_SOURCES = [
  {
    id: 'ign',
    name: 'IGN',
    baseUrl: 'https://www.ign.com',
    maxArticles: 10,
    selectors: {
      articleContainer: '.article-item, .jsx-article-item, .item',
      title: '.item-title a, .headline a, h3 a, .title a',
      link: '.item-title a, .headline a, h3 a, .title a',
      date: '.publish-date, .article-timestamp, time, .date',
      summary: '.item-summary, .article-summary, .excerpt, .summary',
      sourceName: 'IGN'
    },
    buildSearchUrl: (gameTitle: string) => {
      const encodedTitle = encodeURIComponent(gameTitle)
      return `https://www.ign.com/search?q=${encodedTitle}`
    }
  },
  {
    id: 'gamespot',
    name: 'GameSpot',
    baseUrl: 'https://www.gamespot.com',
    maxArticles: 10,
    selectors: {
      articleContainer: '.media-article, .news-river-article, .card',
      title: '.media-title a, .news-river-title a, h3 a, .card-title a',
      link: '.media-title a, .news-river-title a, h3 a, .card-title a',
      date: '.media-date, .news-river-date, .publish-date, .date',
      summary: '.media-summary, .news-river-summary, .article-summary, .summary',
      sourceName: 'GameSpot'
    },
    buildSearchUrl: (gameTitle: string) => {
      const encodedTitle = encodeURIComponent(gameTitle)
      return `https://www.gamespot.com/search/?q=${encodedTitle}`
    }
  },
  {
    id: 'polygon',
    name: 'Polygon',
    baseUrl: 'https://www.polygon.com',
    maxArticles: 10,
    selectors: {
      articleContainer: '.c-entry-box, .c-compact-river__entry, article',
      title: '.c-entry-box--compact__title a, .c-entry-box__title a, h2 a',
      link: '.c-entry-box--compact__title a, .c-entry-box__title a, h2 a',
      date: '.c-byline__item time, .c-entry-box__meta time, time',
      summary: '.c-entry-box__dek, .c-entry-summary, .summary',
      sourceName: 'Polygon'
    },
    buildSearchUrl: (gameTitle: string) => {
      const encodedTitle = encodeURIComponent(gameTitle)
      return `https://www.polygon.com/search?q=${encodedTitle}`
    }
  }
]

// Initialize news scraper lazily
async function getNewsScraper() {
  if (!newsScraperMain) {
    try {
      // Use require to load puppeteer in CommonJS context
      const puppeteer = require('puppeteer')
      
      // Full news scraper implementation
      newsScraperMain = {
        browser: null,
        
        async initialize() {
          if (!this.browser) {
            this.browser = await puppeteer.launch({
              headless: true,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
              ]
            })
            console.log('News scraper browser initialized')
          }
        },
        
        async scrapeGameNews(gameTitle: string) {
          await this.initialize()
          console.log(`Starting news scraping for: ${gameTitle}`)
          
          const results = []
          
          for (const source of NEWS_SOURCES) {
            try {
              const result = await this.scrapeFromSource(source, gameTitle)
              results.push(result)
              
              // Add delay between sources to be respectful
              await this.delay(2000)
            } catch (error) {
              console.error(`Error scraping from ${source.name}:`, error)
              results.push({
                sourceId: source.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                articles: [],
                scrapedAt: new Date().toISOString()
              })
            }
          }
          
          return results
        },
        
        async scrapeFromSource(source: any, gameTitle: string) {
          const startTime = Date.now()
          let page = null

          try {
            page = await this.browser.newPage()
            
            // Set user agent and viewport
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
            await page.setViewport({ width: 1920, height: 1080 })

            // Build search URL
            const searchUrl = source.buildSearchUrl(gameTitle)
            console.log(`Scraping ${source.name}: ${searchUrl}`)
            
            // Navigate to the search page
            await page.goto(searchUrl, { 
              waitUntil: 'networkidle2',
              timeout: 30000 
            })

            // Wait a bit for dynamic content
            await page.waitForTimeout(3000)

            // Extract articles
            const articles = await page.evaluate((selectors: any) => {
              const articleElements = document.querySelectorAll(selectors.articleContainer)
              const extractedArticles = []

              for (let i = 0; i < Math.min(articleElements.length, 10); i++) {
                const element = articleElements[i]
                try {
                  const titleElement = element.querySelector(selectors.title)
                  const linkElement = element.querySelector(selectors.link)
                  const dateElement = element.querySelector(selectors.date)
                  const summaryElement = element.querySelector(selectors.summary)

                  if (titleElement && linkElement) {
                    const title = titleElement.textContent?.trim()
                    const url = linkElement.getAttribute('href')
                    
                    if (title && url && title.length > 10) {
                      extractedArticles.push({
                        title: title,
                        url: url,
                        publishedAt: dateElement?.textContent?.trim() || dateElement?.getAttribute('datetime') || null,
                        summary: summaryElement?.textContent?.trim() || null,
                        source: selectors.sourceName
                      })
                    }
                  }
                } catch (error) {
                  console.warn('Error extracting article:', error)
                }
              }

              return extractedArticles
            }, source.selectors)

            // Process and clean the articles
            const processedArticles = articles
              .filter((article: any) => article.title && article.url)
              .map((article: any) => ({
                ...article,
                url: this.resolveUrl(article.url, source.baseUrl),
                publishedAt: this.parseDate(article.publishedAt),
              }))
              .slice(0, source.maxArticles)

            console.log(`Found ${processedArticles.length} articles from ${source.name}`)

            return {
              sourceId: source.id,
              success: true,
              articles: processedArticles,
              scrapedAt: new Date().toISOString(),
              processingTime: Date.now() - startTime
            }

          } catch (error) {
            console.error(`Error scraping from ${source.name}:`, error)
            return {
              sourceId: source.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              articles: [],
              scrapedAt: new Date().toISOString(),
              processingTime: Date.now() - startTime
            }
          } finally {
            if (page) {
              await page.close()
            }
          }
        },
        
        resolveUrl(url: string, baseUrl: string) {
          if (url.startsWith('http')) return url
          if (url.startsWith('//')) return `https:${url}`
          if (url.startsWith('/')) return `${baseUrl}${url}`
          return `${baseUrl}/${url}`
        },
        
        parseDate(dateString: string | null) {
          if (!dateString) return null
          
          try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
              // Handle relative dates like "2 hours ago"
              const now = new Date()
              if (dateString.includes('hour')) {
                const hours = parseInt(dateString.match(/\d+/)?.[0] || '0')
                now.setHours(now.getHours() - hours)
                return now.toISOString()
              }
              if (dateString.includes('day')) {
                const days = parseInt(dateString.match(/\d+/)?.[0] || '0')
                now.setDate(now.getDate() - days)
                return now.toISOString()
              }
              return null
            }
            return date.toISOString()
          } catch {
            return null
          }
        },
        
        delay(ms: number) {
          return new Promise(resolve => setTimeout(resolve, ms))
        },
        
        async dispose() {
          if (this.browser) {
            await this.browser.close()
            this.browser = null
            console.log('News scraper browser disposed')
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