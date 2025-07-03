/**
 * Shared Content Card Component
 * 
 * Displays content shared by friends with actions to view and mark as read.
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ExternalLink, 
  Eye, 
  MessageCircle, 
  Gamepad2, 
  Newspaper,
  CheckCircle 
} from 'lucide-react'
import type { SharedContent } from '@/types/database'

interface SharedContentCardProps {
  sharedContent: SharedContent
  onMarkAsRead?: (sharedContentId: string) => void
  onViewContent?: (contentId: string, contentType: string) => void
}

/**
 * Shared content card component displaying content shared by friends
 */
export function SharedContentCard({ 
  sharedContent, 
  onMarkAsRead, 
  onViewContent 
}: SharedContentCardProps) {
  const sender = sharedContent.sender
  
  if (!sender) {
    return null
  }

  const displayName = sender.display_name || sender.username || sender.email
  const initials = getInitials(displayName)
  
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  function getContentIcon() {
    switch (sharedContent.type) {
      case 'NEWS_ITEM':
        return <Newspaper className="w-4 h-4" />
      case 'GAME_SUGGESTION':
        return <Gamepad2 className="w-4 h-4" />
      case 'ARTICLE':
        return <ExternalLink className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  function getContentTypeLabel() {
    switch (sharedContent.type) {
      case 'NEWS_ITEM':
        return 'News Article'
      case 'GAME_SUGGESTION':
        return 'Game Recommendation'
      case 'ARTICLE':
        return 'Article'
      default:
        return 'Content'
    }
  }

  function getContentTitle() {
    // In a real implementation, you would fetch the actual content details
    // For now, we'll show generic content based on type
    switch (sharedContent.type) {
      case 'NEWS_ITEM':
        return sharedContent.news_item?.title || 'News Article'
      case 'GAME_SUGGESTION':
        return sharedContent.tracked_game?.title || 'Game Recommendation'
      case 'ARTICLE':
        return 'Shared Article'
      default:
        return 'Shared Content'
    }
  }

  function getContentDescription() {
    switch (sharedContent.type) {
      case 'NEWS_ITEM':
        return sharedContent.news_item?.summary || 'A news article about your tracked games'
      case 'GAME_SUGGESTION':
        return sharedContent.tracked_game?.description || 'A game recommendation from your friend'
      case 'ARTICLE':
        return 'An article shared by your friend'
      default:
        return 'Content shared by your friend'
    }
  }

  function handleMarkAsRead() {
    if (onMarkAsRead && !sharedContent.read) {
      onMarkAsRead(sharedContent.id)
    }
  }

  function handleViewContent() {
    if (onViewContent) {
      onViewContent(sharedContent.content_id, sharedContent.type)
    }
    
    // Also mark as read when viewing
    if (!sharedContent.read) {
      handleMarkAsRead()
    }
  }

  return (
    <Card className={`w-full ${!sharedContent.read ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={sender.avatar_url} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <Badge variant="outline" className="text-xs">
                {getContentIcon()}
                <span className="ml-1">{getContentTypeLabel()}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(sharedContent.created_at)}
            </p>
          </div>
          
          {!sharedContent.read && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-base mb-1">{getContentTitle()}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {getContentDescription()}
            </p>
          </div>
          
          {sharedContent.message && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm italic">"{sharedContent.message}"</p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleViewContent}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Content
            </Button>
            
            {!sharedContent.read && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAsRead}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Read
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 