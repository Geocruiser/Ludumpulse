/* eslint-disable */
/**
 * Electron Preload Script (CommonJS)
 *
 * This script runs in the renderer process before the web page loads.
 * It exposes safe IPC wrappers and domain-specific APIs (IGDB, newsScraper)
 * through Electron's `contextBridge`.
 */

const { contextBridge, ipcRenderer } = require('electron')

// ---------------------------------------------------------------------------
//  Debug helpers – visible in the renderer DevTools console
// ---------------------------------------------------------------------------
console.log('=== PRELOAD SCRIPT (.cjs) STARTING ===')
console.log('contextBridge exists:', typeof contextBridge)
console.log('ipcRenderer exists:', typeof ipcRenderer)

// Simple sanity check – proves the bridge is functional
try {
  contextBridge.exposeInMainWorld('preloadTest', {
    isWorking() {
      return 'preload bridge operational'
    }
  })
  console.log('preloadTest exposed')
} catch (err) {
  console.error('Failed exposing preloadTest:', err)
}

// ---------------------------------------------------------------------------
//  Generic ipcRenderer wrapper (on / off / send / invoke)
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel, listener) {
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(channel, listener) {
    return ipcRenderer.off(channel, listener)
  },
  send(channel, ...args) {
    ipcRenderer.send(channel, ...args)
  },
  invoke(channel, ...args) {
    return ipcRenderer.invoke(channel, ...args)
  }
})
console.log('ipcRenderer proxy exposed')

// ---------------------------------------------------------------------------
//  IGDB API – thin wrappers around IPC handlers defined in main process
// ---------------------------------------------------------------------------
console.log('Exposing igdbApi…')
try {
  contextBridge.exposeInMainWorld('igdbApi', {
    searchGames: (q, limit) => ipcRenderer.invoke('igdb:search-games', q, limit),
    getGameById:       (id)    => ipcRenderer.invoke('igdb:get-game-by-id', id),
    getPopularGames:   (limit) => ipcRenderer.invoke('igdb:get-popular-games', limit),
    getTrendingGames: (genres, limit) => ipcRenderer.invoke('igdb:get-trending-games', genres, limit),
    testConnection:           () => ipcRenderer.invoke('igdb:test-connection'),
    isConfigured:             () => ipcRenderer.invoke('igdb:is-configured')
  })
  console.log('igdbApi exposed')
} catch (err) {
  console.error('Failed exposing igdbApi:', err)
}

// ---------------------------------------------------------------------------
//  News-scraper API
// ---------------------------------------------------------------------------
console.log('Exposing newsScraper…')
try {
  contextBridge.exposeInMainWorld('newsScraper', {
    scrapeGameNews: gameTitle => ipcRenderer.invoke('scrape-game-news', gameTitle),
    dispose:              () => ipcRenderer.invoke('dispose-news-scraper')
  })
  console.log('newsScraper exposed')
} catch (err) {
  console.error('Failed exposing newsScraper:', err)
}

// ---------------------------------------------------------------------------
//  Diagnostics helper – callable from DevTools for quick checks
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('diagnostics', {
  testIGDBAvailability() {
    console.log('diagnostics.testIGDBAvailability')
    const available = typeof window.igdbApi !== 'undefined'
    console.log('  window.igdbApi exists:', available)
    if (available) {
      console.log('  methods:', Object.keys(window.igdbApi))
    }
    return available
  },
  async testIGDBConnection() {
    if (!window.igdbApi) return { success: false, message: 'igdbApi missing' }
    try {
      return await window.igdbApi.testConnection()
    } catch (err) {
      console.error('diagnostics.testIGDBConnection error:', err)
      return { success: false, message: err?.message || 'unknown error' }
    }
  }
})
console.log('diagnostics exposed')

// ---------------------------------------------------------------------------
//  Final ready-check once DOM is interactive
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  console.log('=== PRELOAD (.cjs) DOMContentLoaded ===')
  console.log('Available global keys:', Object.keys(window).filter(k => /igdb|news|ipc|preload|diagnostic/i.test(k)))
})

console.log('=== PRELOAD SCRIPT (.cjs) READY ===') 