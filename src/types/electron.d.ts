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

declare global {
  interface Window {
    newsScraper: NewsScraperAPI
    ipcRenderer: {
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
      off: (channel: string, ...args: any[]) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
} 