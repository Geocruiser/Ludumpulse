/**
 * Electron API Type Declarations
 * 
 * Type definitions for Electron APIs exposed to the renderer process
 * through the preload script via contextBridge.
 */

export interface ScrapedArticle {
  title: string
  url: string
  publishedAt: string | null
  summary: string | null
  source: string
}

export interface ScrapingResult {
  sourceId: string
  success: boolean
  articles: ScrapedArticle[]
  error?: string
  scrapedAt: string
  processingTime?: number
}

export interface NewsScraperAPI {
  scrapeGameNews: (gameTitle: string) => Promise<{
    success: boolean
    data?: ScrapingResult[]
    error?: string
  }>
  dispose: () => Promise<{
    success: boolean
    error?: string
  }>
}

export interface IElectronAPI {
  toggleDevTools: () => void
  openExternal: (url: string) => void
  showOpenDialog: (options: any) => Promise<any>
  getAppVersion: () => Promise<string>
  isMac: () => boolean
  isWindows: () => boolean
  isLinux: () => boolean
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => void
  
  // News scraping API
  scrapeNews: (sources: string[]) => Promise<any[]>
  onNewsUpdate: (callback: (news: any[]) => void) => void
  stopNewsScraping: () => void
  
  // IGDB API
  igdb: {
    searchGames: (query: string, limit?: number) => Promise<{
      success: boolean
      data?: any[]
      error?: string
    }>
    getGameById: (igdbId: number) => Promise<{
      success: boolean
      data?: any
      error?: string
    }>
    getPopularGames: (limit?: number) => Promise<{
      success: boolean
      data?: any[]
      error?: string
    }>
    getTrendingGames: (genres?: string[], limit?: number) => Promise<{
      success: boolean
      data?: any[]
      error?: string
    }>
    testConnection: () => Promise<{
      success: boolean
      message: string
      data?: any
    }>
    isConfigured: () => Promise<boolean>
  }
}

declare global {
  interface Window {
    newsScraper: NewsScraperAPI
    electronAPI: IElectronAPI
    ipcRenderer: {
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
      off: (channel: string, listener: (event: any, ...args: any[]) => void) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
    
    // IGDB API directly exposed
    igdbApi: {
      searchGames: (query: string, limit?: number) => Promise<{
        success: boolean
        data?: any[]
        error?: string
      }>
      getGameById: (igdbId: number) => Promise<{
        success: boolean
        data?: any
        error?: string
      }>
      getPopularGames: (limit?: number) => Promise<{
        success: boolean
        data?: any[]
        error?: string
      }>
      getTrendingGames: (genres?: string[], limit?: number) => Promise<{
        success: boolean
        data?: any[]
        error?: string
      }>
      testConnection: () => Promise<{
        success: boolean
        message: string
        data?: any
      }>
      isConfigured: () => Promise<boolean>
    }
  }
} 