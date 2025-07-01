/**
 * News Hooks - React Query hooks for news management
 * 
 * Provides hooks for scraping news, fetching news items,
 * and managing news-related operations with proper caching.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { newsService, NewsJobStatus } from '@/lib/news/news-service'
import { NewsItem } from '@/types/news'
import { useToast } from './use-toast'

/**
 * Hook to scrape news for a specific game
 */
export function useScrapeGameNews() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameId, gameTitle }: { gameId: string; gameTitle: string }) => {
      return await newsService.scrapeGameNews(gameId, gameTitle)
    },
    onSuccess: (jobStatus: NewsJobStatus, { gameId, gameTitle }) => {
      if (jobStatus.status === 'completed') {
        toast({
          title: 'News Scraping Complete',
          description: `Successfully scraped news for ${gameTitle}`,
        })
        
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['news', gameId] })
        queryClient.invalidateQueries({ queryKey: ['news', 'recent'] })
      } else if (jobStatus.status === 'failed') {
        toast({
          title: 'News Scraping Failed',
          description: `Failed to scrape news for ${gameTitle}`,
          variant: 'destructive',
        })
      }
    },
    onError: (error: Error) => {
      console.error('News scraping error:', error)
      toast({
        title: 'Error',
        description: 'Failed to start news scraping',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to fetch news for a specific game
 */
export function useGameNews(gameId: string, limit = 50) {
  return useQuery({
    queryKey: ['news', gameId, limit],
    queryFn: async () => {
      return await newsService.getGameNews(gameId, limit)
    },
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to fetch recent news across all games
 */
export function useRecentNews(limit = 50) {
  return useQuery({
    queryKey: ['news', 'recent', limit],
    queryFn: async () => {
      return await newsService.getRecentNews(limit)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to search news items
 */
export function useSearchNews(query: string, gameId?: string) {
  return useQuery({
    queryKey: ['news', 'search', query, gameId],
    queryFn: async () => {
      if (!query.trim()) return []
      return await newsService.searchNews(query, gameId)
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to manually refresh news for a game
 */
export function useRefreshGameNews() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameId, gameTitle }: { gameId: string; gameTitle: string }) => {
      // First invalidate existing cache
      await queryClient.invalidateQueries({ queryKey: ['news', gameId] })
      
      // Then scrape fresh news
      return await newsService.scrapeGameNews(gameId, gameTitle)
    },
    onSuccess: (jobStatus: NewsJobStatus, { gameId, gameTitle }) => {
      if (jobStatus.status === 'completed') {
        toast({
          title: 'News Refreshed',
          description: `Updated news for ${gameTitle}`,
        })
        
        // Refresh the cache with new data
        queryClient.invalidateQueries({ queryKey: ['news', gameId] })
        queryClient.invalidateQueries({ queryKey: ['news', 'recent'] })
      }
    },
    onError: (error: Error) => {
      console.error('News refresh error:', error)
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh news',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Custom hook to manage news service lifecycle
 */
export function useNewsManager() {
  return {
    /**
     * Dispose of the news service resources
     */
    dispose: async () => {
      await newsService.dispose()
    }
  }
}

/**
 * Hook to preload news data for better UX
 */
export function usePreloadNews() {
  const queryClient = useQueryClient()

  return {
    /**
     * Preload recent news
     */
    preloadRecentNews: () => {
      queryClient.prefetchQuery({
        queryKey: ['news', 'recent', 50],
        queryFn: async () => {
          return await newsService.getRecentNews(50)
        },
        staleTime: 2 * 60 * 1000,
      })
    },

    /**
     * Preload news for a specific game
     */
    preloadGameNews: (gameId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['news', gameId, 50],
        queryFn: async () => {
          return await newsService.getGameNews(gameId, 50)
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }
} 