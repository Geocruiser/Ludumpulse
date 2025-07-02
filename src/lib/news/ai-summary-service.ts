/**
 * AI Summary Service
 * 
 * Generates AI-powered summaries of game news articles using LLM APIs.
 * Processes news articles from the last 3 days and creates concise summaries
 * for tracked games.
 */

import { ScrapedArticle } from '@/types/news'

export interface GameNewsSummary {
  gameTitle: string
  summary: string | null
  articlesCount: number
  timeframe: string
  lastUpdated: string
  articles: ScrapedArticle[]
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  keyTopics: string[]
}

export interface AISummaryRequest {
  gameTitle: string
  articles: ScrapedArticle[]
  timeframe: string
}

/**
 * Determines if an article is about patch notes, updates, or game updates
 */
function isUpdateOrPatchArticle(article: ScrapedArticle): boolean {
  const text = `${article.title} ${article.summary || ''}`.toLowerCase()
  
  const updateKeywords = [
    'patch', 'update', 'hotfix', 'patch notes', 'changelog', 'fixes',
    'version', 'build', 'balance', 'nerf', 'buff', 'rework', 'overhaul',
    'release notes', 'what\'s new', 'latest update', 'new features',
    'content update', 'game update', 'title update', 'maintenance',
    'bug fix', 'stability', 'performance', 'optimization', 'tweaks',
    'balance changes', 'gameplay changes', 'system update'
  ]
  
  return updateKeywords.some(keyword => text.includes(keyword))
}

/**
 * Scores articles based on update/patch relevance
 */
function scoreArticleForUpdates(article: ScrapedArticle): number {
  const text = `${article.title} ${article.summary || ''}`.toLowerCase()
  let score = 0
  
  // High priority patch/update keywords
  const highPriorityKeywords = [
    'patch notes', 'hotfix', 'balance changes', 'bug fix', 'game update',
    'title update', 'content update', 'patch', 'update', 'changelog'
  ]
  
  // Medium priority keywords
  const mediumPriorityKeywords = [
    'version', 'build', 'fixes', 'maintenance', 'stability', 'performance',
    'optimization', 'tweaks', 'rework', 'overhaul', 'nerf', 'buff'
  ]
  
  // Count matches and assign scores
  highPriorityKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 100
    }
  })
  
  mediumPriorityKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 50
    }
  })
  
  return score
}

/**
 * Filters articles to only include those from the last 3 days, prioritizing updates
 */
export function filterRecentArticles(articles: ScrapedArticle[], days: number = 3): ScrapedArticle[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const recentArticles = articles.filter(article => {
    if (!article.publishedAt) return false
    
    const publishDate = new Date(article.publishedAt)
    return publishDate >= cutoffDate
  })
  
  // Sort articles with update/patch content first
  return recentArticles.sort((a, b) => {
    const scoreA = scoreArticleForUpdates(a)
    const scoreB = scoreArticleForUpdates(b)
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA // Higher update score first
    }
    
    // If same update score, sort by date
    const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0)
    const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0)
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Analyzes sentiment from article titles and summaries, with special handling for updates
 */
function analyzeSentiment(articles: ScrapedArticle[]): 'positive' | 'negative' | 'neutral' | 'mixed' {
  if (!articles.length) return 'neutral'
  
  // Update-specific positive words (patches and updates are generally positive)
  const updatePositiveWords = [
    'patch', 'update', 'fix', 'hotfix', 'improvement', 'optimization', 'balance',
    'content update', 'new features', 'stability', 'performance', 'enhanced'
  ]
  
  // General positive words
  const positiveWords = [
    'new', 'release', 'expansion', 'better', 'success', 'award', 'achievement', 
    'launch', 'added', 'improved', 'enhanced', 'optimized'
  ]
  
  // Update-specific negative words (usually issues being addressed)
  const updateNegativeWords = [
    'bug', 'glitch', 'crash', 'error', 'broken', 'exploit', 'cheating',
    'unfair', 'overpowered', 'underpowered', 'imbalanced'
  ]
  
  // General negative words
  const negativeWords = [
    'delay', 'postpone', 'cancel', 'issue', 'problem', 'controversy', 
    'criticism', 'fail', 'disappointing', 'poor'
  ]
  
  let positiveCount = 0
  let negativeCount = 0
  
  articles.forEach(article => {
    const text = `${article.title} ${article.summary || ''}`.toLowerCase()
    const isUpdate = isUpdateOrPatchArticle(article)
    
    // For update articles, weight update-specific terms higher
    if (isUpdate) {
      updatePositiveWords.forEach(word => {
        if (text.includes(word)) positiveCount += 2 // Double weight for update positives
      })
      
      updateNegativeWords.forEach(word => {
        if (text.includes(word)) {
          // Bug fixes in patches are actually positive, not negative
          if (text.includes('fix') || text.includes('patch') || text.includes('update')) {
            positiveCount += 1 // Bug fixes are positive in update context
          } else {
            negativeCount += 1
          }
        }
      })
    }
    
    // Standard sentiment analysis
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++
    })
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++
    })
  })
  
  // Adjust thresholds to account for update context
  if (positiveCount > negativeCount * 1.3) return 'positive'
  if (negativeCount > positiveCount * 1.3) return 'negative'
  if (positiveCount > 0 && negativeCount > 0) return 'mixed'
  return 'neutral'
}

