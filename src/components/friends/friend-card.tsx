/**
 * Friend Card Component
 * 
 * Displays friend information with actions like viewing games and removing friend.
 */

'use client'

import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  UserMinus, 
  MessageCircle 
} from 'lucide-react'
import type { Friend } from '@/types/database'

interface FriendCardProps {
  friend: Friend
  onViewGames?: (friendId: string) => void
  onRemoveFriend?: (friendId: string) => void
  onStartChat?: (friendId: string) => void
}

/**
 * Friend card component displaying friend information and actions
 */
export function FriendCard({ 
  friend, 
  onViewGames, 
  onRemoveFriend, 
  onStartChat 
}: FriendCardProps) {
  const friendUser = friend.friend
  
  if (!friendUser) {
    return null
  }

  const displayName = friendUser.display_name || friendUser.username || friendUser.email
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6 px-6 pb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={friendUser.avatar_url} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              <Badge variant="secondary" className="text-xs">
                Friend
              </Badge>
            </div>
            
            {friendUser.username && (
              <p className="text-sm text-muted-foreground">
                @{friendUser.username}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Friends since {formatDate(friend.created_at)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="mr-2 relative -top-4 -left-4">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="bottom" 
              sideOffset={4}
              alignOffset={-4}
              avoidCollisions={true}
              collisionPadding={8}
              className="min-w-[160px]"
            >
              {onViewGames && (
                <DropdownMenuItem onClick={() => onViewGames(friend.friend_id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Games
                </DropdownMenuItem>
              )}
              {onStartChat && (
                <DropdownMenuItem onClick={() => onStartChat(friend.friend_id)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </DropdownMenuItem>
              )}
              {onRemoveFriend && (
                <DropdownMenuItem 
                  onClick={() => onRemoveFriend(friend.friend_id)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove Friend
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex space-x-2 w-full">
          {onViewGames && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewGames(friend.friend_id)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Games
            </Button>
          )}
          {onStartChat && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onStartChat(friend.friend_id)}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 