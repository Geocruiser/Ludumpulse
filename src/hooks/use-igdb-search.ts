/**
 * IGDB Search Hook
 * 
 * React hook for searching games using the IGDB API.
 * Provides functions for game search, popular games, and upcoming games.
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  searchGames,
  getGameById,
  getPopularGames,
  getUpcomingGames,
  isIGDBConfigured
} from '@/lib/game-apis/igdb-service'
import { TrackedGame } from '@/types/database'

/**
 * Hook for searching games with IGDB API
 */
export function useGameSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<TrackedGame[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  /**
   * Search for games by query string
   */
  const searchForGames = useCallback(async (query: string, limit?: number) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchError(null)
    
    try {
      const results = await searchGames(query.trim(), limit)
      setSearchResults(results)
      setSearchQuery(query)
    } catch (error) {
      console.error('Game search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Failed to search games')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
  }, [])

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    searchForGames,
    clearSearch
  }
}

/**
 * Hook for getting a specific game by IGDB ID
 */
export function useGameDetails(igdbId: number | null) {
  return useQuery({
    queryKey: ['igdb-game', igdbId],
    queryFn: () => igdbId ? getGameById(igdbId) : null,
    enabled: !!igdbId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  })
}

/**
 * Hook for getting popular games
 */
export function usePopularGames(limit: number = 50) {
  return useQuery({
    queryKey: ['igdb-popular-games', limit],
    queryFn: () => getPopularGames(limit),
    enabled: true,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

/**
 * Hook for getting upcoming games
 */
export function useUpcomingGames(limit: number = 50) {
  return useQuery({
    queryKey: ['igdb-upcoming-games', limit],
    queryFn: () => getUpcomingGames(limit),
    enabled: true,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

/**
 * Hook for IGDB configuration status
 */
export function useIGDBStatus() {
  return useQuery({
    queryKey: ['igdb-status'],
    queryFn: () => isIGDBConfigured(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
} 