/**
 * Extracts key topics from articles, prioritizing patch notes and updates
 */
function extractKeyTopics(articles: ScrapedArticle[]): string[] {
  if (!articles.length) return []
  
  // Prioritize patch/update topics first
  const highPriorityTopics = [
    'patch notes', 'hotfix', 'game update', 'title update', 'content update',
    'balance changes', 'bug fix', 'patch', 'update', 'changelog'
  ]
  
  const mediumPriorityTopics = [
    'dlc', 'expansion', 'version', 'build', 'maintenance', 'performance',
    'optimization', 'rework', 'overhaul', 'nerf', 'buff', 'fixes'
  ]
  
  const lowPriorityTopics = [
    'release', 'beta', 'trailer', 'launch', 'announcement', 'gameplay', 
    'multiplayer', 'single-player', 'story', 'campaign', 'graphics'
  ]
  
  const topicCounts = new Map<string, number>()
  
  articles.forEach(article => {
    const text = `${article.title} ${article.summary || ''}`.toLowerCase()
    
    // High priority topics get 3x weight
    highPriorityTopics.forEach(topic => {
      if (text.includes(topic.replace('-', ' ')) || text.includes(topic)) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 3)
      }
    })
    
    // Medium priority topics get 2x weight
    mediumPriorityTopics.forEach(topic => {
      if (text.includes(topic.replace('-', ' ')) || text.includes(topic)) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 2)
      }
    })
    
    // Low priority topics get 1x weight
    lowPriorityTopics.forEach(topic => {
      if (text.includes(topic.replace('-', ' ')) || text.includes(topic)) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      }
    })
  })
  
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4) // Return top 4 topics instead of 3
    .map(([topic]) => topic)
}

/**
 * Generates an AI summary using OpenAI API
 */
async function generateAISummary(request: AISummaryRequest): Promise<string> {
  // Check if OpenAI API key is available
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    // Fallback to rule-based summary
    return generateFallbackSummary(request)
  }
  
  try {
    const articlesText = request.articles
      .map(article => `Title: ${article.title}\nSummary: ${article.summary || 'No summary available'}`)
      .join('\n\n')
    
    const prompt = `
Please provide a concise summary focused ONLY on actual game changes for "${request.gameTitle}" based on the following articles from ${request.timeframe}:

${articlesText}

STRICT SUMMARY GUIDELINES:
- Keep it under 120 words
- ONLY discuss actual game changes: patches, updates, hotfixes, balance changes, bug fixes, new content, DLC
- COMPLETELY IGNORE AND REJECT: books, novels, novellas, fiction, stories, literature, tie-in novels, prequel novels, sequel novels, lore books, companion books, official novels, canon novels, World of Warcraft novels, authors, writers, publishing, publishers, audiobooks, e-books, paperbacks, hardcovers, movies, TV shows, series, merchandise, business news, reviews, opinions, guides
- Start with "GAME CHANGES:" if there are updates/patches, or "NO GAME CHANGES: Only found content about [books/novels/etc.]" if none
- Be direct: Are there changes coming to the actual game or not?
- Mention specific version numbers, patch details, or update content if available
- For DLC/expansions: only mention if they add actual gameplay content
- Use factual, direct language
- If articles are only about books/novels/media, state "NO GAME CHANGES: Only found content about books/novels/tie-in media with no actual game updates"

Summary:`.trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.choices[0]?.message?.content?.trim() || generateFallbackSummary(request)
    
  } catch (error) {
    console.warn('AI summary generation failed, using fallback:', error)
    return generateFallbackSummary(request)
  }
}

