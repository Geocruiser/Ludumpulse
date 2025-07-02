/**
 * Game Summaries Hook
 * 
 * Provides React Query hooks for fetching and generating AI summaries
 * of game news for tracked games.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scrapeGameNews } from '@/lib/news/news-service'
import { generateBatchGameSummaries, GameNewsSummary } from '@/lib/news/ai-summary-service'
import { useToast } from './use-toast'
import { TrackedGame } from './use-games'

/**
 * Hook to fetch AI summaries for all tracked games
 */
export function useGameSummaries(games: TrackedGame[] = []) {
  return useQuery({
    queryKey: ['game-summaries', games.map(g => g.id).sort()],
    queryFn: async () => {
      if (!games.length) return []
      
      // Fetch news for each game
      const newsPromises = games.map(async game => {
        const newsResult = await scrapeGameNews(game.title)
        return {
          gameTitle: game.title,
          articles: newsResult.success ? newsResult.articles : []
        }
      })
      
      const newsResults = await Promise.all(newsPromises)
      
      // Create a map of game titles to articles
      const newsData = new Map(
        newsResults.map(result => [result.gameTitle, result.articles])
      )
      
      // Generate summaries
      return await generateBatchGameSummaries(
        games.map(g => ({ id: g.id, title: g.title })),
        newsData
      )
    },
    enabled: games.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1, // Reduce retries for AI summaries
  })
}

/**
 * Hook to refresh game summaries manually
 */
export function useRefreshGameSummaries() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (games: TrackedGame[]) => {
      // Invalidate existing cache first
      await queryClient.invalidateQueries({ 
        queryKey: ['game-summaries'] 
      })
      
      // Fetch fresh news for each game
      const newsPromises = games.map(async game => {
        const newsResult = await scrapeGameNews(game.title)
        return {
          gameTitle: game.title,
          articles: newsResult.success ? newsResult.articles : []
        }
      })
      
      const newsResults = await Promise.all(newsPromises)
      
      // Create a map of game titles to articles
      const newsData = new Map(
        newsResults.map(result => [result.gameTitle, result.articles])
      )
      
      // Generate fresh summaries
      return await generateBatchGameSummaries(
        games.map(g => ({ id: g.id, title: g.title })),
        newsData
      )
    },
    onSuccess: (summaries) => {
      const gamesWithNews = summaries.filter(s => s.articlesCount > 0).length
      
      toast({
        title: 'Summaries Refreshed',
        description: `Updated AI summaries for ${summaries.length} games. ${gamesWithNews} games have recent news.`,
      })
      
      // Refresh the cache
      queryClient.invalidateQueries({ 
        queryKey: ['game-summaries'] 
      })
    },
    onError: (error: Error) => {
      console.error('Summary refresh error:', error)
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh summaries: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to get summary for a specific game
 */
export function useGameSummary(gameTitle: string) {
  return useQuery({
    queryKey: ['game-summary', gameTitle],
    queryFn: async () => {
      const newsResult = await scrapeGameNews(gameTitle)
      if (!newsResult.success) {
        throw new Error(newsResult.error || 'Failed to fetch news')
      }
      
      // Import the function directly to avoid circular dependencies
      const { generateGameNewsSummary } = await import('@/lib/news/ai-summary-service')
      return await generateGameNewsSummary(gameTitle, newsResult.articles)
    },
    enabled: !!gameTitle,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to preload summaries for better UX
 */
export function usePreloadGameSummaries() {
  const queryClient = useQueryClient()
  
  return {
    /**
     * Preload summaries for a list of games
     */
    preloadSummaries: (games: TrackedGame[]) => {
      if (!games.length) return
      
      queryClient.prefetchQuery({
        queryKey: ['game-summaries', games.map(g => g.id).sort()],
        queryFn: async () => {
          // Fetch news for each game
          const newsPromises = games.map(async game => {
            const newsResult = await scrapeGameNews(game.title)
            return {
              gameTitle: game.title,
              articles: newsResult.success ? newsResult.articles : []
            }
          })
          
          const newsResults = await Promise.all(newsPromises)
          
          // Create a map of game titles to articles
          const newsData = new Map(
            newsResults.map(result => [result.gameTitle, result.articles])
          )
          
          // Generate summaries
          return await generateBatchGameSummaries(
            games.map(g => ({ id: g.id, title: g.title })),
            newsData
          )
        },
        staleTime: 10 * 60 * 1000,
      })
    },
  }
} 