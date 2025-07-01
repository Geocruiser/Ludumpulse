/**
 * News Scraper Main Process
 * 
 * This handles news scraping in the Electron main process where Node.js modules
 * like Puppeteer can run. Communicates with renderer via IPC.
 */

import puppeteer, { Browser, Page } from 'puppeteer'

export interface NewsSource {
  id: string
  name: string
  baseUrl: string
  maxArticles: number
  selectors: {
    articleContainer: string
    title: string
    link: string
    date: string
    summary: string
    sourceName: string
  }
  buildSearchUrl: (gameTitle: string) => string
}

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

// News sources configuration
const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'ign',
    name: 'IGN',
    baseUrl: 'https://www.ign.com',
    maxArticles: 15,
    selectors: {
      articleContainer: '.article-item, .jsx-article-item',
      title: '.item-title a, .headline a, h3 a',
      link: '.item-title a, .headline a, h3 a',
      date: '.publish-date, .article-timestamp, time',
      summary: '.item-summary, .article-summary, .excerpt',
      sourceName: 'IGN'
    },
    buildSearchUrl: (gameTitle: string) => {
      const encodedTitle = encodeURIComponent(gameTitle)
      return `https://www.ign.com/search?q=${encodedTitle}&type=article&filter=articles`
    }
  },
  {
    id: 'gamespot',
    name: 'GameSpot',
    baseUrl: 'https://www.gamespot.com',
    maxArticles: 15,
    selectors: {
      articleContainer: '.media-article, .news-river-article',
      title: '.media-title a, .news-river-title a, h3 a',
      link: '.media-title a, .news-river-title a, h3 a',
      date: '.media-date, .news-river-date, .publish-date',
      summary: '.media-summary, .news-river-summary, .article-summary',
      sourceName: 'GameSpot'
    },
    buildSearchUrl: (gameTitle: string) => {
      const encodedTitle = encodeURIComponent(gameTitle)
      return `https://www.gamespot.com/search/?q=${encodedTitle}&i=news`
    }
  },
  {
    id: 'polygon',
    name: 'Polygon',
    baseUrl: 'https://www.polygon.com',
    maxArticles: 15,
    selectors: {
      articleContainer: '.c-entry-box, .c-compact-river__entry',
      title: '.c-entry-box--compact__title a, .c-entry-box__title a',
      link: '.c-entry-box--compact__title a, .c-entry-box__title a',
      date: '.c-byline__item time, .c-entry-box__meta time',
      summary: '.c-entry-box__dek, .c-entry-summary',
      sourceName: 'Polygon'
    },
    buildSearchUrl: (gameTitle: string) => {
      const encodedTitle = encodeURIComponent(gameTitle)
      return `https://www.polygon.com/search?q=${encodedTitle}`
    }
  }
]

class MainProcessNewsScraper {
  private browser: Browser | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

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
      this.isInitialized = true
      console.log('News scraper initialized successfully')
    } catch (error) {
      console.error('Failed to initialize news scraper:', error)
      throw new Error('Browser initialization failed')
    }
  }

  async scrapeGameNews(gameTitle: string): Promise<ScrapingResult[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const results: ScrapingResult[] = []

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
  }

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
      console.log(`Scraping ${source.name} for "${gameTitle}": ${searchUrl}`)
      
      // Navigate to the search page
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      })

      // Extract articles
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
        .slice(0, source.maxArticles || 10)

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

  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
    this.isInitialized = false
  }
}

// Export singleton instance
export const newsScraperMain = new MainProcessNewsScraper() 