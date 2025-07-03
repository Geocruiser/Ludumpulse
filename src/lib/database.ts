/**
 * Database Query Functions
 * 
 * This file contains functions for interacting with the database using Supabase.
 */

import { supabase } from '@/lib/supabase'
import type { 
  TrackedGame, 
  NewsItem, 
  GameSuggestion, 
  Notification,
  ApiResponse 
} from '@/types/database'

/**
 * Get all tracked games for the current user
 */
export async function getTrackedGames(): Promise<ApiResponse<TrackedGame[]>> {
  try {
    const { data, error } = await supabase
      .from('tracked_games')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Add a new tracked game with IGDB integration
 */
export async function addTrackedGame(
  gameData: {
    title: string
    tags: string[]
    releaseStatus: 'RELEASED' | 'UNRELEASED'
    // IGDB fields (optional)
    igdbId?: number
    coverArtUrl?: string
    description?: string
    releaseDate?: string
    developer?: string
    publisher?: string
    genres?: string[]
    platforms?: string[]
    rating?: number
    screenshots?: string[]
  }
): Promise<ApiResponse<TrackedGame>> {
  try {
    // Get current authenticated user to set user_id (RLS requires this)
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return { success: false, error: 'User not authenticated' }
    }

    const insertData = {
      user_id: authUser.id,
      title: gameData.title,
      tags: gameData.tags,
      release_status: gameData.releaseStatus,
      // IGDB fields
      igdb_id: gameData.igdbId,
      cover_art_url: gameData.coverArtUrl,
      description: gameData.description,
      release_date: gameData.releaseDate,
      developer: gameData.developer,
      publisher: gameData.publisher,
      genres: gameData.genres || [],
      platforms: gameData.platforms || [],
      rating: typeof gameData.rating === 'number' ? Math.round(gameData.rating) : undefined,
      screenshots: gameData.screenshots || [],
    }

    const { data, error } = await supabase
      .from('tracked_games')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete a tracked game
 */
export async function deleteTrackedGame(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('tracked_games')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get news items for a specific game
 */
export async function getNewsForGame(gameId: string): Promise<ApiResponse<NewsItem[]>> {
  try {
    const { data, error } = await supabase
      .from('news_items')
      .select('*')
      .eq('game_id', gameId)
      .order('published_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get game suggestions for the current user
 */
export async function getGameSuggestions(): Promise<ApiResponse<GameSuggestion[]>> {
  try {
    const { data, error } = await supabase
      .from('game_suggestions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update game suggestion status
 */
export async function updateSuggestionStatus(
  id: string, 
  status: 'ACCEPTED' | 'DISMISSED'
): Promise<ApiResponse<GameSuggestion>> {
  try {
    const { data, error } = await supabase
      .from('game_suggestions')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(): Promise<ApiResponse<Notification[]>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save news articles to the database for a specific game
 */
export async function saveNewsArticles(
  articles: Array<{
    title: string
    summary?: string | null
    fullArticleUrl?: string
    publishedAt?: string | null
  }>,
  gameId?: string, 
): Promise<ApiResponse<NewsItem[]>> {
  try {
    if (!articles.length) {
      return { success: true, data: [] }
    }

    // Format articles for database insertion
    const newsItems = articles.map(article => ({
      game_id: gameId,
      title: article.title,
      summary: article.summary,
      full_article_url: article.fullArticleUrl,
      published_at: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
    }))

    // Check for existing articles to avoid duplicates
    let query = supabase
      .from('news_items')
      .select('full_article_url')
      .in('full_article_url', newsItems.map(item => item.full_article_url).filter(Boolean) as string[])

    if (gameId) {
      query = query.eq('game_id', gameId)
    }

    const existingUrls = await query

    const existingUrlSet = new Set(
      (existingUrls.data || []).map(item => item.full_article_url).filter(Boolean) as string[]
    )

    // Filter out duplicates
    const newItems = newsItems.filter(item => 
      item.full_article_url && !existingUrlSet.has(item.full_article_url)
    )

    if (newItems.length === 0) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('news_items')
      .insert(newItems)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get all news items for tracked games, with optional limit
 */
export async function getNewsForTrackedGames(
  gameIds: string[], 
  limit: number = 50
): Promise<ApiResponse<(NewsItem & { game?: { title: string } })[]>> {
  try {
    if (!gameIds.length) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('news_items')
      .select(`
        *,
        game:tracked_games(title)
      `)
      .in('game_id', gameIds)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Search news items by title or summary
 */
export async function searchStoredNews(
  query: string, 
  gameIds?: string[], 
  limit: number = 30
): Promise<ApiResponse<(NewsItem & { game?: { title: string } })[]>> {
  try {
    let supabaseQuery = supabase
      .from('news_items')
      .select(`
        *,
        game:tracked_games(title)
      `)

    // Add text search
    if (query.trim()) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,summary.ilike.%${query}%`
      )
    }

    // Filter by game IDs if provided
    if (gameIds && gameIds.length > 0) {
      supabaseQuery = supabaseQuery.in('game_id', gameIds)
    }

    const { data, error } = await supabaseQuery
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Clean up old news items (older than specified days)
 * Default is 4 days to prevent database bloat while keeping recent news
 */
export async function cleanupOldNews(olderThanDays: number = 4): Promise<ApiResponse<{ deletedCount: number }>> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // First, count how many will be deleted for logging
    const { count } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString())

    // Then delete them
    const { error } = await supabase
      .from('news_items')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      return { success: false, error: error.message }
    }

    const deletedCount = count || 0
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old news articles (older than ${olderThanDays} days)`)
    }

    return { success: true, data: { deletedCount } }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 