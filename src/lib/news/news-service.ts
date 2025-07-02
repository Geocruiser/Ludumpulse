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
  
  // Alternate media patterns (books, movies, merchandise, etc.)
  const alternateMediaPatterns = [
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
    'cinema', 'theater', 'theatrical', 'premiere', 'screening',
    
    // Merchandise and collectibles
    'merchandise', 'merch', 'figure', 'figurine', 'collectible', 'statue',
    'clothing', 'apparel', 't-shirt', 'hoodie', 'poster', 'art print',
    'funko', 'toys', 'plushie', 'calendar', 'artbook', 'art book',
    'limited edition', 'exclusive', 'pre-order', 'collector\'s edition',
    
    // Music and audio
    'soundtrack', 'album', 'music', 'composer', 'score', 'ost',
    'vinyl', 'cd', 'digital album', 'spotify', 'apple music',
    
    // General media terms
    'biography', 'documentary', 'behind the scenes', 'making of',
    'novelization', 'adaptation', 'based on', 'inspired by',
    'tie-in', 'spin-off media', 'licensed product', 'brand partnership',
    'collaboration', 'crossover event', 'promotional', 'marketing campaign',
    'contest', 'giveaway', 'sweepstakes', 'raffle'
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
  
  // Check for alternate media patterns (books, movies, etc.)
  for (const pattern of alternateMediaPatterns) {
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
 * Check if an article title specifically mentions the tracked game
 */
function isGameRelevant(article: ScrapedArticle, gameTitle: string): { relevant: boolean; score: number; gameTitle: string } {
  const articleTitle = article.title.toLowerCase()
  const gameTitleLower = gameTitle.toLowerCase()
  
  // First check if it's a garbage article
  if (isGarbageArticle(article)) {
    return {
      relevant: false,
      score: 0,
      gameTitle
    }
  }
  
  // Extract game name parts for better matching
  const gameWords = gameTitleLower.split(/[\s\-_:]+/).filter(word => word.length > 2)
  
  let score = 0
  let titleMatches = 0
  
  // Exact title match in article title (highest priority)
  if (articleTitle.includes(gameTitleLower)) {
    score += 200
    titleMatches++
  }
  
  // Individual significant word matches in title only
  gameWords.forEach(word => {
    if (articleTitle.includes(word)) {
      score += 50
      titleMatches++
    }
  })
  
  // Franchise/series matching in title (specific patterns)
  const franchisePatterns = [
    { pattern: 'call of duty', aliases: ['cod'] },
    { pattern: 'elder scrolls', aliases: ['skyrim', 'morrowind', 'oblivion'] },
    { pattern: 'grand theft auto', aliases: ['gta'] },
    { pattern: 'final fantasy', aliases: ['ff'] },
    { pattern: 'assassin\'s creed', aliases: ['assassins creed'] },
    { pattern: 'battlefield', aliases: [] },
    { pattern: 'pokemon', aliases: ['pokémon'] },
    { pattern: 'super mario', aliases: ['mario'] },
    { pattern: 'zelda', aliases: ['legend of zelda'] },
    { pattern: 'halo', aliases: [] },
    { pattern: 'minecraft', aliases: [] },
    { pattern: 'fortnite', aliases: [] },
    { pattern: 'apex legends', aliases: ['apex'] },
    { pattern: 'world of warcraft', aliases: ['wow'] },
    { pattern: 'counter-strike', aliases: ['cs', 'csgo', 'cs2'] },
    { pattern: 'league of legends', aliases: ['lol'] },
    { pattern: 'overwatch', aliases: [] },
    { pattern: 'cyberpunk 2077', aliases: ['cyberpunk'] },
    { pattern: 'the witcher', aliases: ['witcher'] },
    { pattern: 'red dead', aliases: ['rdr'] }
  ]
  
  franchisePatterns.forEach(({ pattern, aliases }) => {
    if (gameTitleLower.includes(pattern)) {
      if (articleTitle.includes(pattern)) {
        score += 150
        titleMatches++
      }
      aliases.forEach(alias => {
        if (articleTitle.includes(alias)) {
          score += 120
          titleMatches++
        }
      })
    }
  })
  
  // CRITICAL priority for patch notes and updates (massive boost)
  const criticalUpdatePatterns = [
    'patch notes', 'hotfix', 'patch', 'game update', 'title update',
    'content update', 'changelog', 'release notes', 'bug fix', 'fixes'
  ]
  
  // High priority for other update content
  const highUpdatePatterns = [
    'update', 'version', 'build', 'balance changes', 'buffs', 'nerfs',
    'rework', 'overhaul', 'maintenance', 'stability', 'performance'
  ]
  
  // Medium priority for future content
  const mediumUpdatePatterns = [
    'coming to', 'coming soon', 'roadmap', 'season', 'expansion',
    'dlc', 'new content', 'upcoming', 'next update', 'beta', 'alpha',
    'early access', 'what\'s new', 'new features'
  ]
  
  // Critical updates get massive boost (patches, hotfixes, etc.)
  criticalUpdatePatterns.forEach(pattern => {
    if (articleTitle.includes(pattern)) {
      score += 500 // Massive boost for critical updates
      titleMatches++
    }
  })
  
  // High priority updates get major boost
  highUpdatePatterns.forEach(pattern => {
    if (articleTitle.includes(pattern)) {
      score += 350 // Major boost for high priority updates
      titleMatches++
    }
  })
  
  // Medium priority updates get moderate boost
  mediumUpdatePatterns.forEach(pattern => {
    if (articleTitle.includes(pattern)) {
      score += 200 // Moderate boost for medium priority updates
      titleMatches++
    }
  })
  
  // Medium priority for announcements and releases
  const announcementPatterns = [
    'announced', 'reveals', 'confirmed', 'official', 'launch',
    'release date', 'trailer', 'teaser', 'gameplay', 'showcase',
    'developer', 'studio', 'team', 'news', 'breaking'
  ]
  
  announcementPatterns.forEach(pattern => {
    if (articleTitle.includes(pattern)) {
      score += 100 // Moderate boost for announcements
    }
  })
  
  // Bonus for multiple word matches (indicates stronger relevance)
  if (titleMatches >= 2) {
    score += 50
  }
  
  // Only consider articles that have at least one meaningful match in the title
  return {
    relevant: score >= 50 && titleMatches > 0, // Much higher threshold, title-focused
    score,
    gameTitle
  }
}

/**
 * Fetch news specifically for tracked games
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

    console.log(`Fetching news for ${gameList.length} tracked games`)
    
    // Create search query heavily prioritizing game updates, excluding alternate media
    const gameNames = gameList.map(game => `"${game.title}"`).join(' OR ')
    const query = `(${gameNames}) AND ("patch notes" OR hotfix OR "game update" OR "title update" OR "content update" OR patch OR update OR "balance changes" OR "bug fix" OR changelog OR "release notes" OR version OR build OR maintenance OR stability OR performance OR dlc OR expansion OR "coming to" OR "coming soon" OR beta OR alpha OR trailer OR release OR announcement OR launch) -guide -tutorial -review -"how to" -tips -walkthrough -opinion -analysis -"first impressions" -preview -hands-on -book -novel -novella -fiction -story -tale -chronicle -saga -epic -anthology -paperback -hardcover -ebook -"e-book" -audiobook -"audio book" -author -writer -published -publishing -publisher -publication -chapter -"prequel novel" -"sequel novel" -"tie-in novel" -"spin-off book" -"lore book" -"companion book" -"official novel" -"canon novel" -bestseller -movie -film -"tv show" -television -series -netflix -streaming -hbo -disney -cinema -theater -theatrical -premiere -screening -merchandise -merch -figure -figurine -collectible -statue -clothing -apparel -"t-shirt" -hoodie -poster -soundtrack -album -music -composer -funko -toys -plushie -calendar -artbook -"art book" -"limited edition" -exclusive -"pre-order" -"collector's edition" -vinyl -cd -"digital album" -spotify -biography -documentary -"behind the scenes" -"making of" -novelization -adaptation -"tie-in" -"spin-off media" -"licensed product" -collaboration -promotional -contest -giveaway -sweepstakes`
    
    const newsResponse = await fetchNewsFromAPI(query, 100)
    
    const trackedGameArticles: (ScrapedArticle & { matchedGame?: string; relevanceScore?: number })[] = []
    
    for (const article of newsResponse.articles) {
      // Check if article is gaming relevant first
      if (!isGamingRelevant(article.title, article.description)) {
        continue
      }
      
      const scrapedArticle: ScrapedArticle = {
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt,
        summary: article.description,
        source: article.source.name
      }
      
      // Check relevance to each tracked game
      let bestMatch = { relevant: false, score: 0, gameTitle: '' }
      
      for (const game of gameList) {
        const match = isGameRelevant(scrapedArticle, game.title)
        if (match.relevant && match.score > bestMatch.score) {
          bestMatch = match
        }
      }
      
      // Only include articles that are relevant to at least one tracked game
      if (bestMatch.relevant) {
        trackedGameArticles.push({
          ...scrapedArticle,
          matchedGame: bestMatch.gameTitle,
          relevanceScore: bestMatch.score
        })
      }
    }
    
    // Sort by relevance score first, then by date
    trackedGameArticles.sort((a, b) => {
      const scoreA = a.relevanceScore || 0
      const scoreB = b.relevanceScore || 0
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA // Higher score first
      }
      
      // If scores are equal, sort by date
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`Found ${trackedGameArticles.length} news articles for tracked games (excluding guides/opinions)`)
    
    return {
      sourceId: 'tracked-games-news',
      success: true,
      articles: trackedGameArticles.slice(0, 25), // Return top 25 most relevant
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