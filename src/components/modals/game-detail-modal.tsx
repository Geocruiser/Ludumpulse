/**
 * Game Detail Modal Component
 * 
 * This modal shows detailed information about a tracked game
 * and allows editing of game properties.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Edit, Save, X, Tag, Calendar, Info, Newspaper } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useGameStore } from '@/lib/stores/game-store'
import { useTrackedGame, useUpdateGame } from '@/hooks/use-games'
import { useScrapeGameNews } from '@/hooks/use-news'
import { format } from 'date-fns'

const gameSchema = z.object({
  title: z.string().min(1, 'Game title is required').max(100, 'Title must be less than 100 characters'),
  releaseStatus: z.enum(['RELEASED', 'UNRELEASED'], {
    required_error: 'Please select a release status',
  }),
  releaseDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type GameFormData = z.infer<typeof gameSchema>

/**
 * Modal for viewing and editing tracked game details
 */
export function GameDetailModal() {
  const { selectedGameId, isGameDetailModalOpen, closeGameDetail } = useGameStore()
  const { data: game, isLoading } = useTrackedGame(selectedGameId)
  const updateGame = useUpdateGame()
  const scrapeGameNews = useScrapeGameNews()
  
  const [isEditing, setIsEditing] = useState(false)
  const [currentTag, setCurrentTag] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    mode: 'onChange',
  })

  const releaseStatus = watch('releaseStatus')

  // Reset form when game data changes
  useEffect(() => {
    if (game) {
      reset({
        title: game.title,
        releaseStatus: game.release_status,
        releaseDate: game.release_date || '',
      })
      setTags(game.tags || [])
    }
  }, [game, reset])

  const onSubmit = async (data: GameFormData) => {
    if (!selectedGameId) return
    
    try {
      await updateGame.mutateAsync({
        id: selectedGameId,
        title: data.title,
        releaseStatus: data.releaseStatus,
        releaseDate: data.releaseDate || null,
        tags: tags,
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating game:', error)
    }
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
    setIsEditing(false)
    setCurrentTag('')
    closeGameDetail()
  }

  const handleCancelEdit = () => {
    if (game) {
      reset({
        title: game.title,
        releaseStatus: game.release_status,
        releaseDate: game.release_date || '',
      })
      setTags(game.tags || [])
    }
    setIsEditing(false)
    setCurrentTag('')
  }

  const handleScrapeNews = async () => {
    if (!game) return
    
    try {
      await scrapeGameNews.mutateAsync({
        gameTitle: game.title
      })
    } catch (error) {
      console.error('Error scraping news:', error)
    }
  }

  if (!isGameDetailModalOpen || !selectedGameId) {
    return null
  }

  return (
    <Dialog open={isGameDetailModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Game Details
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !game ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Game not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {isEditing ? (
              // Edit Form
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Game Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Game Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter game title..."
                    {...register('title')}
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Release Status */}
                <div className="space-y-2">
                  <Label htmlFor="releaseStatus">Release Status</Label>
                  <Select
                    value={releaseStatus}
                    onValueChange={(value) => setValue('releaseStatus', value as 'RELEASED' | 'UNRELEASED')}
                  >
                    <SelectTrigger className={errors.releaseStatus ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select release status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RELEASED">Released</SelectItem>
                      <SelectItem value="UNRELEASED">Unreleased</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.releaseStatus && (
                    <p className="text-sm text-destructive">{errors.releaseStatus.message}</p>
                  )}
                </div>

                {/* Release Date */}
                <div className="space-y-2">
                  <Label htmlFor="releaseDate">
                    Release Date 
                    {releaseStatus === 'UNRELEASED' && (
                      <span className="text-muted-foreground ml-1">(expected)</span>
                    )}
                  </Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    {...register('releaseDate')}
                    className={errors.releaseDate ? 'border-destructive' : ''}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!currentTag.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Tags Display */}
                  <AnimatePresence>
                    {tags.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mt-2"
                      >
                        {tags.map((tag) => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Edit Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateGame.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isValid || updateGame.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateGame.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // View Mode
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{game.title}</h2>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={game.release_status === 'RELEASED' ? 'default' : 'secondary'}
                    >
                      {game.release_status === 'RELEASED' ? 'Released' : 'Unreleased'}
                    </Badge>
                    {game.release_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(game.release_date), 'MMMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {game.tags && game.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* News Actions */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleScrapeNews}
                    disabled={scrapeGameNews.isPending}
                    className="w-full flex items-center gap-2"
                    variant="outline"
                  >
                    {scrapeGameNews.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Scraping News...
                      </>
                    ) : (
                      <>
                        <Newspaper className="h-4 w-4" />
                        Scrape Latest News
                      </>
                    )}
                  </Button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Added</h4>
                    <p className="text-sm">{format(new Date(game.created_at), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                    <p className="text-sm">{format(new Date(game.updated_at), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 