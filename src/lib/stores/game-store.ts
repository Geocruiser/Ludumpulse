/**
 * Game Store - Zustand store for game-related client state
 * 
 * This store manages client-side state for game operations including:
 * - Search and filtering
 * - UI state (modals, selected games)
 * - Sorting preferences
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface GameFilters {
  search: string
  releaseStatus: 'ALL' | 'RELEASED' | 'UNRELEASED'
  tags: string[]
}

export interface GameSortConfig {
  field: 'title' | 'createdAt'
  direction: 'asc' | 'desc'
}

interface GameStore {
  // Filters and search
  filters: GameFilters
  sortConfig: GameSortConfig
  
  // UI state
  isAddGameModalOpen: boolean
  selectedGameId: string | null
  isGameDetailModalOpen: boolean
  
  // Actions
  setFilters: (filters: Partial<GameFilters>) => void
  setSortConfig: (config: GameSortConfig) => void
  clearFilters: () => void
  
  // Modal actions
  openAddGameModal: () => void
  closeAddGameModal: () => void
  openGameDetail: (gameId: string) => void
  closeGameDetail: () => void
}

const initialFilters: GameFilters = {
  search: '',
  releaseStatus: 'ALL',
  tags: []
}

const initialSortConfig: GameSortConfig = {
  field: 'createdAt',
  direction: 'desc'
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set) => ({
      // Initial state
      filters: initialFilters,
      sortConfig: initialSortConfig,
      isAddGameModalOpen: false,
      selectedGameId: null,
      isGameDetailModalOpen: false,
      
      // Filter actions
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
        
      setSortConfig: (config) =>
        set({ sortConfig: config }),
        
      clearFilters: () =>
        set({ filters: initialFilters }),
      
      // Modal actions
      openAddGameModal: () =>
        set({ isAddGameModalOpen: true }),
        
      closeAddGameModal: () =>
        set({ isAddGameModalOpen: false }),
        
      openGameDetail: (gameId) =>
        set({ 
          selectedGameId: gameId,
          isGameDetailModalOpen: true
        }),
        
      closeGameDetail: () =>
        set({ 
          selectedGameId: null,
          isGameDetailModalOpen: false
        }),
    }),
    {
      name: 'game-store',
    }
  )
) 