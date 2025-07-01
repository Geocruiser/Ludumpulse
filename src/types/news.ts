/**
 * News Types - Type definitions for news scraping and management
 * 
 * This file contains all the interfaces and types used for news
 * scraping, AI processing, and news item management.
 */

export interface NewsItem {
  id: string
  title: string
  url: string
  summary: string | null
  ai_summary: string | null
  sentiment: string | null
  published_at: string | null
  scraped_at: string
  source: string
  game_id: string | null
  created_at: string
  updated_at: string
}

export interface NewsSource {
  id: string
  name: string
  baseUrl: string
  maxArticles: number
  selectors: NewsSelectors
  buildSearchUrl: (gameTitle: string) => string
}

export interface NewsSelectors {
  articleContainer: string
  title: string
  link: string
  date: string
  summary: string
  sourceName: string
}

export interface ScrapingResult {
  sourceId: string
  success: boolean
  articles: ScrapedArticle[]
  error?: string
  scrapedAt: string
  processingTime?: number
}

export interface ScrapedArticle {
  title: string
  url: string
  publishedAt: string | null
  summary: string | null
  source: string
}

export interface NewsFilter {
  source?: string
  sentiment?: string
  gameId?: string
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface NewsSortOptions {
  field: 'published_at' | 'created_at' | 'title' | 'sentiment'
  direction: 'asc' | 'desc'
}

export interface AIProcessingResult {
  summary: string
  sentiment: 'positive' | 'negative' | 'neutral'
  tags: string[]
  relevanceScore: number
}

export interface NewsJobStatus {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  totalSources: number
  completedSources: number
  errors: string[]
  startedAt: string
  completedAt?: string
}

// Enum for supported news sources
export const NEWS_SOURCES = {
  IGN: 'ign',
  GAMESPOT: 'gamespot',
  POLYGON: 'polygon',
  KOTAKU: 'kotaku',
  PCGAMER: 'pcgamer'
} as const

export type NewsSourceId = typeof NEWS_SOURCES[keyof typeof NEWS_SOURCES]

// Sentiment analysis types
export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
} as const

export type SentimentType = typeof SENTIMENT_TYPES[keyof typeof SENTIMENT_TYPES] 