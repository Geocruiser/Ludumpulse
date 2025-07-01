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
 * Add a new tracked game
 */
export async function addTrackedGame(
  title: string, 
  tags: string[], 
  releaseStatus: 'RELEASED' | 'UNRELEASED',
  releaseDate?: string
): Promise<ApiResponse<TrackedGame>> {
  try {
    const { data, error } = await supabase
      .from('tracked_games')
      .insert({
        title,
        tags,
        release_status: releaseStatus,
        release_date: releaseDate,
      })
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