/**
 * Generates a rule-based summary when AI is not available, focusing only on game changes
 */
function generateFallbackSummary(request: AISummaryRequest): string {
  const { gameTitle, articles } = request
  
  if (!articles.length) {
    return `NO GAME CHANGES: No updates or patches reported for ${gameTitle} in the last 3 days.`
  }
  
  // Separate update articles from other articles
  const updateArticles = articles.filter(article => isUpdateOrPatchArticle(article))
  const otherArticles = articles.filter(article => !isUpdateOrPatchArticle(article))
  
  // Focus only on actual game changes
  if (updateArticles.length === 0) {
    return `NO GAME CHANGES: No updates, patches, or content changes reported for ${gameTitle}. ${otherArticles.length} non-update article${otherArticles.length > 1 ? 's' : ''} found but no actual game changes.`
  }
  
  // If we have updates, lead with that
  let summary = `GAME CHANGES: ${updateArticles.length} update${updateArticles.length > 1 ? 's' : ''} or patch${updateArticles.length > 1 ? 'es' : ''} reported for ${gameTitle}.`
  
  // Add most relevant update details
  const topUpdate = updateArticles[0] // Already sorted by update relevance
  summary += ` Latest: "${topUpdate.title}"`
  
  // Extract only update-related topics
  const keyTopics = extractKeyTopics(updateArticles) // Only from update articles
  const updateTopics = keyTopics.filter(topic => 
    ['patch notes', 'hotfix', 'game update', 'title update', 'content update', 
     'balance changes', 'bug fix', 'patch', 'update', 'changelog', 'dlc', 
     'expansion', 'version', 'build', 'maintenance', 'performance', 'optimization'].includes(topic)
  )
  
  if (updateTopics.length > 0) {
    summary += ` Update types: ${updateTopics.slice(0, 3).join(', ')}.`
  }
  
  // Add practical impact
  const sentiment = analyzeSentiment(updateArticles)
  switch (sentiment) {
    case 'positive':
      summary += ' Changes appear to be improvements or additions.'
      break
    case 'negative':
      summary += ' Changes primarily address issues or bugs.'
      break
    case 'mixed':
      summary += ' Mix of improvements and issue fixes.'
      break
    default:
      summary += ' Nature of changes unclear from headlines.'
      break
  }
  
  return summary
}

/**
 * Main function to generate game news summary, focusing only on game changes
 */
export async function generateGameNewsSummary(
  gameTitle: string, 
  articles: ScrapedArticle[]
): Promise<GameNewsSummary> {
  const recentArticles = filterRecentArticles(articles, 3)
  const timeframe = 'last 3 days'
  
  // Check if there are any actual game changes
  const updateArticles = recentArticles.filter(article => isUpdateOrPatchArticle(article))
  const hasGameChanges = updateArticles.length > 0
  
  // Generate summary focusing on game changes
  const summary = recentArticles.length > 0 
    ? await generateAISummary({ gameTitle, articles: recentArticles, timeframe })
    : `NO GAME CHANGES: No updates or patches reported for ${gameTitle} in the last 3 days.`
  
  return {
    gameTitle,
    summary,
    articlesCount: recentArticles.length,
    timeframe,
    lastUpdated: new Date().toISOString(),
    articles: recentArticles,
    sentiment: hasGameChanges ? analyzeSentiment(updateArticles) : 'neutral',
    keyTopics: hasGameChanges ? extractKeyTopics(updateArticles) : extractKeyTopics(recentArticles)
  }
}

/**
 * Batch generate summaries for multiple games
 */
export async function generateBatchGameSummaries(
  games: Array<{ id: string; title: string }>,
  newsData: Map<string, ScrapedArticle[]>
): Promise<GameNewsSummary[]> {
  const summaries: GameNewsSummary[] = []
  
  for (const game of games) {
    const articles = newsData.get(game.title) || []
    const summary = await generateGameNewsSummary(game.title, articles)
    summaries.push(summary)
    
    // Add small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return summaries
} 