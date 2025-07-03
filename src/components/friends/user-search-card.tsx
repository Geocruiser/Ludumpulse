/**
 * User Search Card Component
 * 
 * Displays user search results with add friend functionality.
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  UserPlus, 
  Check, 
  Clock, 
  X, 
  Users 
} from 'lucide-react'
import type { UserWithFriends } from '@/types/database'

interface UserSearchCardProps {
  user: UserWithFriends
  onSendFriendRequest?: (userId: string, message?: string) => void
  disabled?: boolean
}

/**
 * User search card component displaying user information and friend request actions
 */
export function UserSearchCard({ 
  user, 
  onSendFriendRequest, 
  disabled = false 
}: UserSearchCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [message, setMessage] = useState('')

  const displayName = user.display_name || user.username || user.email
  const initials = getInitials(displayName)
  
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function handleSendRequest() {
    if (onSendFriendRequest) {
      onSendFriendRequest(user.id, message.trim() || undefined)
      setMessage('')
      setIsDialogOpen(false)
    }
  }

  function getStatusBadge() {
    if (user.is_friend) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Users className="w-3 h-3 mr-1" />
          Friend
        </Badge>
      )
    }

    switch (user.friend_request_status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'ACCEPTED':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <UserPlus className="w-3 h-3 mr-1" />
            Can Send Again
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <UserPlus className="w-3 h-3 mr-1" />
            Can Send Again
          </Badge>
        )
      default:
        return null
    }
  }

  function getButtonContent() {
    if (user.is_friend) {
      return {
        text: 'Already Friends',
        icon: <Users className="w-4 h-4 mr-2" />,
        disabled: true,
        variant: 'outline' as const
      }
    }

    switch (user.friend_request_status) {
      case 'PENDING':
        return {
          text: 'Request Sent',
          icon: <Clock className="w-4 h-4 mr-2" />,
          disabled: true,
          variant: 'outline' as const
        }
      case 'ACCEPTED':
        return {
          text: 'Already Friends',
          icon: <Check className="w-4 h-4 mr-2" />,
          disabled: true,
          variant: 'outline' as const
        }
      case 'REJECTED':
        return {
          text: 'Send Again',
          icon: <UserPlus className="w-4 h-4 mr-2" />,
          disabled: false,
          variant: 'default' as const
        }
      case 'CANCELLED':
        return {
          text: 'Send Again',
          icon: <UserPlus className="w-4 h-4 mr-2" />,
          disabled: false,
          variant: 'default' as const
        }
      default:
        return {
          text: 'Add Friend',
          icon: <UserPlus className="w-4 h-4 mr-2" />,
          disabled: false,
          variant: 'default' as const
        }
    }
  }

  const buttonProps = getButtonContent()

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar_url} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              {getStatusBadge()}
            </div>
            
            {user.username && (
              <p className="text-sm text-muted-foreground">
                @{user.username}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
            
            {user.mutual_friends_count && user.mutual_friends_count > 0 && (
              <p className="text-xs text-muted-foreground">
                {user.mutual_friends_count} mutual friend{user.mutual_friends_count > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        {buttonProps.disabled || disabled ? (
          <Button 
            variant={buttonProps.variant}
            size="sm" 
            disabled 
            className="w-full"
          >
            {buttonProps.icon}
            {buttonProps.text}
          </Button>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={buttonProps.variant} size="sm" className="w-full">
                {buttonProps.icon}
                {buttonProps.text}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Friend Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar_url} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    {user.username && (
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message (optional)</Label>
                  <Input
                    id="message"
                    placeholder="Say something nice..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendRequest}
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  )
} 