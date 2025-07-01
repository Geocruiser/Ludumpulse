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
  searchNews
} from '@/lib/news/news-service'
import { NewsJobStatus } from '@/types/news'
import { useToast } from './use-toast'

/**
 * Hook to scrape news for a specific game
 */
export function useScrapeGameNews() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameTitle }: { gameTitle: string }) => {
      return await scrapeGameNews(gameTitle)
    },
    onSuccess: (result, { gameTitle }) => {
      const totalArticles = result.articles?.length || 0
      
      if (result.success && totalArticles > 0) {
        toast({
          title: 'News Scraping Complete',
          description: `Found ${totalArticles} articles for ${gameTitle}`,
        })
        
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['news', 'recent'] })
        queryClient.invalidateQueries({ queryKey: ['news', 'search'] })
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
 * Hook to fetch news for a specific game
 */
export function useGameNews(gameTitle: string, limit = 20) {
  return useQuery({
    queryKey: ['news', 'game', gameTitle, limit],
    queryFn: async () => {
      const result = await scrapeGameNews(gameTitle)
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
 * Hook to search news items
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
      return await scrapeGameNews(gameTitle)
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
          const result = await scrapeGameNews(gameTitle)
          return result.success ? result.articles.slice(0, 20) : []
        },
        staleTime: 5 * 60 * 1000,
      })
    },
  }
} 