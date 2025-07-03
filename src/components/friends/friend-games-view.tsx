/**
 * Friend Games View Component
 * 
 * Displays a friend's tracked games with sharing capabilities.
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Share2, 
  Calendar, 
  Tag, 
  Star, 
  ExternalLink, 
  Gamepad2, 
  Clock,
  CheckCircle
} from 'lucide-react'
import { useFriendGames, useContentSharing, useFriends } from '@/hooks/use-friends'
import type { TrackedGame, Friend } from '@/types/database'

interface FriendGamesViewProps {
  friendId: string
  friendName?: string
  onClose?: () => void
}

interface GameCardProps {
  game: TrackedGame
  onShare?: (gameId: string, message?: string) => void
  disabled?: boolean
}

/**
 * Game card component for displaying friend's tracked games
 */
function GameCard({ game, onShare, disabled }: GameCardProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  const handleShare = () => {
    if (onShare) {
      onShare(game.id, shareMessage.trim() || undefined)
      setShareMessage('')
      setIsShareDialogOpen(false)
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function getStatusIcon() {
    switch (game.release_status) {
      case 'RELEASED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'UNRELEASED':
        return <Clock className="w-4 h-4 text-orange-500" />
      default:
        return <Gamepad2 className="w-4 h-4 text-primary" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start space-x-4">
          {game.cover_art_url && (
            <img 
              src={game.cover_art_url} 
              alt={game.title}
              className="w-16 h-20 object-cover rounded-md"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg truncate">{game.title}</h3>
              {getStatusIcon()}
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline">
                {game.release_status === 'RELEASED' ? 'Released' : 'Upcoming'}
              </Badge>
              {game.rating && (
                <Badge variant="secondary">
                  <Star className="w-3 h-3 mr-1" />
                  {game.rating}/100
                </Badge>
              )}
            </div>
            
            {game.release_date && (
              <p className="text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                {formatDate(game.release_date)}
              </p>
            )}
            
            {game.developer && (
              <p className="text-sm text-muted-foreground mb-1">
                Developer: {game.developer}
              </p>
            )}
            
            {game.publisher && (
              <p className="text-sm text-muted-foreground mb-1">
                Publisher: {game.publisher}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {game.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {game.description}
          </p>
        )}
        
        {game.genres && game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {game.genres.map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}
        
        {game.platforms && game.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {game.platforms.map((platform) => (
              <Badge key={platform} variant="secondary" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        )}
        
        {game.tags && game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {game.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex space-x-2">
          {game.igdb_id && (
            <Button variant="outline" size="sm" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on IGDB
            </Button>
          )}
          
          {onShare && (
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" disabled={disabled}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Game</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {game.cover_art_url && (
                      <img 
                        src={game.cover_art_url} 
                        alt={game.title}
                        className="w-16 h-20 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{game.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {game.release_status === 'RELEASED' ? 'Released' : 'Upcoming'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="share-message">Message (optional)</Label>
                    <Input
                      id="share-message"
                      placeholder="Why do you want to share this game?"
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsShareDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleShare}
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Game
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Friend games view component displaying all tracked games for a friend
 */
export function FriendGamesView({ friendId, friendName, onClose }: FriendGamesViewProps) {
  const { games, isLoading, error } = useFriendGames(friendId)
  const { shareGame, isSharing } = useContentSharing()
  const { friends } = useFriends()

  // Find the friend's information
  const friend = friends.find(f => f.friend_id === friendId)
  const displayName = friendName || friend?.friend?.display_name || friend?.friend?.username || friend?.friend?.email || 'Friend'

  const handleShareGame = async (gameId: string, message?: string) => {
    await shareGame(friendId, gameId, message)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Error loading games: {error}</p>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {friend?.friend && (
            <Avatar className="w-12 h-12">
              <AvatarImage src={friend.friend.avatar_url} alt={displayName} />
              <AvatarFallback>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h2 className="text-2xl font-bold">{displayName}'s Games</h2>
            <p className="text-muted-foreground">
              {games.length} tracked game{games.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Games Grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onShare={handleShareGame}
              disabled={isSharing}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No games tracked</h3>
          <p className="text-muted-foreground">
            {displayName} hasn't tracked any games yet.
          </p>
        </div>
      )}
    </div>
  )
} 