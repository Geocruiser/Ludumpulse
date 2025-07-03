/**
 * use-game-suggestions Hook
 *
 * Provides client-side utilities for fetching and updating game suggestions that
 * are derived from the user's tracked games.
 *
 * 1. Attempts to retrieve pre-computed suggestions from Supabase via the helper
 *    utilities in `@/lib/database`.
 * 2. If no suggestions are stored yet, it dynamically generates them on the fly
 *    by analysing the genres of the user's tracked games and cross-referencing
 *    them with the IGDB "popular games" endpoint. This keeps the UX snappy even
 *    before a full back-end recommendation pipeline is implemented.
 *
 * The returned data structure is fully compatible with the `GameSuggestion`
 * interface defined in `@/types/database` so that the UI layer can treat both
 * server-side and locally-generated recommendations in a uniform way.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrackedGame } from '@/hooks/use-games'
import { GameSuggestion } from '@/types/database'
import {
  updateSuggestionStatus,
  addTrackedGame,
} from '@/lib/database'
import { generateRAGSuggestions } from '@/lib/suggestions/rag-service'
import { useTrackedGames } from '@/hooks/use-games'
import { useToast } from '@/hooks/use-toast'
import { dismissSuggestion } from '@/lib/suggestions/dismissed-suggestions-store'

/**
 * Hook: useGameSuggestions
 *
 * Returns dynamically generated game suggestions using RAG (Retrieval-Augmented Generation).
 * Analyzes user's tracked games and generates personalized AI recommendations.
 */
export function useGameSuggestions(limit = 10) {
  const { data: trackedGames } = useTrackedGames()

  return useQuery({
    queryKey: ['game-suggestions', limit, trackedGames?.length],
    enabled: true,
    queryFn: async (): Promise<GameSuggestion[]> => {
      // Generate dynamic RAG suggestions based on user's tracked games
      if (!trackedGames || !trackedGames.length) return []

      // Use RAG service to generate personalized suggestions
      return await generateRAGSuggestions(trackedGames, limit)
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes to avoid excessive API calls
  })
}

/**
 * Hook: useUpdateSuggestionStatus
 *
 * Provides mutation utilities to accept or dismiss a suggestion. Accepting will
 * automatically add the game to the user's tracked list with minimal metadata
 * so that it immediately appears everywhere else in the app.
 */
export function useUpdateSuggestionStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, status, title }: { id: string; status: 'ACCEPTED' | 'DISMISSED'; title: string }) => {
      // 1. Update status on the server if it's a persisted suggestion
      if (!id.startsWith('local-')) {
        await updateSuggestionStatus(id, status)
      }

      // 2. If accepted, immediately add the game to tracked list
      if (status === 'ACCEPTED') {
        await addTrackedGame({
          title,
          tags: [],
          releaseStatus: 'UNRELEASED',
        })
      }

      // 3. If dismissed, store it locally to prevent it from appearing again
      if (status === 'DISMISSED') {
        dismissSuggestion(title)
      }

      return { id, status }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game-suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['tracked-games'] })

      toast({
        title: variables.status === 'ACCEPTED' ? 'Game Added' : 'Suggestion Dismissed',
        description:
          variables.status === 'ACCEPTED'
            ? `${variables.title} has been added to your tracked games.`
            : 'You will no longer see this suggestion.',
      })
    },
    onError: (error) => {
      console.error('Failed to update suggestion status', error)
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive',
      })
    },
  })
} 