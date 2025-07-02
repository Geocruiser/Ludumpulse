/**
 * Game Hooks - Custom hooks for game operations using TanStack Query
 * 
 * These hooks provide server state management for game-related operations
 * including fetching, creating, updating, and deleting tracked games.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/hooks/use-toast'
import { GameFilters, GameSortConfig } from '@/lib/stores/game-store'

export interface TrackedGame {
  id: string
  user_id: string
  title: string
  tags: string[]
  release_status: 'RELEASED' | 'UNRELEASED'
  created_at: string
  updated_at: string
}

export interface CreateGameData {
  title: string
  tags: string[]
  releaseStatus: 'RELEASED' | 'UNRELEASED'
}

export interface UpdateGameData extends Partial<CreateGameData> {
  id: string
}

/**
 * Hook to fetch all tracked games for the current user
 */
export function useTrackedGames(filters?: GameFilters, sort?: GameSortConfig) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['tracked-games', user?.id, filters, sort],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      
      let query = supabase
        .from('tracked_games')
        .select('*')
        .eq('user_id', user.id)
      
      // Apply filters
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }
      
      if (filters?.releaseStatus && filters.releaseStatus !== 'ALL') {
        query = query.eq('release_status', filters.releaseStatus)
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      
      // Apply sorting
      if (sort) {
        const ascending = sort.direction === 'asc'
        // Map frontend field names to database column names
        const columnMapping = {
          'title': 'title',
          'createdAt': 'created_at'
        }
        const dbColumn = columnMapping[sort.field] || sort.field
        query = query.order(dbColumn, { ascending })
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as TrackedGame[]
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch a single tracked game by ID
 */
export function useTrackedGame(gameId: string | null) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['tracked-game', gameId],
    queryFn: async () => {
      if (!user?.id || !gameId) throw new Error('Missing required parameters')
      
      const { data, error } = await supabase
        .from('tracked_games')
        .select('*')
        .eq('id', gameId)
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data as TrackedGame
    },
    enabled: !!user?.id && !!gameId,
  })
}

/**
 * Hook to create a new tracked game
 */
export function useCreateGame() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (gameData: CreateGameData) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('tracked_games')
        .insert({
          user_id: user.id,
          title: gameData.title,
          tags: gameData.tags,
          release_status: gameData.releaseStatus,
        })
        .select()
        .single()
      
      if (error) throw error
      return data as TrackedGame
    },
    onSuccess: (newGame) => {
      // Invalidate and refetch games list
      queryClient.invalidateQueries({ queryKey: ['tracked-games'] })
      
      toast({
        title: 'Game Added',
        description: `${newGame.title} has been added to your tracked games.`,
      })
    },
    onError: (error) => {
      console.error('Error creating game:', error)
      toast({
        title: 'Error',
        description: 'Failed to add game. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to update a tracked game
 */
export function useUpdateGame() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (gameData: UpdateGameData) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('tracked_games')
        .update({
          title: gameData.title,
          tags: gameData.tags,
          release_status: gameData.releaseStatus,
        })
        .eq('id', gameData.id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data as TrackedGame
    },
    onSuccess: (updatedGame) => {
      // Invalidate and refetch games list and individual game
      queryClient.invalidateQueries({ queryKey: ['tracked-games'] })
      queryClient.invalidateQueries({ queryKey: ['tracked-game', updatedGame.id] })
      
      toast({
        title: 'Game Updated',
        description: `${updatedGame.title} has been updated.`,
      })
    },
    onError: (error) => {
      console.error('Error updating game:', error)
      toast({
        title: 'Error',
        description: 'Failed to update game. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to delete a tracked game
 */
export function useDeleteGame() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const { error } = await supabase
        .from('tracked_games')
        .delete()
        .eq('id', gameId)
        .eq('user_id', user.id)
      
      if (error) throw error
      return gameId
    },
    onSuccess: (deletedGameId) => {
      // Invalidate and refetch games list
      queryClient.invalidateQueries({ queryKey: ['tracked-games'] })
      queryClient.removeQueries({ queryKey: ['tracked-game', deletedGameId] })
      
      toast({
        title: 'Game Removed',
        description: 'The game has been removed from your tracked games.',
      })
    },
    onError: (error) => {
      console.error('Error deleting game:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove game. Please try again.',
        variant: 'destructive',
      })
    },
  })
} 