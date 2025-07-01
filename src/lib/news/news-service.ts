/**
 * AI-powered News Service
 * Fetches gaming news using NewsAPI and processes it with AI for relevance and analysis
 */

import { ScrapingResult, ScrapedArticle } from '../../types/news'

// NewsAPI configuration with fallback
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || (() => {
  console.warn('⚠️ VITE_NEWS_API_KEY not found in environment variables')
  return undefined
})()
const NEWS_API_BASE_URL = 'https://newsapi.org/v2'

// Simple environment check
if (!NEWS_API_KEY) {
  console.error('❌ NEWS_API_KEY is not available - news features will be limited')
} else {
  console.log('✅ News API initialized')
}

interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: Array<{
    source: { name: string }
    title: string
    description: string | null
    url: string
    publishedAt: string
    content: string | null
  }>
}

/**
 * Fetches gaming news from NewsAPI
 */
async function fetchNewsFromAPI(query: string, pageSize: number = 20): Promise<NewsAPIResponse> {
  if (!NEWS_API_KEY) {
    throw new Error('NEWS_API_KEY environment variable is not set')
  }

  const params = new URLSearchParams({
    q: query,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: pageSize.toString(),
    apiKey: NEWS_API_KEY
  })

  const response = await fetch(`${NEWS_API_BASE_URL}/everything?${params}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`NewsAPI error: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Simple gaming relevance check
 */
function isGamingRelevant(title: string, description: string | null): boolean {
  const content = `${title} ${description || ''}`.toLowerCase()
  const gamingKeywords = [
    'game', 'gaming', 'xbox', 'playstation', 'nintendo', 'steam', 
    'esports', 'video game', 'pc gaming', 'mobile game', 'console',
    'gameplay', 'trailer', 'review', 'beta', 'dlc', 'expansion'
  ]
  
  return gamingKeywords.some(keyword => content.includes(keyword))
}

/**
 * Main function to scrape and process gaming news
 */
export async function scrapeGameNews(gameTitle: string): Promise<ScrapingResult> {
  try {
    console.log(`Fetching news for: ${gameTitle}`)
    
    // Search for game-specific news
    const query = `"${gameTitle}" gaming OR "video games"`
    const newsResponse = await fetchNewsFromAPI(query, 15)
    
    const relevantArticles: ScrapedArticle[] = []
    
    for (const article of newsResponse.articles) {
      // Filter for gaming relevance
      if (isGamingRelevant(article.title, article.description)) {
        relevantArticles.push({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          summary: article.description,
          source: article.source.name
        })
      }
    }
    
    // Sort by publish date
    relevantArticles.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`Found ${relevantArticles.length} relevant articles for ${gameTitle}`)
    
    return {
      sourceId: 'ai-news-api',
      success: true,
      articles: relevantArticles.slice(0, 20),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching game news:', error)
    return {
      sourceId: 'ai-news-api',
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      scrapedAt: new Date().toISOString()
    }
  }
}

/**
 * Fetch general gaming news
 */
export async function fetchGeneralGamingNews(): Promise<ScrapingResult> {
  try {
    const query = 'gaming OR "video games" OR esports'
    const newsResponse = await fetchNewsFromAPI(query, 25)
    
    const gamingArticles: ScrapedArticle[] = []
    
    for (const article of newsResponse.articles) {
      if (isGamingRelevant(article.title, article.description)) {
        gamingArticles.push({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          summary: article.description,
          source: article.source.name
        })
      }
    }
    
    gamingArticles.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    
    return {
      sourceId: 'ai-news-api',
      success: true,
      articles: gamingArticles.slice(0, 20),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching general gaming news:', error)
    return {
      sourceId: 'ai-news-api',
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      scrapedAt: new Date().toISOString()
    }
  }
}

/**
 * Search news by query
 */
export async function searchNews(query: string): Promise<ScrapingResult> {
  try {
    const searchQuery = `${query} gaming OR "video games"`
    const newsResponse = await fetchNewsFromAPI(searchQuery, 20)
    
    const searchResults: ScrapedArticle[] = []
    
    for (const article of newsResponse.articles) {
      searchResults.push({
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt,
        summary: article.description,
        source: article.source.name
      })
    }
    
    searchResults.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    
    return {
      sourceId: 'ai-news-api',
      success: true,
      articles: searchResults,
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error searching news:', error)
    return {
      sourceId: 'ai-news-api',
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      scrapedAt: new Date().toISOString()
    }
  }
} 