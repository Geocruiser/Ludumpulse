import { app, ipcMain, BrowserWindow, shell, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
let newsScraperMain = null;
const require2 = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DIST_ELECTRON = path.join(__dirname, "../");
process.env.DIST = path.join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(process.env.DIST_ELECTRON, "../public") : process.env.DIST;
if (process.platform === "win32") app.disableHardwareAcceleration();
if (process.platform === "win32") app.setAppUserModelId(app.getName());
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
let win = null;
const preload = path.join(__dirname, "preload.cjs");
const url = process.env.VITE_DEV_SERVER_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : null);
const indexHtml = path.join(process.env.DIST, "index.html");
async function createWindow() {
  win = new BrowserWindow({
    title: "Ludumpulse",
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: process.env.VITE_PUBLIC ? path.join(process.env.VITE_PUBLIC, "favicon.ico") : void 0,
    webPreferences: {
      preload,
      // Secure settings for modern Electron apps
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    show: false,
    // Don't show until ready-to-show
    autoHideMenuBar: true,
    // Hide menu bar by default
    titleBarStyle: "default"
  });
  win.once("ready-to-show", () => {
    win == null ? void 0 : win.show();
    if (process.env.VITE_DEV_SERVER_URL) {
      win == null ? void 0 : win.webContents.openDevTools();
    }
  });
  if (url) {
    win.loadURL(url);
  } else {
    win.loadFile(indexHtml);
  }
  win.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith("https:")) shell.openExternal(url2);
    return { action: "deny" };
  });
}
async function getNewsScraper() {
  if (!newsScraperMain) {
    try {
      const puppeteer = require2("puppeteer");
      newsScraperMain = {
        browser: null,
        async initialize() {
          if (!this.browser) {
            this.browser = await puppeteer.launch({
              headless: true,
              args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });
          }
        },
        async scrapeGameNews(gameTitle) {
          await this.initialize();
          return [{
            sourceId: "mock",
            success: true,
            articles: [{
              title: `Sample news for ${gameTitle}`,
              url: "https://example.com",
              publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
              summary: `This is a sample news article about ${gameTitle}.`,
              source: "Mock Source"
            }],
            scrapedAt: (/* @__PURE__ */ new Date()).toISOString(),
            processingTime: 100
          }];
        },
        async dispose() {
          if (this.browser) {
            await this.browser.close();
            this.browser = null;
          }
        }
      };
    } catch (error) {
      console.error("Failed to initialize news scraper:", error);
      throw error;
    }
  }
  return newsScraperMain;
}
ipcMain.handle("scrape-game-news", async (event, gameTitle) => {
  try {
    const scraper = await getNewsScraper();
    const results = await scraper.scrapeGameNews(gameTitle);
    return { success: true, data: results };
  } catch (error) {
    console.error("Error in scrape-game-news IPC handler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
});
ipcMain.handle("dispose-news-scraper", async () => {
  try {
    if (newsScraperMain) {
      await newsScraperMain.dispose();
      newsScraperMain = null;
    }
    return { success: true };
  } catch (error) {
    console.error("Error disposing news scraper:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
});
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });
  if (url) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
const createMenu = () => {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" }
      ]
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", role: "reload" },
        { label: "Force Reload", accelerator: "CmdOrCtrl+Shift+R", role: "forceReload" },
        { label: "Toggle Developer Tools", accelerator: "F12", role: "toggleDevTools" },
        { type: "separator" },
        { label: "Actual Size", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
        { label: "Zoom In", accelerator: "CmdOrCtrl+Plus", role: "zoomIn" },
        { label: "Zoom Out", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { type: "separator" },
        { label: "Toggle Fullscreen", accelerator: "F11", role: "togglefullscreen" }
      ]
    },
    {
      label: "Window",
      submenu: [
        { label: "Minimize", accelerator: "CmdOrCtrl+M", role: "minimize" },
        { label: "Close", accelerator: "CmdOrCtrl+W", role: "close" }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
app.whenReady().then(() => {
  createMenu();
});
