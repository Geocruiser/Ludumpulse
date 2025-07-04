/**
 * News Manager - Central coordinator for news scraping and management
 * 
 * This class orchestrates news scraping from multiple sources,
 * manages deduplication, and handles database operations.
 */

import { NewsScraper } from './news-scraper'
import { getAllNewsSources } from './sources'
import { supabase } from '@/lib/supabase'
import { NewsItem, ScrapedArticle, NewsJobStatus } from '@/types/news'

export class NewsManager {
  private scraper: NewsScraper
  private initialized = false

  constructor() {
    this.scraper = new NewsScraper()
  }

  /**
   * Initialize the news manager and scraper
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    await this.scraper.initialize()
    
    // Register all available news sources
    const sources = getAllNewsSources()
    sources.forEach(source => this.scraper.registerSource(source))
    
    this.initialized = true
  }

  /**
   * Scrape news for a specific game and save to database
   */
  async scrapeGameNews(gameId: string, gameTitle: string): Promise<NewsJobStatus> {
    if (!this.initialized) {
      await this.initialize()
    }

    const jobId = `news-job-${gameId}-${Date.now()}`
    const jobStatus: NewsJobStatus = {
      id: jobId,
      status: 'running',
      progress: 0,
      totalSources: getAllNewsSources().length,
      completedSources: 0,
      errors: [],
      startedAt: new Date().toISOString()
    }

    try {
      console.log(`Starting news scraping for game: ${gameTitle}`)
      
      // Scrape from all sources
      const scrapingResults = await this.scraper.scrapeGameNews(gameTitle)
      
      // Process and save results
      let totalArticles = 0
      for (const result of scrapingResults) {
        try {
          if (result.success && result.articles.length > 0) {
            const savedCount = await this.saveArticles(result.articles, gameId)
            totalArticles += savedCount
            console.log(`Saved ${savedCount} articles from ${result.sourceId}`)
          } else if (!result.success && result.error) {
            jobStatus.errors.push(`${result.sourceId}: ${result.error}`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          jobStatus.errors.push(`${result.sourceId}: ${errorMessage}`)
          console.error(`Error processing ${result.sourceId}:`, error)
        }
        
        jobStatus.completedSources++
        jobStatus.progress = (jobStatus.completedSources / jobStatus.totalSources) * 100
      }

      jobStatus.status = 'completed'
      jobStatus.completedAt = new Date().toISOString()
      
      console.log(`News scraping completed. Total articles saved: ${totalArticles}`)
      return jobStatus

    } catch (error) {
      console.error('News scraping failed:', error)
      jobStatus.status = 'failed'
      jobStatus.errors.push(error instanceof Error ? error.message : 'Unknown error')
      jobStatus.completedAt = new Date().toISOString()
      return jobStatus
    }
  }

  /**
   * Save scraped articles to the database with deduplication
   */
  private async saveArticles(articles: ScrapedArticle[], gameId: string): Promise<number> {
    if (articles.length === 0) return 0

    try {
      // Check for existing articles to avoid duplicates
      const existingUrls = await this.getExistingArticleUrls(articles.map(a => a.url))
      
      // Filter out duplicates
      const newArticles = articles.filter(article => 
        !existingUrls.has(article.url) && article.title && article.url
      )

      if (newArticles.length === 0) {
        console.log('No new articles to save (all duplicates)')
        return 0
      }

      // Prepare data for insertion
      const newsItemsToInsert = newArticles.map(article => ({
        title: article.title,
        url: article.url,
        summary: article.summary,
        published_at: article.publishedAt,
        scraped_at: new Date().toISOString(),
        source: article.source,
        game_id: gameId,
        ai_summary: null,
        sentiment: null
      }))

      // Insert into database
      const { data, error } = await supabase
        .from('news_items')
        .insert(newsItemsToInsert)
        .select('id')

      if (error) {
        console.error('Database insertion error:', error)
        throw error
      }

      return data ? data.length : 0

    } catch (error) {
      console.error('Error saving articles:', error)
      throw error
    }
  }

  /**
   * Get existing article URLs to check for duplicates
   */
  private async getExistingArticleUrls(urls: string[]): Promise<Set<string>> {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('url')
        .in('url', urls)

      if (error) {
        console.error('Error checking existing URLs:', error)
        return new Set()
      }

      return new Set(data?.map(item => item.url) || [])
    } catch (error) {
      console.error('Error in getExistingArticleUrls:', error)
      return new Set()
    }
  }

  /**
   * Get news items for a specific game
   */
  async getGameNews(gameId: string, limit = 50): Promise<NewsItem[]> {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('game_id', gameId)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching game news:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getGameNews:', error)
      throw error
    }
  }

  /**
   * Get recent news items across all games
   */
  async getRecentNews(limit = 50): Promise<NewsItem[]> {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select(`
          *,
          tracked_games (
            title,
            tags
          )
        `)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent news:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getRecentNews:', error)
      throw error
    }
  }

  /**
   * Search news items
   */
  async searchNews(query: string, gameId?: string): Promise<NewsItem[]> {
    try {
      let queryBuilder = supabase
        .from('news_items')
        .select('*')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .order('published_at', { ascending: false })

      if (gameId) {
        queryBuilder = queryBuilder.eq('game_id', gameId)
      }

      const { data, error } = await queryBuilder

      if (error) {
        console.error('Error searching news:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in searchNews:', error)
      throw error
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    await this.scraper.dispose()
    this.initialized = false
  }
} 