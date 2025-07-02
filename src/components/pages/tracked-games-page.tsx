/**
 * Tracked Games Page Component
 * 
 * This component displays the main tracked games page with filtering,
 * sorting, and CRUD operations for tracked games.
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, MoreHorizontal, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useGameStore } from '@/lib/stores/game-store'
import { useTrackedGames, useDeleteGame } from '@/hooks/use-games'

/**
 * Main tracked games page with list, filtering, and management
 */
export function TrackedGamesPage() {
  const {
    filters,
    sortConfig,
    setFilters,
    setSortConfig,
    openAddGameModal,
    openGameDetail,
  } = useGameStore()
  
  const { data: games, isLoading, error } = useTrackedGames(filters, sortConfig)
  const deleteGame = useDeleteGame()

  const handleSearchChange = (value: string) => {
    setFilters({ search: value })
  }

  const handleReleaseStatusChange = (value: string) => {
    setFilters({ 
      releaseStatus: value as 'ALL' | 'RELEASED' | 'UNRELEASED' 
    })
  }

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('-')
    setSortConfig({
      field: field as 'title' | 'createdAt',
      direction: direction as 'asc' | 'desc'
    })
  }

  const handleDeleteGame = (gameId: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your tracked games?`)) {
      deleteGame.mutate(gameId)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load tracked games</p>
          <p className="text-muted-foreground text-sm">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracked Games</h1>
          <p className="text-muted-foreground">
            {games?.length ? `${games.length} games tracked` : 'No games tracked yet'}
          </p>
        </div>
        <Button onClick={openAddGameModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Game
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Release Status Filter */}
            <Select 
              value={filters.releaseStatus} 
              onValueChange={handleReleaseStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Release Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Games</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
                <SelectItem value="UNRELEASED">Unreleased</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select 
              value={`${sortConfig.field}-${sortConfig.direction}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Recently Added</SelectItem>
                <SelectItem value="createdAt-asc">Oldest Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Games List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : !games?.length ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No games found</p>
              <p className="text-sm">
                {filters.search || filters.releaseStatus !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Add your first game to get started tracking news and updates.'
                }
              </p>
            </div>
            {!filters.search && filters.releaseStatus === 'ALL' && (
              <Button onClick={openAddGameModal} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Game
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle 
                        className="text-lg truncate cursor-pointer hover:text-primary"
                        onClick={() => openGameDetail(game.id)}
                      >
                        {game.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={game.release_status === 'RELEASED' ? 'default' : 'secondary'}
                        >
                          {game.release_status === 'RELEASED' ? 'Released' : 'Unreleased'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openGameDetail(game.id)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteGame(game.id, game.title)}
                          className="text-destructive"
                        >
                          Remove Game
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                {game.tags.length > 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {game.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {game.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{game.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
} 