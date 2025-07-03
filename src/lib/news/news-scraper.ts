/**
 * News Scraper - Main class for coordinating news scraping from various sources
 * 
 * This class manages the scraping of gaming news from multiple sources,
 * implements rate limiting, and handles error recovery.
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import { NewsSource, ScrapingResult } from '@/types/news'

export interface ScrapingConfig {
  maxConcurrentPages: number
  requestDelay: number
  retryAttempts: number
  timeout: number
}

export class NewsScraper {
  private browser: Browser | null = null
  private config: ScrapingConfig
  private activeSources: Map<string, NewsSource> = new Map()

  constructor(config: ScrapingConfig = {
    maxConcurrentPages: 3,
    requestDelay: 2000, // 2 seconds between requests
    retryAttempts: 3,
    timeout: 30000 // 30 seconds
  }) {
    this.config = config
  }

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) return

    try {
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
    } catch (error) {
      console.error('Failed to initialize browser:', error)
      throw new Error('Browser initialization failed')
    }
  }

  /**
   * Register a news source for scraping
   */
  registerSource(source: NewsSource): void {
    this.activeSources.set(source.id, source)
  }

  /**
   * Scrape news for a specific game from all registered sources
   */
  async scrapeGameNews(gameTitle: string): Promise<ScrapingResult[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.')
    }

    const results: ScrapingResult[] = []
    const sources = Array.from(this.activeSources.values())

    // Process sources with concurrency control
    const chunks = this.chunkArray(sources, this.config.maxConcurrentPages)
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(source => 
        this.scrapeFromSource(source, gameTitle)
      )
      
      const chunkResults = await Promise.allSettled(chunkPromises)
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`Failed to scrape from ${chunk[index].name}:`, result.reason)
          results.push({
            sourceId: chunk[index].id,
            success: false,
            error: result.reason.message,
            articles: [],
            scrapedAt: new Date().toISOString()
          })
        }
      })

      // Rate limiting between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(this.config.requestDelay)
      }
    }

    return results
  }

  /**
   * Scrape news from a specific source
   */
  private async scrapeFromSource(source: NewsSource, gameTitle: string): Promise<ScrapingResult> {
    const startTime = Date.now()
    let page: Page | null = null

    try {
      if (!this.browser) {
        throw new Error('Browser not available')
      }

      page = await this.browser.newPage()
      
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
      await page.setViewport({ width: 1920, height: 1080 })

      // Build search URL
      const searchUrl = source.buildSearchUrl(gameTitle)
      
      // Navigate to the search page
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      })

      // Extract articles using the source's selector configuration
      const articles = await page.evaluate((selectors) => {
        const articleElements = document.querySelectorAll(selectors.articleContainer)
        const extractedArticles: any[] = []

        articleElements.forEach((element) => {
          try {
            const titleElement = element.querySelector(selectors.title)
            const linkElement = element.querySelector(selectors.link)
            const dateElement = element.querySelector(selectors.date)
            const summaryElement = element.querySelector(selectors.summary)

            if (titleElement && linkElement) {
              extractedArticles.push({
                title: titleElement.textContent?.trim() || '',
                url: linkElement.getAttribute('href') || '',
                publishedAt: dateElement?.textContent?.trim() || null,
                summary: summaryElement?.textContent?.trim() || null,
                source: selectors.sourceName
              })
            }
          } catch (error) {
            console.warn('Error extracting article:', error)
          }
        })

        return extractedArticles
      }, source.selectors)

      // Process and clean the articles
      const processedArticles = articles
        .filter(article => article.title && article.url)
        .map(article => ({
          ...article,
          url: this.resolveUrl(article.url, source.baseUrl),
          publishedAt: this.parseDate(article.publishedAt),
        }))
        .slice(0, source.maxArticles || 10) // Limit results

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
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Utility methods
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `${baseUrl}${url}`
    return `${baseUrl}/${url}`
  }

  private parseDate(dateString: string | null): string | null {
    if (!dateString) return null
    
    try {
      // Try to parse various date formats
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
  }
} 