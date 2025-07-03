/**
 * Share News Dialog Component
 * 
 * A dialog for sharing a news article with friends.
 */

'use client'

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFriends, useContentSharing } from '@/hooks/use-friends'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ScrapedArticle } from '@/types/news'
import type { Friend } from '@/types/database'
import { Check, Share2 } from 'lucide-react'

interface ShareNewsDialogProps {
  newsItem: ScrapedArticle
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

/**
 * Dialog to share a news article with friends.
 */
export function ShareNewsDialog({ newsItem, isOpen, onOpenChange }: ShareNewsDialogProps) {
  const { friends, isLoading: isLoadingFriends } = useFriends()
  const { shareNews, isSharing } = useContentSharing()
  const { toast } = useToast()

  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const handleShare = async () => {
    if (selectedFriends.length === 0) {
      toast({
        title: 'No friends selected',
        description: 'Please select at least one friend to share with.',
        variant: 'destructive',
      })
      return
    }

    if (!newsItem.id) {
      toast({
        title: 'Cannot share this item',
        description: 'This news article has not been saved to the database yet.',
        variant: 'destructive',
      })
      return
    }

    await Promise.all(
      selectedFriends.map(friendId => 
        shareNews(friendId, newsItem.id!, message)
      )
    )
    
    toast({
      title: 'Content Shared!',
      description: `Successfully shared with ${selectedFriends.length} friend(s).`,
    })
    
    setSelectedFriends([])
    setMessage('')
    onOpenChange(false)
  }

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const filteredFriends = friends.filter(friend => {
    const friendName = friend.friend?.display_name || friend.friend?.username || ''
    return friendName.toLowerCase().includes(searchTerm.toLowerCase())
  })
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share News Article</DialogTitle>
          <DialogDescription>
            Share "{newsItem.title}" with your friends.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="search-friends">Search Friends</Label>
            <Input
              id="search-friends"
              placeholder="Filter friends..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {isLoadingFriends ? (
              <LoadingSpinner />
            ) : (
              filteredFriends.map(friend => (
                <FriendSelectItem
                  key={friend.id}
                  friend={friend}
                  isSelected={selectedFriends.includes(friend.friend_id)}
                  onSelect={toggleFriendSelection}
                />
              ))
            )}
          </div>
          <div>
            <Label htmlFor="share-message">Optional Message</Label>
            <Input
              id="share-message"
              placeholder="Add a message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleShare}
            disabled={isSharing || selectedFriends.length === 0}
          >
            {isSharing ? <LoadingSpinner size="sm" /> : <Share2 className="w-4 h-4 mr-2" />}
            Share with {selectedFriends.length} friend(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FriendSelectItem({
  friend,
  isSelected,
  onSelect,
}: {
  friend: Friend
  isSelected: boolean
  onSelect: (friendId: string) => void
}) {
  const friendUser = friend.friend;
  if (!friendUser) return null;

  const displayName = friendUser.display_name || friendUser.username || "Unknown User";

  return (
    <div
      onClick={() => onSelect(friend.friend_id)}
      className="flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-muted"
    >
      <Avatar className="w-8 h-8">
        <AvatarImage src={friendUser.avatar_url} />
        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="flex-1">{displayName}</span>
      {isSelected && <Check className="w-5 h-5 text-primary" />}
    </div>
  )
} 