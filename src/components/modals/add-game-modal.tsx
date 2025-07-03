/**
 * Add Game Modal Component
 * 
 * This modal allows users to add new games to their tracked list using IGDB search.
 * Users can search for games, view cover art and details, and add them to their library.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Plus, Tag, Search, Calendar, User, Star, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { useGameStore } from '@/lib/stores/game-store'
import { useCreateGame } from '@/hooks/use-games'
import { useGameSearch, useIGDBStatus } from '@/hooks/use-igdb-search'
import { TrackedGame } from '@/types/database'

const gameSchema = z.object({
  title: z.string().min(1, 'Game title is required').max(100, 'Title must be less than 100 characters'),
  releaseStatus: z.enum(['RELEASED', 'UNRELEASED'], {
    required_error: 'Please select a release status',
  }),
  tags: z.array(z.string()).optional(),
  // IGDB fields
  igdbId: z.number().optional(),
  coverArtUrl: z.string().optional(),
  description: z.string().optional(),
  releaseDate: z.string().optional(),
  developer: z.string().optional(),
  publisher: z.string().optional(),
  genres: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  rating: z.number().optional(),
  screenshots: z.array(z.string()).optional(),
})

type GameFormData = z.infer<typeof gameSchema>

/**
 * Game search result card component
 */
