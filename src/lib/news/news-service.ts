/**
 * AI-powered News Service
 * Fetches gaming news using NewsAPI and processes it with AI for relevance and analysis
 */

import { ScrapingResult, ScrapedArticle } from '../../types/news'
import { 
  saveNewsArticles, 
  getNewsForTrackedGames, 
  searchStoredNews,
  getTrackedGames,
  cleanupOldNews 
} from '../database'
import { mockNewsData } from './mock-news'

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
 * Main function to scrape and process gaming news - now saves to database
 */
export async function scrapeGameNews(gameTitle: string, saveToDb: boolean = true): Promise<ScrapingResult> {
  try {
    console.log(`Fetching news for: ${gameTitle}`)
    
    // Search for game-specific news
    const query = `"${gameTitle}" gaming OR "video games"`
    const newsResponse = await fetchNewsFromAPI(query, 15)
    
    const relevantArticles: ScrapedArticle[] = []
    
    for (const article of newsResponse.articles) {
      // Filter for gaming relevance and exclude non-game content
      if (isGamingRelevant(article.title, article.description)) {
        const scrapedArticle: ScrapedArticle = {
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          summary: article.description,
          source: article.source.name
        }
        
        // Apply enhanced filtering to exclude gaming chairs, novels, merchandise, etc.
        if (!isGarbageArticle(scrapedArticle)) {
          relevantArticles.push(scrapedArticle)
        } else {
          console.log(`🚫 Filtered out non-game content: "${article.title}"`)
        }
      }
    }
    
    // Sort by publish date
    relevantArticles.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`Found ${relevantArticles.length} relevant articles for ${gameTitle}`)
    
    // Save to database if requested and we have articles
    if (saveToDb && relevantArticles.length > 0) {
      try {
        // Find the game in tracked games to get the ID
        const trackedGamesResult = await getTrackedGames()
        if (trackedGamesResult.success && trackedGamesResult.data) {
          const matchingGame = trackedGamesResult.data.find(
            game => game.title.toLowerCase() === gameTitle.toLowerCase()
          )
          
          if (matchingGame) {
            await saveNewsArticles(relevantArticles.map(article => ({
              title: article.title,
              summary: article.summary,
              fullArticleUrl: article.url,
              publishedAt: article.publishedAt
            })), matchingGame.id)
            console.log(`Saved ${relevantArticles.length} articles to database for ${gameTitle}`)
          }
        }
      } catch (dbError) {
        console.error('Error saving news to database:', dbError)
        // Continue without failing the scraping operation
      }
    }
    
    return {
      sourceId: 'ai-news-api',
      success: true,
      articles: relevantArticles.slice(0, 20),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error fetching game news for ${gameTitle}:`, error)
    console.warn(`API fetch failed for ${gameTitle}. Returning mock news data as a fallback.`)

    // Return a subset of mock data, customized for the game
    const gameMockData = mockNewsData.slice(0, 2).map(article => ({
      ...article,
      title: `[Mock] ${gameTitle}: ${article.title}`,
      source: 'Mock Data'
    }))

    return {
      sourceId: 'mock-news-fallback',
      success: true,
      articles: gameMockData,
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
        const scrapedArticle: ScrapedArticle = {
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          summary: article.description,
          source: article.source.name
        }
        
        // Apply enhanced filtering to exclude gaming chairs, novels, merchandise, etc.
        if (!isGarbageArticle(scrapedArticle)) {
          gamingArticles.push(scrapedArticle)
        } else {
          console.log(`🚫 Filtered out non-game content: "${article.title}"`)
        }
      }
    }
    
    gamingArticles.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    // Save general news to the database without a gameId
    const articlesToSave = gamingArticles.map(article => ({
      title: article.title,
      summary: article.summary,
      fullArticleUrl: article.url,
      publishedAt: article.publishedAt
    }))
    const savedArticlesResult = await saveNewsArticles(articlesToSave)

    let returnedArticles: ScrapedArticle[] = gamingArticles
    if (savedArticlesResult.success && savedArticlesResult.data) {
      // Create a map of URL to ID for quick lookup
      const urlToIdMap = new Map(savedArticlesResult.data.map(item => [item.full_article_url, item.id]))
      // Add the ID to the scraped articles
      returnedArticles = gamingArticles.map(article => ({
        ...article,
        id: urlToIdMap.get(article.url || '')
      }))
    }
    
    return {
      sourceId: 'ai-news-api',
      success: true,
      articles: returnedArticles.slice(0, 20),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching general gaming news:', error)
    console.warn('API fetch failed. Returning mock news data as a fallback.')
    return {
      sourceId: 'mock-news-fallback',
      success: true,
      articles: mockNewsData,
      scrapedAt: new Date().toISOString()
    }
  }
}

/**
 * Search news by query
 */
export async function searchNews(query: string): Promise<ScrapingResult> {
  try {
    // Search stored news first
    const dbResult = await searchStoredNews(query, undefined, 30)
    
    if (dbResult.success && dbResult.data) {
      const articles: ScrapedArticle[] = dbResult.data.map(newsItem => ({
        title: newsItem.title,
        url: newsItem.full_article_url || '',
        publishedAt: newsItem.published_at?.toString() || newsItem.created_at,
        summary: newsItem.summary || null,
        source: newsItem.game?.title || 'Unknown Game'
      })).filter(article => article.url)
      
      console.log(`Found ${articles.length} stored articles matching search: "${query}"`)
      
      return {
        sourceId: 'search-stored',
        success: true,
        articles,
        scrapedAt: new Date().toISOString()
      }
    }
    
    // Fallback to empty results
    return {
      sourceId: 'search-stored',
      success: true,
      articles: [],
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error searching stored news:', error)
    return {
      sourceId: 'search-stored',
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      scrapedAt: new Date().toISOString()
    }
  }
}

/**
 * Check if an article is not about actual game content (to be filtered out)
 */
function isGarbageArticle(article: ScrapedArticle): boolean {
  const title = article.title.toLowerCase()
  const content = `${title} ${article.summary || ''}`.toLowerCase()
  
  // Guide/Tutorial patterns
  const guidePatterns = [
    'how to', 'guide', 'tutorial', 'walkthrough', 'tips', 'tricks', 
    'best ways', 'step by step', 'complete guide', 'beginner\'s guide',
    'ultimate guide', 'full guide', 'detailed guide', 'comprehensive guide',
    'tips and tricks', 'strategies', 'secrets', 'cheats', 'codes',
    'build guide', 'character guide', 'class guide', 'weapon guide',
    'loadout', 'setup', 'configuration', 'settings', 'optimization',
    'explained', 'everything you need to know', 'what you need to know',
    'guide to', 'mastering', 'perfect', 'best settings', 'best config'
  ]
  
  // Opinion/Review patterns
  const opinionPatterns = [
    'review', 'opinion', 'editorial', 'analysis', 'thoughts', 'impressions',
    'hands-on', 'first impressions', 'my take', 'verdict', 'rating',
    'score', 'best of', 'worst of', 'top 10', 'top 5', 'ranking',
    'tier list', 'comparison', 'vs', 'versus', 'better than',
    'should you', 'worth it', 'recommendation', 'pros and cons',
    'deep dive', 'breakdown', 'dissecting', 'examining',
    'we played', 'i played', 'our thoughts', 'what we think',
    'tested', 'trying out', 'after playing', 'hours with',
    'preview', 'early access thoughts', 'beta impressions'
  ]
  
  // Non-game content patterns (books, movies, merchandise, hardware, etc.)
  const nonGameContentPatterns = [
    // Books and literature (comprehensive)
    'book', 'novel', 'novella', 'comic', 'manga', 'graphic novel', 'literature',
    'fiction', 'story', 'tale', 'chronicle', 'saga', 'epic', 'anthology',
    'paperback', 'hardcover', 'e-book', 'ebook', 'audiobook', 'audio book',
    'author', 'writer', 'published', 'publishing', 'publisher', 'publication',
    'chapter', 'prequel novel', 'sequel novel', 'tie-in novel', 'spin-off book',
    'lore book', 'companion book', 'official novel', 'canon novel',
    'bestseller', 'new york times', 'amazon kindle', 'barnes', 'waterstones',
    
    // Movies and TV
    'movie', 'film', 'tv show', 'television', 'series', 'netflix', 'streaming',
    'hbo', 'disney+', 'amazon prime', 'hulu', 'paramount+', 'apple tv',
    'cinema', 'theater', 'theatrical', 'premiere', 'screening', 'actor', 'actress',
    'director', 'producer', 'cast', 'filming', 'box office', 'hollywood',
    
    // Gaming Hardware & Peripherals (comprehensive)
    'gaming chair', 'chair', 'desk', 'gaming desk', 'monitor', 'display',
    'headset', 'headphones', 'keyboard', 'mouse', 'mousepad', 'speakers',
    'webcam', 'microphone', 'mic', 'controller', 'gamepad', 'joystick',
    'graphics card', 'gpu', 'cpu', 'processor', 'motherboard', 'ram', 'memory',
    'hard drive', 'ssd', 'storage', 'power supply', 'psu', 'cooling', 'fan',
    'case', 'pc build', 'gaming pc', 'laptop', 'gaming laptop', 'setup',
    'cable', 'adapter', 'hub', 'dock', 'stand', 'mount', 'lighting', 'rgb',
    'mechanical keyboard', 'wireless mouse', 'gaming mouse', 'gaming headset',
    'surround sound', 'audio interface', 'capture card', 'streaming setup',
    
    // Console Hardware & Accessories
    'console', 'xbox series', 'playstation 5', 'ps5', 'nintendo switch',
    'steam deck', 'handheld', 'portable console', 'joy-con', 'pro controller',
    'charging station', 'dock', 'carrying case', 'screen protector',
    'external storage', 'ssd expansion', 'memory card', 'hard drive expansion',
    
    // Clothing & Physical Merchandise
    'merchandise', 'merch', 'clothing', 'apparel', 't-shirt', 'tshirt', 'shirt',
    'hoodie', 'sweater', 'jacket', 'pants', 'shorts', 'socks', 'hat', 'cap',
    'beanie', 'scarf', 'gloves', 'shoes', 'sneakers', 'slippers', 'pajamas',
    'costume', 'cosplay', 'uniform', 'jersey', 'dress', 'skirt', 'backpack',
    'bag', 'wallet', 'purse', 'watch', 'jewelry', 'necklace', 'ring',
    
    // Collectibles & Physical Items
    'figure', 'figurine', 'collectible', 'statue', 'bust', 'replica',
    'poster', 'art print', 'canvas', 'wall art', 'decoration', 'ornament',
    'funko', 'pop figure', 'action figure', 'toys', 'plushie', 'stuffed animal',
    'calendar', 'artbook', 'art book', 'coffee table book', 'guide book',
    'strategy guide', 'manual', 'cookbook', 'recipe book', 'board game',
    'card game', 'trading cards', 'stickers', 'pins', 'badges', 'patches',
    'keychain', 'lanyard', 'mug', 'cup', 'bottle', 'tumbler', 'coaster',
    'mousepad', 'desk mat', 'cushion', 'pillow', 'blanket', 'throw',
    
    // Retail & Shopping Terms
    'limited edition', 'exclusive', 'pre-order', 'collector\'s edition',
    'special edition', 'deluxe edition', 'ultimate edition', 'premium edition',
    'bundle', 'package', 'set', 'collection', 'box set', 'gift set',
    'on sale', 'discount', 'price drop', 'deal', 'offer', 'promotion',
    'black friday', 'cyber monday', 'holiday sale', 'clearance',
    'amazon', 'best buy', 'target', 'walmart', 'gamestop', 'retail',
    'store', 'shop', 'marketplace', 'ebay', 'etsy', 'shipping', 'delivery',
    
    // Music and audio
    'soundtrack', 'album', 'music', 'composer', 'score', 'ost', 'theme song',
    'vinyl', 'cd', 'digital album', 'spotify', 'apple music', 'bandcamp',
    'concert', 'live performance', 'orchestra', 'symphony', 'musician',
    'singer', 'vocalist', 'band', 'artist', 'recording', 'studio album',
    
    // General media & promotional terms
    'biography', 'documentary', 'behind the scenes', 'making of', 'interview',
    'novelization', 'adaptation', 'based on', 'inspired by', 'spin-off',
    'tie-in', 'spin-off media', 'licensed product', 'brand partnership',
    'collaboration', 'crossover event', 'promotional', 'marketing campaign',
    'advertisement', 'commercial', 'sponsored', 'partnership', 'endorsement',
    'contest', 'giveaway', 'sweepstakes', 'raffle', 'lottery', 'prize',
    'unboxing', 'haul', 'review video', 'first look', 'hands-on video'
  ]
  
  // Business/Industry patterns (not about game content)
  const businessPatterns = [
    'sales figures', 'revenue', 'profit', 'earnings', 'financial',
    'stock price', 'shares', 'market cap', 'investment', 'acquisition',
    'merger', 'buyout', 'ipo', 'quarterly', 'fiscal year',
    'ceo', 'executive', 'board of directors', 'shareholders',
    'lawsuit', 'legal', 'court', 'settlement', 'controversy',
    'layoffs', 'hiring', 'employment', 'studio closure', 'restructuring'
  ]
  
  // Check for guide patterns
  for (const pattern of guidePatterns) {
    if (content.includes(pattern)) {
      return true
    }
  }
  
  // Check for opinion patterns
  for (const pattern of opinionPatterns) {
    if (content.includes(pattern)) {
      return true
    }
  }
  
  // Check for non-game content patterns (books, movies, hardware, merchandise, etc.)
  for (const pattern of nonGameContentPatterns) {
    if (content.includes(pattern)) {
      return true
    }
  }
  
  // Check for business/industry patterns
  for (const pattern of businessPatterns) {
    if (content.includes(pattern)) {
      return true
    }
  }
  
  return false
}

/**
 * Fetch news specifically for tracked games - now uses database
 */
export async function fetchTrackedGamesNews(gameList: Array<{ id: string, title: string }>): Promise<ScrapingResult> {
  try {
    if (!gameList.length) {
      return {
        sourceId: 'tracked-games-news',
        success: true,
        articles: [],
        scrapedAt: new Date().toISOString()
      }
    }

    console.log(`Fetching stored news for ${gameList.length} tracked games`)
    
    // Get news from database first
    const gameIds = gameList.map(game => game.id)
    const dbResult = await getNewsForTrackedGames(gameIds, 50)
    
    if (dbResult.success && dbResult.data) {
      // Convert database format to ScrapedArticle format
      const articles: ScrapedArticle[] = dbResult.data.map(newsItem => ({
        title: newsItem.title,
        url: newsItem.full_article_url || '',
        publishedAt: newsItem.published_at?.toString() || newsItem.created_at,
        summary: newsItem.summary || null,
        source: 'Database'
      })).filter(article => article.url) // Only include articles with URLs
      
      console.log(`Found ${articles.length} stored news articles for tracked games`)
      
      return {
        sourceId: 'tracked-games-news',
        success: true,
        articles,
        scrapedAt: new Date().toISOString()
      }
    }
    
    // Fallback to empty results if database query fails
    console.log('No stored news found, returning empty results')
    return {
      sourceId: 'tracked-games-news',
      success: true,
      articles: [],
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching tracked games news:', error)
    return {
      sourceId: 'tracked-games-news',
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      scrapedAt: new Date().toISOString()
    }
  }
}

/**
 * Scrape fresh news for all tracked games and save to database
 * Automatically cleans up old articles (4+ days) to prevent database bloat
 */
export async function scrapeNewsForAllGames(gameList: Array<{ id: string, title: string }>): Promise<ScrapingResult> {
  try {
    if (!gameList.length) {
      return {
        sourceId: 'fresh-scrape',
        success: true,
        articles: [],
        scrapedAt: new Date().toISOString()
      }
    }

    console.log(`Scraping fresh news for ${gameList.length} tracked games`)
    
    // Clean up old articles first (4+ days old)
    try {
      const cleanupResult = await cleanupOldNews(4)
      if (cleanupResult.success && cleanupResult.data && cleanupResult.data.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanupResult.data.deletedCount} old articles before scraping`)
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup old articles:', cleanupError)
      // Continue with scraping even if cleanup fails
    }
    
    const allArticles: ScrapedArticle[] = []
    const errors: string[] = []
    
    // Scrape news for each game
    for (const game of gameList) {
      try {
        const result = await scrapeGameNews(game.title, true) // saveToDb = true
        if (result.success) {
          allArticles.push(...result.articles)
        } else {
          errors.push(`${game.title}: ${result.error}`)
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        errors.push(`${game.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    console.log(`Scraped ${allArticles.length} total articles for all tracked games`)
    
    return {
      sourceId: 'fresh-scrape',
      success: true,
      articles: allArticles,
      error: errors.length > 0 ? `Some games failed: ${errors.join(', ')}` : undefined,
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error scraping news for all games:', error)
    return {
      sourceId: 'fresh-scrape',
      success: false,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      scrapedAt: new Date().toISOString()
    }
  }
}

/**
 * Initialize news service and perform cleanup
 * Call this on app startup to clean up old articles automatically
 */
export async function initializeNewsService(): Promise<void> {
  try {
    console.log('🚀 Initializing news service...')
    
    // Clean up articles older than 4 days on startup
    const cleanupResult = await cleanupOldNews(4)
    if (cleanupResult.success && cleanupResult.data && cleanupResult.data.deletedCount > 0) {
      console.log(`🧹 Startup cleanup: Removed ${cleanupResult.data.deletedCount} old articles`)
    } else {
      console.log('✅ Database clean - no old articles to remove')
    }
  } catch (error) {
    console.warn('⚠️ Failed to cleanup old articles on startup:', error)
    // Don't throw - this shouldn't block app startup
  }
} 