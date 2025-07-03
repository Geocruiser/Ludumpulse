/**
 * Friend Request Card Component
 * 
 * Displays friend request information with accept/reject actions.
 */

'use client'

import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, Clock } from 'lucide-react'
import type { FriendRequest } from '@/types/database'

interface FriendRequestCardProps {
  request: FriendRequest
  type: 'received' | 'sent'
  onAccept?: (requestId: string) => void
  onReject?: (requestId: string) => void
  onCancel?: (requestId: string) => void
}

/**
 * Friend request card component displaying request information and actions
 */
export function FriendRequestCard({ 
  request, 
  type, 
  onAccept, 
  onReject, 
  onCancel 
}: FriendRequestCardProps) {
  const otherUser = type === 'received' ? request.sender : request.receiver
  
  if (!otherUser) {
    return null
  }

  const displayName = otherUser.display_name || otherUser.username || otherUser.email
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

  function getStatusBadge() {
    switch (request.status) {
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
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={otherUser.avatar_url} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              {getStatusBadge()}
            </div>
            
            {otherUser.username && (
              <p className="text-sm text-muted-foreground">
                @{otherUser.username}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              {type === 'received' ? 'Sent' : 'Sent to'} {formatDate(request.created_at)}
            </p>
          </div>
        </div>
        
        {request.message && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">{request.message}</p>
          </div>
        )}
      </CardContent>
      
      {request.status === 'PENDING' && (
        <CardFooter className="pt-0">
          <div className="flex space-x-2 w-full">
            {type === 'received' && (
              <>
                {onAccept && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => onAccept(request.id)}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                )}
                {onReject && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onReject(request.id)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                )}
              </>
            )}
            
            {type === 'sent' && onCancel && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCancel(request.id)}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Request
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
} 