function GameResultCard({ 
  game, 
  onSelect, 
  isSelected 
}: { 
  game: TrackedGame
  onSelect: (game: TrackedGame) => void
  isSelected: boolean 
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(game)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Cover Art */}
          <div className="flex-shrink-0">
            {game.cover_art_url ? (
              <img
                src={game.cover_art_url}
                alt={game.title}
                className="w-16 h-20 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-16 h-20 bg-muted rounded flex items-center justify-center ${game.cover_art_url ? 'hidden' : ''}`}>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          
          {/* Game Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2">{game.title}</h3>
            
            <div className="mt-2 space-y-1">
              {game.release_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(game.release_date).getFullYear()}
                </div>
              )}
              
              {game.developer && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {game.developer}
                </div>
              )}
              
              {game.rating && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  {game.rating}/100
                </div>
              )}
            </div>
            
            {game.genres.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {game.genres.slice(0, 3).map((genre: string) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
                {game.genres.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{game.genres.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Modal for adding new tracked games with IGDB search
 */
export function AddGameModal() {
  const { isAddGameModalOpen, closeAddGameModal } = useGameStore()
  const createGame = useCreateGame()
  const igdbStatus = useIGDBStatus()
  const { searchForGames, searchResults, isSearching, clearSearch, searchError } = useGameSearch()
  
  const [currentTag, setCurrentTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [selectedGame, setSelectedGame] = useState<TrackedGame | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [manualEntry, setManualEntry] = useState(false) // Default to automatic search mode

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    mode: 'onChange',
  })

  // Check if IGDB is configured
  const isConfigured = igdbStatus.data || false

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 1) {
        searchForGames(query)
      } else {
        clearSearch()
      }
    }, 500),
    [searchForGames, clearSearch]
  )

  // Handle search input changes
  useEffect(() => {
    if (!manualEntry && searchQuery.trim()) {
      debouncedSearch(searchQuery)
    } else {
      clearSearch()
    }
  }, [searchQuery, manualEntry, debouncedSearch, clearSearch])

  const onSubmit = async (data: GameFormData) => {
    try {
      const gameData = {
        title: data.title,
        releaseStatus: data.releaseStatus,
        tags: tags,
        // IGDB fields
        igdbId: selectedGame?.igdb_id,
        coverArtUrl: selectedGame?.cover_art_url,
        description: selectedGame?.description,
        releaseDate: selectedGame?.release_date,
        developer: selectedGame?.developer,
        publisher: selectedGame?.publisher,
        genres: selectedGame?.genres || [],
        platforms: selectedGame?.platforms || [],
        rating: selectedGame?.rating,
        screenshots: selectedGame?.screenshots || [],
      }

      await createGame.mutateAsync(gameData)
      handleClose()
    } catch (error) {
      console.error('Error creating game:', error)
    }
  }

  const handleGameSelect = (game: TrackedGame) => {
    setSelectedGame(game)
    setValue('title', game.title)
    setValue('releaseStatus', game.release_date && new Date(game.release_date) <= new Date() ? 'RELEASED' : 'UNRELEASED')
    
    // Auto-populate genres as tags if no tags are set
    if (tags.length === 0 && game.genres.length > 0) {
      setTags(game.genres.slice(0, 5)) // Limit to 5 genres
    }
    
    trigger(['title', 'releaseStatus'])
  }

  const handleAddTag = () => {
    const trimmedTag = currentTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleClose = () => {
    reset()
    setTags([])
    setCurrentTag('')
    setSelectedGame(null)
    setSearchQuery('')
    setManualEntry(false) // Always default to automatic search mode
    clearSearch()
    closeAddGameModal()
  }

  const toggleManualEntry = () => {
    setManualEntry(!manualEntry)
    setSelectedGame(null)
    setSearchQuery('')
    clearSearch()
    setValue('title', '')
  }

  return (
    <Dialog open={isAddGameModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Game
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Search Mode Toggle */}
          {isConfigured && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={!manualEntry ? "default" : "outline"}
                  size="sm"
                  onClick={() => !manualEntry || toggleManualEntry()}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search Games
                </Button>
                <Button
                  type="button"
                  variant={manualEntry ? "default" : "outline"}
                  size="sm"
                  onClick={() => manualEntry || toggleManualEntry()}
                >
                  Manual Entry
                </Button>
              </div>
            </div>
          )}

          {/* Game Search */}
          {!manualEntry ? (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search">Search for Games</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                
                {/* Debug Info */}
                <div className="text-xs text-muted-foreground">
                  Query: "{searchQuery}" | Results: {searchResults.length} | Searching: {isSearching ? 'Yes' : 'No'}
                  {searchError && <div className="text-destructive mt-1">Error: {searchError}</div>}
                </div>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 max-h-60 overflow-y-auto"
                  >
                    {searchResults.map((game) => (
                      <GameResultCard
                        key={game.igdb_id}
                        game={game}
                        onSelect={handleGameSelect}
                        isSelected={selectedGame?.igdb_id === game.igdb_id}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No Results Message */}
              {searchQuery.length >= 1 && !isSearching && searchResults.length === 0 && !searchError && (
                <div className="text-center text-muted-foreground py-4">
                  No games found for "{searchQuery}"
                </div>
              )}

              {/* Selected Game Display */}
              {selectedGame && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    {selectedGame.cover_art_url && (
                      <img
                        src={selectedGame.cover_art_url}
                        alt={selectedGame.title}
                        className="w-24 h-32 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedGame.title}</h3>
                      {selectedGame.release_date && (
                        <p className="text-sm text-muted-foreground">
                          Released: {new Date(selectedGame.release_date).getFullYear()}
                        </p>
                      )}
                      {selectedGame.developer && (
                        <p className="text-sm text-muted-foreground">
                          Developer: {selectedGame.developer}
                        </p>
                      )}
                      {selectedGame.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedGame.description.substring(0, 200)}...
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            /* Manual Entry Form */
            <div className="space-y-4">
              {/* Game Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Game Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter game title"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-destructive text-sm">{errors.title.message}</p>
                )}
              </div>

              {/* Release Status */}
              <div className="space-y-2">
                <Label htmlFor="releaseStatus">Release Status *</Label>
                <Select onValueChange={(value) => setValue('releaseStatus', value as 'RELEASED' | 'UNRELEASED')}>
                  <SelectTrigger id="releaseStatus">
                    <SelectValue placeholder="Select release status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RELEASED">Released</SelectItem>
                    <SelectItem value="UNRELEASED">Unreleased</SelectItem>
                  </SelectContent>
                </Select>
                {errors.releaseStatus && (
                  <p className="text-destructive text-sm">{errors.releaseStatus.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Display Current Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTag(tag)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createGame.isPending}
              className="min-w-[100px]"
            >
              {createGame.isPending ? <LoadingSpinner size="sm" /> : 'Add Game'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
} 