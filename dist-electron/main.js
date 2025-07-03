import { app, ipcMain, BrowserWindow, shell, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import require$$0 from "fs";
import require$$1 from "path";
import require$$2 from "os";
import require$$3 from "crypto";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var main = { exports: {} };
const version = "17.0.1";
const require$$4 = {
  version
};
var hasRequiredMain;
function requireMain() {
  if (hasRequiredMain) return main.exports;
  hasRequiredMain = 1;
  const fs = require$$0;
  const path2 = require$$1;
  const os = require$$2;
  const crypto = require$$3;
  const packageJson = require$$4;
  const version2 = packageJson.version;
  const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function parse(src) {
    const obj = {};
    let lines = src.toString();
    lines = lines.replace(/\r\n?/mg, "\n");
    let match;
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1];
      let value = match[2] || "";
      value = value.trim();
      const maybeQuote = value[0];
      value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, "\n");
        value = value.replace(/\\r/g, "\r");
      }
      obj[key] = value;
    }
    return obj;
  }
  function _parseVault(options) {
    options = options || {};
    const vaultPath = _vaultPath(options);
    options.path = vaultPath;
    const result = DotenvModule.configDotenv(options);
    if (!result.parsed) {
      const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
      err.code = "MISSING_DATA";
      throw err;
    }
    const keys = _dotenvKey(options).split(",");
    const length = keys.length;
    let decrypted;
    for (let i = 0; i < length; i++) {
      try {
        const key = keys[i].trim();
        const attrs = _instructions(result, key);
        decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
        break;
      } catch (error) {
        if (i + 1 >= length) {
          throw error;
        }
      }
    }
    return DotenvModule.parse(decrypted);
  }
  function _warn(message) {
    console.error(`[dotenv@${version2}][WARN] ${message}`);
  }
  function _debug(message) {
    console.log(`[dotenv@${version2}][DEBUG] ${message}`);
  }
  function _log(message) {
    console.log(`[dotenv@${version2}] ${message}`);
  }
  function _dotenvKey(options) {
    if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
      return options.DOTENV_KEY;
    }
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
      return process.env.DOTENV_KEY;
    }
    return "";
  }
  function _instructions(result, dotenvKey) {
    let uri;
    try {
      uri = new URL(dotenvKey);
    } catch (error) {
      if (error.code === "ERR_INVALID_URL") {
        const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      throw error;
    }
    const key = uri.password;
    if (!key) {
      const err = new Error("INVALID_DOTENV_KEY: Missing key part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environment = uri.searchParams.get("environment");
    if (!environment) {
      const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
    const ciphertext = result.parsed[environmentKey];
    if (!ciphertext) {
      const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
      err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
      throw err;
    }
    return { ciphertext, key };
  }
  function _vaultPath(options) {
    let possibleVaultPath = null;
    if (options && options.path && options.path.length > 0) {
      if (Array.isArray(options.path)) {
        for (const filepath of options.path) {
          if (fs.existsSync(filepath)) {
            possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
          }
        }
      } else {
        possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
      }
    } else {
      possibleVaultPath = path2.resolve(process.cwd(), ".env.vault");
    }
    if (fs.existsSync(possibleVaultPath)) {
      return possibleVaultPath;
    }
    return null;
  }
  function _resolveHome(envPath) {
    return envPath[0] === "~" ? path2.join(os.homedir(), envPath.slice(1)) : envPath;
  }
  function _configVault(options) {
    const debug = Boolean(options && options.debug);
    const quiet = Boolean(options && options.quiet);
    if (debug || !quiet) {
      _log("Loading env from encrypted .env.vault");
    }
    const parsed = DotenvModule._parseVault(options);
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsed, options);
    return { parsed };
  }
  function configDotenv(options) {
    const dotenvPath = path2.resolve(process.cwd(), ".env");
    let encoding = "utf8";
    const debug = Boolean(options && options.debug);
    const quiet = Boolean(options && options.quiet);
    if (options && options.encoding) {
      encoding = options.encoding;
    } else {
      if (debug) {
        _debug("No encoding is specified. UTF-8 is used by default");
      }
    }
    let optionPaths = [dotenvPath];
    if (options && options.path) {
      if (!Array.isArray(options.path)) {
        optionPaths = [_resolveHome(options.path)];
      } else {
        optionPaths = [];
        for (const filepath of options.path) {
          optionPaths.push(_resolveHome(filepath));
        }
      }
    }
    let lastError;
    const parsedAll = {};
    for (const path22 of optionPaths) {
      try {
        const parsed = DotenvModule.parse(fs.readFileSync(path22, { encoding }));
        DotenvModule.populate(parsedAll, parsed, options);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${path22} ${e.message}`);
        }
        lastError = e;
      }
    }
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    const populated = DotenvModule.populate(processEnv, parsedAll, options);
    if (debug || !quiet) {
      const keysCount = Object.keys(populated).length;
      const shortPaths = [];
      for (const filePath of optionPaths) {
        try {
          const relative = path2.relative(process.cwd(), filePath);
          shortPaths.push(relative);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${filePath} ${e.message}`);
          }
          lastError = e;
        }
      }
      _log(`injecting env (${keysCount}) from ${shortPaths.join(",")} – [tip] encrypt with dotenvx: https://dotenvx.com`);
    }
    if (lastError) {
      return { parsed: parsedAll, error: lastError };
    } else {
      return { parsed: parsedAll };
    }
  }
  function config(options) {
    if (_dotenvKey(options).length === 0) {
      return DotenvModule.configDotenv(options);
    }
    const vaultPath = _vaultPath(options);
    if (!vaultPath) {
      _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
      return DotenvModule.configDotenv(options);
    }
    return DotenvModule._configVault(options);
  }
  function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), "hex");
    let ciphertext = Buffer.from(encrypted, "base64");
    const nonce = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(-16);
    ciphertext = ciphertext.subarray(12, -16);
    try {
      const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
      aesgcm.setAuthTag(authTag);
      return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
    } catch (error) {
      const isRange = error instanceof RangeError;
      const invalidKeyLength = error.message === "Invalid key length";
      const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
      if (isRange || invalidKeyLength) {
        const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      } else if (decryptionFailed) {
        const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
        err.code = "DECRYPTION_FAILED";
        throw err;
      } else {
        throw error;
      }
    }
  }
  function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options && options.debug);
    const override = Boolean(options && options.override);
    const populated = {};
    if (typeof parsed !== "object") {
      const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      err.code = "OBJECT_REQUIRED";
      throw err;
    }
    for (const key of Object.keys(parsed)) {
      if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
        if (override === true) {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
        if (debug) {
          if (override === true) {
            _debug(`"${key}" is already defined and WAS overwritten`);
          } else {
            _debug(`"${key}" is already defined and was NOT overwritten`);
          }
        }
      } else {
        processEnv[key] = parsed[key];
        populated[key] = parsed[key];
      }
    }
    return populated;
  }
  const DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate
  };
  main.exports.configDotenv = DotenvModule.configDotenv;
  main.exports._configVault = DotenvModule._configVault;
  main.exports._parseVault = DotenvModule._parseVault;
  main.exports.config = DotenvModule.config;
  main.exports.decrypt = DotenvModule.decrypt;
  main.exports.parse = DotenvModule.parse;
  main.exports.populate = DotenvModule.populate;
  main.exports = DotenvModule;
  return main.exports;
}
var mainExports = requireMain();
const dotenv = /* @__PURE__ */ getDefaultExportFromCjs(mainExports);
let newsScraperMain = null;
dotenv.config();
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
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, "index.html");
console.log("Environment variables:");
console.log("VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DIST:", process.env.DIST);
console.log("DIST_ELECTRON:", process.env.DIST_ELECTRON);
console.log("Resolved paths:");
console.log("url:", url);
console.log("indexHtml:", indexHtml);
console.log("preload:", preload);
let twitchAccessToken = null;
let tokenExpiryTime = 0;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.VITE_TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || process.env.VITE_TWITCH_CLIENT_SECRET;
console.log("IGDB Configuration Debug:");
console.log("TWITCH_CLIENT_ID:", TWITCH_CLIENT_ID ? "Set" : "Not set");
console.log("TWITCH_CLIENT_SECRET:", TWITCH_CLIENT_SECRET ? "Set" : "Not set");
console.log("Is IGDB configured?", !!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET));
async function getTwitchAccessToken() {
  if (twitchAccessToken && Date.now() < tokenExpiryTime) {
    return twitchAccessToken;
  }
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables are required");
  }
  try {
    console.log("Getting Twitch access token...");
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials"
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token request failed:", response.status, errorText);
      throw new Error(`Failed to get Twitch access token: ${response.statusText}`);
    }
    const data = await response.json();
    twitchAccessToken = data.access_token;
    tokenExpiryTime = Date.now() + data.expires_in * 1e3 - 3e5;
    console.log("Successfully got Twitch access token");
    return twitchAccessToken;
  } catch (error) {
    console.error("Error getting Twitch access token:", error);
    throw error;
  }
}
async function makeIGDBRequest(endpoint, query) {
  const token = await getTwitchAccessToken();
  if (!TWITCH_CLIENT_ID || !token) {
    throw new Error("IGDB API not properly configured");
  }
  try {
    console.log("Making IGDB request:", endpoint, query);
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain"
      },
      body: query
    });
    console.log("IGDB response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("IGDB API request failed:", response.status, errorText);
      throw new Error(`IGDB API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log("IGDB response data:", data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("IGDB API request error:", error);
    throw error;
  }
}
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
      sandbox: false,
      // Allow WebSocket connections in development
      webSecurity: !process.env.VITE_DEV_SERVER_URL,
      // Allow loading content from localhost in development
      allowRunningInsecureContent: !!process.env.VITE_DEV_SERVER_URL
    },
    show: false,
    // Don't show until ready-to-show
    autoHideMenuBar: true,
    // Hide menu bar by default
    titleBarStyle: "default"
  });
  win.once("ready-to-show", () => {
    win?.show();
    if (process.env.VITE_DEV_SERVER_URL) {
      win?.webContents.openDevTools();
    }
  });
  console.log("Loading Electron app:", {
    url,
    VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
    NODE_ENV: process.env.NODE_ENV,
    indexHtml
  });
  if (url) {
    console.log("Loading from URL:", url);
    win.loadURL(url);
  } else if (process.env.NODE_ENV === "development") {
    const devServerUrl = "http://localhost:3000";
    console.log("Loading from dev server fallback:", devServerUrl);
    win.loadURL(devServerUrl);
  } else {
    console.log("Loading from file:", indexHtml);
    win.loadFile(indexHtml);
  }
  win.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith("https:")) shell.openExternal(url2);
    return { action: "deny" };
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
}
const NEWS_SOURCES = [
  {
    id: "ign",
    name: "IGN",
    baseUrl: "https://www.ign.com",
    maxArticles: 10,
    selectors: {
      articleContainer: ".article-item, .jsx-article-item, .item",
      title: ".item-title a, .headline a, h3 a, .title a",
      link: ".item-title a, .headline a, h3 a, .title a",
      date: ".publish-date, .article-timestamp, time, .date",
      summary: ".item-summary, .article-summary, .excerpt, .summary",
      sourceName: "IGN"
    },
    buildSearchUrl: (gameTitle) => {
      const encodedTitle = encodeURIComponent(gameTitle);
      return `https://www.ign.com/search?q=${encodedTitle}`;
    }
  },
  {
    id: "gamespot",
    name: "GameSpot",
    baseUrl: "https://www.gamespot.com",
    maxArticles: 10,
    selectors: {
      articleContainer: ".media-article, .news-river-article, .card",
      title: ".media-title a, .news-river-title a, h3 a, .card-title a",
      link: ".media-title a, .news-river-title a, h3 a, .card-title a",
      date: ".media-date, .news-river-date, .publish-date, .date",
      summary: ".media-summary, .news-river-summary, .article-summary, .summary",
      sourceName: "GameSpot"
    },
    buildSearchUrl: (gameTitle) => {
      const encodedTitle = encodeURIComponent(gameTitle);
      return `https://www.gamespot.com/search/?q=${encodedTitle}`;
    }
  },
  {
    id: "polygon",
    name: "Polygon",
    baseUrl: "https://www.polygon.com",
    maxArticles: 10,
    selectors: {
      articleContainer: ".c-entry-box, .c-compact-river__entry, article",
      title: ".c-entry-box--compact__title a, .c-entry-box__title a, h2 a",
      link: ".c-entry-box--compact__title a, .c-entry-box__title a, h2 a",
      date: ".c-byline__item time, .c-entry-box__meta time, time",
      summary: ".c-entry-box__dek, .c-entry-summary, .summary",
      sourceName: "Polygon"
    },
    buildSearchUrl: (gameTitle) => {
      const encodedTitle = encodeURIComponent(gameTitle);
      return `https://www.polygon.com/search?q=${encodedTitle}`;
    }
  }
];
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
              args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu"
              ]
            });
            console.log("News scraper browser initialized");
          }
        },
        async scrapeGameNews(gameTitle) {
          await this.initialize();
          console.log(`Starting news scraping for: ${gameTitle}`);
          const results = [];
          for (const source of NEWS_SOURCES) {
            try {
              const result = await this.scrapeFromSource(source, gameTitle);
              results.push(result);
              await this.delay(2e3);
            } catch (error) {
              console.error(`Error scraping from ${source.name}:`, error);
              results.push({
                sourceId: source.id,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                articles: [],
                scrapedAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
          return results;
        },
        async scrapeFromSource(source, gameTitle) {
          const startTime = Date.now();
          let page = null;
          try {
            page = await this.browser.newPage();
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
            await page.setViewport({ width: 1920, height: 1080 });
            const searchUrl = source.buildSearchUrl(gameTitle);
            console.log(`Scraping ${source.name}: ${searchUrl}`);
            await page.goto(searchUrl, {
              waitUntil: "networkidle2",
              timeout: 3e4
            });
            await page.waitForTimeout(3e3);
            const articles = await page.evaluate((selectors) => {
              const articleElements = document.querySelectorAll(selectors.articleContainer);
              const extractedArticles = [];
              for (let i = 0; i < Math.min(articleElements.length, 10); i++) {
                const element = articleElements[i];
                try {
                  const titleElement = element.querySelector(selectors.title);
                  const linkElement = element.querySelector(selectors.link);
                  const dateElement = element.querySelector(selectors.date);
                  const summaryElement = element.querySelector(selectors.summary);
                  if (titleElement && linkElement) {
                    const title = titleElement.textContent?.trim();
                    const url2 = linkElement.getAttribute("href");
                    if (title && url2 && title.length > 10) {
                      extractedArticles.push({
                        title,
                        url: url2,
                        publishedAt: dateElement?.textContent?.trim() || dateElement?.getAttribute("datetime") || null,
                        summary: summaryElement?.textContent?.trim() || null,
                        source: selectors.sourceName
                      });
                    }
                  }
                } catch (error) {
                  console.warn("Error extracting article:", error);
                }
              }
              return extractedArticles;
            }, source.selectors);
            const processedArticles = articles.filter((article) => article.title && article.url).map((article) => ({
              ...article,
              url: this.resolveUrl(article.url, source.baseUrl),
              publishedAt: this.parseDate(article.publishedAt)
            })).slice(0, source.maxArticles);
            console.log(`Found ${processedArticles.length} articles from ${source.name}`);
            return {
              sourceId: source.id,
              success: true,
              articles: processedArticles,
              scrapedAt: (/* @__PURE__ */ new Date()).toISOString(),
              processingTime: Date.now() - startTime
            };
          } catch (error) {
            console.error(`Error scraping from ${source.name}:`, error);
            return {
              sourceId: source.id,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              articles: [],
              scrapedAt: (/* @__PURE__ */ new Date()).toISOString(),
              processingTime: Date.now() - startTime
            };
          } finally {
            if (page) {
              await page.close();
            }
          }
        },
        resolveUrl(url2, baseUrl) {
          if (url2.startsWith("http")) return url2;
          if (url2.startsWith("//")) return `https:${url2}`;
          if (url2.startsWith("/")) return `${baseUrl}${url2}`;
          return `${baseUrl}/${url2}`;
        },
        parseDate(dateString) {
          if (!dateString) return null;
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
              const now = /* @__PURE__ */ new Date();
              if (dateString.includes("hour")) {
                const hours = parseInt(dateString.match(/\d+/)?.[0] || "0");
                now.setHours(now.getHours() - hours);
                return now.toISOString();
              }
              if (dateString.includes("day")) {
                const days = parseInt(dateString.match(/\d+/)?.[0] || "0");
                now.setDate(now.getDate() - days);
                return now.toISOString();
              }
              return null;
            }
            return date.toISOString();
          } catch {
            return null;
          }
        },
        delay(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        },
        async dispose() {
          if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log("News scraper browser disposed");
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
ipcMain.handle("scrape-game-news", async (_event, gameTitle) => {
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
ipcMain.handle("igdb:search-games", async (_event, query, limit = 20) => {
  try {
    const cleanQuery = query.trim().replace(/"/g, '\\"');
    const searchQuery = `fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,rating,rating_count,screenshots.url; search "${cleanQuery}"; where category = 0; limit ${limit};`;
    const games = await makeIGDBRequest("games", searchQuery);
    return { success: true, data: games };
  } catch (error) {
    console.error("Error searching games:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to search games" };
  }
});
ipcMain.handle("igdb:get-game-by-id", async (_event, igdbId) => {
  try {
    const gameQuery = `fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,rating,rating_count,screenshots.url; where id = ${igdbId};`;
    const games = await makeIGDBRequest("games", gameQuery);
    return { success: true, data: games.length > 0 ? games[0] : null };
  } catch (error) {
    console.error("Error getting game by ID:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get game details" };
  }
});
ipcMain.handle("igdb:get-popular-games", async (_event, limit = 50) => {
  try {
    const popularQuery = `fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,rating,rating_count; where category = 0 & rating_count > 100; sort rating_count desc; limit ${limit};`;
    const games = await makeIGDBRequest("games", popularQuery);
    return { success: true, data: games };
  } catch (error) {
    console.error("Error getting popular games:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get popular games" };
  }
});
ipcMain.handle("igdb:get-trending-games", async (_event, genres = [], limit = 50) => {
  try {
    let trendingQuery = `fields id,name,summary,cover.url,first_release_date,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,rating,rating_count; where category = 0 & rating_count > 50`;
    if (genres.length > 0) {
      const genreMap = {
        "Action": 4,
        "Adventure": 31,
        "RPG": 12,
        "Strategy": 15,
        "Simulation": 13,
        "Sports": 14,
        "Racing": 10,
        "Shooter": 5,
        "Fighting": 4,
        "Platform": 8,
        "Puzzle": 9,
        "Arcade": 33,
        "Indie": 32,
        "MMORPG": 36,
        "Real Time Strategy (RTS)": 11,
        "Turn-based strategy (TBS)": 16,
        "Tactical": 24,
        "Hack and slash/Beat 'em up": 25,
        "Quiz/Trivia": 26,
        "Pinball": 30,
        "Card & Board Game": 34,
        "MOBA": 36,
        "Point-and-click": 2,
        "Music": 7,
        "Visual Novel": 34
      };
      const genreIds = genres.map((genre) => genreMap[genre]).filter((id) => id !== void 0);
      if (genreIds.length > 0) {
        trendingQuery += ` & genres = (${genreIds.join(",")})`;
      }
    }
    trendingQuery += `; sort rating_count desc; limit ${limit};`;
    const games = await makeIGDBRequest("games", trendingQuery);
    return { success: true, data: games };
  } catch (error) {
    console.error("Error getting trending games:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get trending games" };
  }
});
ipcMain.handle("igdb:test-connection", async () => {
  try {
    console.log("Testing IGDB connection...");
    await getTwitchAccessToken();
    console.log("Token obtained successfully");
    const testQuery = `fields name; where id = 1942; limit 1;`;
    const games = await makeIGDBRequest("games", testQuery);
    return {
      success: true,
      message: `IGDB API working! Found ${games.length} games`,
      data: games
    };
  } catch (error) {
    console.error("IGDB test failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null
    };
  }
});
ipcMain.handle("igdb:is-configured", () => {
  const isConfigured = !!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET);
  console.log("IGDB isConfigured check:", isConfigured);
  console.log("CLIENT_ID present:", !!TWITCH_CLIENT_ID);
  console.log("CLIENT_SECRET present:", !!TWITCH_CLIENT_SECRET);
  return isConfigured;
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
