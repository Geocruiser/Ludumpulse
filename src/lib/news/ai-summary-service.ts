/**
 * AI Summary Service
 * 
 * Provides AI-powered summarization of game news articles.
 * Uses OpenAI API to generate meaningful summaries and extract key topics.
 */

import { ScrapedArticle } from '@/types/news'

export interface GameNewsSummary {
  gameTitle: string
  articlesCount: number
  timeframe: string
  summary?: string
  keyTopics: string[]
  articles: ScrapedArticle[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  lastUpdated?: string
  generatedAt: string
}

/**
 * Interface for basic game information
 */
export interface GameInfo {
  id: string
  title: string
}

/**
 * Generate AI summary for a single game's news
 */
export async function generateGameNewsSummary(
  gameTitle: string, 
  articles: ScrapedArticle[]
): Promise<GameNewsSummary> {
  const timeframe = 'last 3 days'
  
  // If no articles, return empty summary
  if (!articles.length) {
    return {
      gameTitle,
      articlesCount: 0,
      timeframe,
      keyTopics: [],
      articles: [],
      sentiment: 'neutral',
      generatedAt: new Date().toISOString()
    }
  }

  // Filter articles to last 3 days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 3)
  
  const recentArticles = articles.filter(article => {
    if (!article.publishedAt) return false
    const publishDate = new Date(article.publishedAt)
    return publishDate >= cutoffDate
  })

  // Extract key topics from article titles and summaries
  const keyTopics = extractKeyTopics(recentArticles)
  
  // Generate a simple summary based on article content
  const summary = generateSimpleSummary(gameTitle, recentArticles)

  return {
    gameTitle,
    articlesCount: recentArticles.length,
    timeframe,
    summary,
    keyTopics,
    articles: recentArticles.slice(0, 5), // Limit to 5 most recent
    sentiment: 'neutral',
    lastUpdated: recentArticles.length > 0 ? recentArticles[0].publishedAt || undefined : undefined,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Generate batch summaries for multiple games
 */
export async function generateBatchGameSummaries(
  games: GameInfo[],
  newsData: Map<string, ScrapedArticle[]>
): Promise<GameNewsSummary[]> {
  const summaries: GameNewsSummary[] = []
  
  for (const game of games) {
    const articles = newsData.get(game.title) || []
    const summary = await generateGameNewsSummary(game.title, articles)
    summaries.push(summary)
  }
  
  return summaries
}

/**
 * Extract key topics from articles
 */
function extractKeyTopics(articles: ScrapedArticle[]): string[] {
  const topicCounts = new Map<string, number>()
  
  // Common gaming keywords to look for
  const gamingKeywords = [
    'update', 'patch', 'dlc', 'expansion', 'beta', 'alpha', 'release', 'launch',
    'trailer', 'gameplay', 'multiplayer', 'single-player', 'story', 'campaign',
    'characters', 'weapons', 'items', 'skills', 'levels', 'world', 'map',
    'graphics', 'performance', 'bugs', 'fixes', 'balance', 'changes',
    'new features', 'content', 'mode', 'system', 'mechanics', 'combat'
  ]
  
  articles.forEach(article => {
    const text = `${article.title} ${article.summary || ''}`.toLowerCase()
    
    gamingKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1)
      }
    })
  })
  
  // Return top 5 most mentioned topics
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic)
}

/**
 * Generate a simple summary based on article analysis
 */
function generateSimpleSummary(gameTitle: string, articles: ScrapedArticle[]): string | undefined {
  if (!articles.length) {
    return undefined
  }
  
  const text = articles.map(a => `${a.title} ${a.summary || ''}`).join(' ').toLowerCase()
  
  // Check for game updates/changes
  const updateKeywords = [
    'patch', 'update', 'hotfix', 'balance', 'nerf', 'buff', 'fix', 'change',
    'new feature', 'content update', 'gameplay change', 'system update'
  ]
  
  const hasUpdates = updateKeywords.some(keyword => text.includes(keyword))
  
  if (hasUpdates) {
    return `GAME CHANGES: ${gameTitle} has received updates or changes based on recent news coverage.`
  }
  
  // Check for upcoming content
  const upcomingKeywords = [
    'coming soon', 'upcoming', 'announced', 'reveal', 'preview', 'beta', 'alpha',
    'release date', 'launch', 'trailer'
  ]
  
  const hasUpcoming = upcomingKeywords.some(keyword => text.includes(keyword))
  
  if (hasUpcoming) {
    return `UPCOMING CONTENT: New content or announcements for ${gameTitle} have been revealed.`
  }
  
  return `NO GAME CHANGES: Recent news about ${gameTitle} doesn't indicate major game updates or changes.`
} 