/**
 * Add Game Modal Component
 * 
 * This modal allows users to add new games to their tracked list.
 * It includes form validation and submission handling.
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Plus, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useGameStore } from '@/lib/stores/game-store'
import { useCreateGame } from '@/hooks/use-games'

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
 * Modal for adding new tracked games
 */
export function AddGameModal() {
  const { isAddGameModalOpen, closeAddGameModal } = useGameStore()
  const createGame = useCreateGame()
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

  const onSubmit = async (data: GameFormData) => {
    try {
      await createGame.mutateAsync({
        title: data.title,
        releaseStatus: data.releaseStatus,
        releaseDate: data.releaseDate || null,
        tags: tags,
      })
      
      // Reset form and close modal
      reset()
      setTags([])
      setCurrentTag('')
      closeAddGameModal()
    } catch (error) {
      console.error('Error creating game:', error)
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
    reset()
    setTags([])
    setCurrentTag('')
    closeAddGameModal()
  }

  return (
    <Dialog open={isAddGameModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Game
          </DialogTitle>
        </DialogHeader>

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

          {/* Release Date (optional) */}
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
            {errors.releaseDate && (
              <p className="text-sm text-destructive">{errors.releaseDate.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags (optional)
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
            
            {/* Display Tags */}
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createGame.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createGame.isPending}
              className="flex items-center gap-2"
            >
              {createGame.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Game
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 