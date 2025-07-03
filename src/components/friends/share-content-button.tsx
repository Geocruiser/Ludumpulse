/**
 * Share Content Button Component
 * 
 * Button with dialog for sharing content with friends.
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Share2, 
  Users, 
  Check, 
  Newspaper, 
  Gamepad2, 
  ExternalLink 
} from 'lucide-react'
import { useFriends, useContentSharing } from '@/hooks/use-friends'
import type { Friend } from '@/types/database'

interface ShareContentButtonProps {
  contentId: string
  contentType: 'news' | 'game' | 'article'
  contentTitle?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'lg'
  className?: string
}

interface FriendSelectionProps {
  friend: Friend
  onSelect: (friendId: string) => void
  isSelected: boolean
  disabled?: boolean
}

/**
 * Friend selection item for sharing dialog
 */
function FriendSelectionItem({ friend, onSelect, isSelected, disabled }: FriendSelectionProps) {
  const friendUser = friend.friend
  
  if (!friendUser) {
    return null
  }

  const displayName = friendUser.display_name || friendUser.username || friendUser.email
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div 
      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onSelect(friend.friend_id)}
    >
      <Avatar className="w-8 h-8">
        <AvatarImage src={friendUser.avatar_url} alt={displayName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayName}</p>
        {friendUser.username && (
          <p className="text-xs text-muted-foreground truncate">
            @{friendUser.username}
          </p>
        )}
      </div>
      
      {isSelected && (
        <Check className="w-4 h-4 text-primary" />
      )}
    </div>
  )
}

/**
 * Share content button component with friend selection dialog
 */
export function ShareContentButton({ 
  contentId, 
  contentType, 
  contentTitle,
  variant = 'outline',
  size = 'sm',
  className = ''
}: ShareContentButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [shareMessage, setShareMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  
  const { friends, isLoading: friendsLoading } = useFriends()
  const { shareNews, shareGame } = useContentSharing()

  const handleFriendSelect = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleShare = async () => {
    if (selectedFriends.length === 0) return
    
    setIsSharing(true)
    
    try {
      const sharePromises = selectedFriends.map(friendId => {
        switch (contentType) {
          case 'news':
            return shareNews(friendId, contentId, shareMessage.trim() || undefined)
          case 'game':
            return shareGame(friendId, contentId, shareMessage.trim() || undefined)
          case 'article':
            return shareNews(friendId, contentId, shareMessage.trim() || undefined)
          default:
            return Promise.resolve()
        }
      })
      
      await Promise.all(sharePromises)
      
      // Reset form and close dialog
      setSelectedFriends([])
      setShareMessage('')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error sharing content:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const getContentIcon = () => {
    switch (contentType) {
      case 'news':
        return <Newspaper className="w-4 h-4" />
      case 'game':
        return <Gamepad2 className="w-4 h-4" />
      case 'article':
        return <ExternalLink className="w-4 h-4" />
      default:
        return <Share2 className="w-4 h-4" />
    }
  }

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'news':
        return 'News Article'
      case 'game':
        return 'Game'
      case 'article':
        return 'Article'
      default:
        return 'Content'
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share {getContentTypeLabel()}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Content Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {getContentIcon()}
              <span className="text-sm font-medium">
                {getContentTypeLabel()}
              </span>
            </div>
            {contentTitle && (
              <p className="text-sm truncate">{contentTitle}</p>
            )}
          </div>
          
          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="share-message">Message (optional)</Label>
            <Input
              id="share-message"
              placeholder="Add a message to share with your friends..."
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              maxLength={200}
            />
          </div>
          
          {/* Friends Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Share with friends</Label>
              <Badge variant="outline">
                {selectedFriends.length} selected
              </Badge>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {friendsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <FriendSelectionItem
                    key={friend.id}
                    friend={friend}
                    onSelect={handleFriendSelect}
                    isSelected={selectedFriends.includes(friend.friend_id)}
                    disabled={isSharing}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No friends to share with</p>
                  <p className="text-xs">Add some friends first</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSharing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              disabled={selectedFriends.length === 0 || isSharing}
              className="flex-1"
            >
              {isSharing ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              Share with {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 