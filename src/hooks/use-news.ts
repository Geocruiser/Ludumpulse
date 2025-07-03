/**
 * News Hooks - React Query hooks for news management
 * 
 * Provides hooks for scraping news, fetching news items,
 * and managing news-related operations with proper caching.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  scrapeGameNews, 
  fetchGeneralGamingNews, 
  searchNews,
  fetchTrackedGamesNews,
  scrapeNewsForAllGames
} from '@/lib/news/news-service'
import { cleanupOldNews } from '@/lib/database'
import { useToast } from './use-toast'

/**
 * Hook to scrape news for a specific game and save to database
 */
export function useScrapeGameNews() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameTitle }: { gameTitle: string }) => {
      return await scrapeGameNews(gameTitle, true) // Save to database
    },
    onSuccess: (result, { gameTitle }) => {
      const totalArticles = result.articles?.length || 0
      
      if (result.success && totalArticles > 0) {
        toast({
          title: 'News Scraping Complete',
          description: `Found and saved ${totalArticles} articles for ${gameTitle}`,
        })
        
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['news', 'recent'] })
        queryClient.invalidateQueries({ queryKey: ['news', 'search'] })
        queryClient.invalidateQueries({ queryKey: ['news', 'tracked-games'] })
      } else {
        toast({
          title: 'No News Found',
          description: result.error || `No news articles found for ${gameTitle}`,
          variant: 'destructive',
        })
      }
    },
    onError: (error: Error) => {
      console.error('News scraping error:', error)
      toast({
        title: 'Error',
        description: 'Failed to scrape news: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to scrape fresh news for all tracked games
 */
export function useScrapeAllGamesNews() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gameList: Array<{ id: string, title: string }>) => {
      return await scrapeNewsForAllGames(gameList)
    },
    onSuccess: (result) => {
      const totalArticles = result.articles?.length || 0
      
      if (result.success && totalArticles > 0) {
        toast({
          title: 'News Update Complete',
          description: `Found and saved ${totalArticles} articles across all tracked games`,
        })
        
        // Invalidate all news queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['news'] })
      } else {
        toast({
          title: 'No New Articles',
          description: result.error || 'No new articles found for your tracked games',
        })
      }
    },
    onError: (error: Error) => {
      console.error('Bulk news scraping error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update game news: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to fetch news for a specific game (from database)
 */
export function useGameNews(gameTitle: string, limit = 20) {
  return useQuery({
    queryKey: ['news', 'game', gameTitle, limit],
    queryFn: async () => {
      const result = await scrapeGameNews(gameTitle, false) // Don't save, just fetch
      return result.success ? result.articles.slice(0, limit) : []
    },
    enabled: !!gameTitle,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to fetch recent gaming news
 */
export function useRecentNews(limit = 50) {
  return useQuery({
    queryKey: ['news', 'recent', limit],
    queryFn: async () => {
      const result = await fetchGeneralGamingNews()
      return result.success ? result.articles.slice(0, limit) : []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to search news items (from database)
 */
export function useSearchNews(query: string) {
  return useQuery({
    queryKey: ['news', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return []
      const result = await searchNews(query)
      return result.success ? result.articles : []
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to fetch news for tracked games (from database)
 */
export function useTrackedGamesNews(gameList: Array<{ id: string, title: string }> = []) {
  return useQuery({
    queryKey: ['news', 'tracked-games', gameList.map(g => g.id).sort()],
    queryFn: async () => {
      if (!gameList.length) return []
      const result = await fetchTrackedGamesNews(gameList)
      return result.success ? result.articles : []
    },
    enabled: gameList.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
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
    mutationFn: async ({ gameTitle }: { gameTitle: string }) => {
      // First invalidate existing cache
      await queryClient.invalidateQueries({ queryKey: ['news', 'game', gameTitle] })
      
      // Then scrape fresh news
      return await scrapeGameNews(gameTitle, true) // Save to database
    },
    onSuccess: (result, { gameTitle }) => {
      const totalArticles = result.articles?.length || 0
      
      if (result.success && totalArticles > 0) {
        toast({
          title: 'News Refreshed',
          description: `Found ${totalArticles} new articles for ${gameTitle}`,
        })
        
        // Refresh the cache with new data
        queryClient.invalidateQueries({ queryKey: ['news', 'game', gameTitle] })
        queryClient.invalidateQueries({ queryKey: ['news', 'recent'] })
        queryClient.invalidateQueries({ queryKey: ['news', 'tracked-games'] })
      }
    },
    onError: (error: Error) => {
      console.error('News refresh error:', error)
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh news: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to manually clean up old news articles
 */
export function useCleanupOldNews() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (olderThanDays: number = 4) => {
      return await cleanupOldNews(olderThanDays)
    },
    onSuccess: (result, olderThanDays) => {
      const deletedCount = result.data?.deletedCount || 0
      if (deletedCount > 0) {
        toast({
          title: 'Database Cleaned',
          description: `Removed ${deletedCount} articles older than ${olderThanDays} days`,
        })
        
        // Refresh news queries since articles were deleted
        queryClient.invalidateQueries({ queryKey: ['news'] })
      } else {
        toast({
          title: 'Database Clean',
          description: `No articles older than ${olderThanDays} days found`,
        })
      }
    },
    onError: (error: Error) => {
      console.error('News cleanup error:', error)
      toast({
        title: 'Cleanup Failed',
        description: 'Failed to clean up old articles: ' + error.message,
        variant: 'destructive',
      })
    },
  })
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
          const result = await fetchGeneralGamingNews()
          return result.success ? result.articles.slice(0, 50) : []
        },
        staleTime: 2 * 60 * 1000,
      })
    },

    /**
     * Preload news for a specific game
     */
    preloadGameNews: (gameTitle: string) => {
      queryClient.prefetchQuery({
        queryKey: ['news', 'game', gameTitle, 20],
        queryFn: async () => {
          const result = await scrapeGameNews(gameTitle, false)
          return result.success ? result.articles.slice(0, 20) : []
        },
        staleTime: 5 * 60 * 1000,
      })
    },

    /**
     * Preload tracked games news
     */
    preloadTrackedGamesNews: (gameList: Array<{ id: string, title: string }>) => {
      queryClient.prefetchQuery({
        queryKey: ['news', 'tracked-games', gameList.map(g => g.id).sort()],
        queryFn: async () => {
          if (!gameList.length) return []
          const result = await fetchTrackedGamesNews(gameList)
          return result.success ? result.articles : []
        },
        staleTime: 3 * 60 * 1000,
      })
    }
  }
} 