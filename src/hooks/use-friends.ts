/**
 * Friends Hooks
 * 
 * Custom React hooks for managing friends functionality.
 */

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendTrackedGames,
  shareNewsItem,
  shareTrackedGame,
  getSharedContent,
  markSharedContentAsRead
} from '@/lib/friends/friends-service'
import type { 
  Friend, 
  FriendRequest, 
  SharedContent, 
  UserWithFriends,
  TrackedGame 
} from '@/types/database'

/**
 * Hook for managing friends list
 */
export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchFriends = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    const result = await getFriends()
    
    if (result.success) {
      setFriends(result.data || [])
    } else {
      setError(result.error || 'Failed to fetch friends')
    }
    
    setIsLoading(false)
  }, [])

  const handleRemoveFriend = useCallback(async (friendId: string) => {
    const result = await removeFriend(friendId)
    
    if (result.success) {
      setFriends(prev => prev.filter(f => f.friend_id !== friendId))
      toast({
        title: 'Friend removed',
        description: 'Friend has been removed from your friends list.'
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to remove friend',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  return {
    friends,
    isLoading,
    error,
    refetch: fetchFriends,
    removeFriend: handleRemoveFriend
  }
}

/**
 * Hook for managing friend requests
 */
export function useFriendRequests() {
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    const [pendingResult, sentResult] = await Promise.all([
      getPendingFriendRequests(),
      getSentFriendRequests()
    ])
    
    if (pendingResult.success) {
      setPendingRequests(pendingResult.data || [])
    } else {
      setError(pendingResult.error || 'Failed to fetch pending requests')
    }
    
    if (sentResult.success) {
      setSentRequests(sentResult.data || [])
    } else {
      setError(sentResult.error || 'Failed to fetch sent requests')
    }
    
    setIsLoading(false)
  }, [])

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    const result = await acceptFriendRequest(requestId)
    
    if (result.success) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      toast({
        title: 'Friend request accepted',
        description: 'You are now friends!'
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to accept friend request',
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleRejectRequest = useCallback(async (requestId: string) => {
    const result = await rejectFriendRequest(requestId)
    
    if (result.success) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      toast({
        title: 'Friend request rejected',
        description: 'Friend request has been rejected.'
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to reject friend request',
        variant: 'destructive'
      })
    }
  }, [toast])

  const handleCancelRequest = useCallback(async (requestId: string) => {
    const result = await cancelFriendRequest(requestId)
    
    if (result.success) {
      setSentRequests(prev => prev.filter(r => r.id !== requestId))
      toast({
        title: 'Friend request cancelled',
        description: 'Friend request has been cancelled.'
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to cancel friend request',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return {
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    refetch: fetchRequests,
    acceptRequest: handleAcceptRequest,
    rejectRequest: handleRejectRequest,
    cancelRequest: handleCancelRequest
  }
}

/**
 * Hook for searching users and sending friend requests
 */
export function useUserSearch() {
  const [users, setUsers] = useState<UserWithFriends[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const searchForUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([])
      return
    }

    setIsLoading(true)
    setError(null)
    
    const result = await searchUsers(query)
    
    if (result.success) {
      setUsers(result.data || [])
    } else {
      setError(result.error || 'Failed to search users')
    }
    
    setIsLoading(false)
  }, [])

  const handleSendFriendRequest = useCallback(async (
    userId: string, 
    message?: string
  ) => {
    const result = await sendFriendRequest(userId, message)
    
    if (result.success) {
      // Update the user's friend request status in the search results
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, friend_request_status: 'PENDING' }
            : user
        )
      )
      
      toast({
        title: 'Friend request sent',
        description: 'Your friend request has been sent.'
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to send friend request',
        variant: 'destructive'
      })
    }
  }, [toast])

  const clearSearch = useCallback(() => {
    setUsers([])
    setError(null)
  }, [])

  return {
    users,
    isLoading,
    error,
    searchUsers: searchForUsers,
    sendFriendRequest: handleSendFriendRequest,
    clearSearch
  }
}

/**
 * Hook for managing a friend's tracked games
 */
export function useFriendGames(friendId: string) {
  const [games, setGames] = useState<TrackedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFriendGames = useCallback(async () => {
    if (!friendId) return
    
    setIsLoading(true)
    setError(null)
    
    const result = await getFriendTrackedGames(friendId)
    
    if (result.success) {
      setGames(result.data || [])
    } else {
      setError(result.error || 'Failed to fetch friend\'s games')
    }
    
    setIsLoading(false)
  }, [friendId])

  useEffect(() => {
    fetchFriendGames()
  }, [fetchFriendGames])

  return {
    games,
    isLoading,
    error,
    refetch: fetchFriendGames
  }
}

/**
 * Hook for sharing content with friends
 */
export function useContentSharing() {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const shareNews = useCallback(async (
    friendId: string, 
    newsItemId: string, 
    message?: string
  ) => {
    setIsSharing(true)
    
    const result = await shareNewsItem(friendId, newsItemId, message)
    
    if (result.success) {
      toast({
        title: 'News shared',
        description: 'News item has been shared with your friend.'
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to share news item',
        variant: 'destructive'
      })
    }
    
    setIsSharing(false)
  }, [toast])

  const shareGame = useCallback(async (
    friendId: string, 
    gameId: string, 
    message?: string
  ) => {
    setIsSharing(true)
    
    const result = await shareTrackedGame(friendId, gameId, message)
    
    if (result.success) {
      toast({
        title: 'Game shared',
        description: 'Game has been shared with your friend.'
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to share game',
        variant: 'destructive'
      })
    }
    
    setIsSharing(false)
  }, [toast])

  return {
    isSharing,
    shareNews,
    shareGame
  }
}

/**
 * Hook for managing shared content received from friends
 */
export function useSharedContent() {
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSharedContent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    const result = await getSharedContent()
    
    if (result.success) {
      setSharedContent(result.data || [])
    } else {
      setError(result.error || 'Failed to fetch shared content')
    }
    
    setIsLoading(false)
  }, [])

  const markAsRead = useCallback(async (sharedContentId: string) => {
    const result = await markSharedContentAsRead(sharedContentId)
    
    if (result.success) {
      setSharedContent(prev => 
        prev.map(content => 
          content.id === sharedContentId 
            ? { ...content, read: true }
            : content
        )
      )
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to mark as read',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    fetchSharedContent()
  }, [fetchSharedContent])

  return {
    sharedContent,
    isLoading,
    error,
    refetch: fetchSharedContent,
    markAsRead
  }
} 