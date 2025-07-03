/**
 * Friends Service
 * 
 * This file contains functions for managing friend relationships, friend requests, and shared content.
 */

import { supabase } from '@/lib/supabase'
import { 
  createFriendRequestNotification, 
  createFriendRequestAcceptedNotification,
  createSharedContentNotification 
} from '@/lib/notifications/friends-notifications'
import type { 
  Friend, 
  FriendRequest, 
  SharedContent, 
  UserWithFriends,
  TrackedGame,
  NewsItem,
  ApiResponse 
} from '@/types/database'

/**
 * Search for users by email or username
 */
export async function searchUsers(query: string): Promise<ApiResponse<UserWithFriends[]>> {
  try {
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        display_name,
        avatar_url,
        created_at,
        updated_at
      `)
      .or(`email.ilike.%${query}%,username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', currentUser.id)
      .limit(10)

    if (error) {
      return { success: false, error: error.message }
    }

    // Check friendship status for each user
    const usersWithFriendStatus = await Promise.all(
      (data || []).map(async (user) => {
        const { data: friendData } = await supabase
          .from('friends')
          .select('id')
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${user.id}),and(user_id.eq.${user.id},friend_id.eq.${currentUser.id})`)
          .single()

        const { data: requestData } = await supabase
          .from('friend_requests')
          .select('status')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})`)
          .single()

        return {
          ...user,
          is_friend: !!friendData,
          friend_request_status: requestData?.status || null,
        }
      })
    )

    return { success: true, data: usersWithFriendStatus }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  receiverId: string, 
  message?: string
): Promise<ApiResponse<FriendRequest>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if already friends
    const { data: existingFriend } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user.id})`)
      .single()

    if (existingFriend) {
      return { success: false, error: 'Already friends with this user' }
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status, sender_id, receiver_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .single()

    if (existingRequest) {
      // If there's a pending request, don't allow another one
      if (existingRequest.status === 'PENDING') {
        return { success: false, error: 'Friend request already pending' }
      }
      
      // If there's an accepted request, they're already friends
      if (existingRequest.status === 'ACCEPTED') {
        return { success: false, error: 'Already friends with this user' }
      }
      
      // If the request was rejected or cancelled, allow resending
      // but first delete the old request to avoid constraint issues
      if (existingRequest.status === 'REJECTED' || existingRequest.status === 'CANCELLED') {
        await supabase
          .from('friend_requests')
          .delete()
          .eq('id', existingRequest.id)
      }
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message,
        status: 'PENDING'
      })
      .select(`
        *,
        sender:users!sender_id(id, email, username, display_name, avatar_url),
        receiver:users!receiver_id(id, email, username, display_name, avatar_url)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Create notification for the receiver
    if (data && data.sender) {
      const senderName = data.sender.display_name || data.sender.username || data.sender.email
      await createFriendRequestNotification(receiverId, user.id, senderName, message)
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: string): Promise<ApiResponse<Friend>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get the friend request
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', user.id)
      .eq('status', 'PENDING')
      .single()

    if (requestError || !request) {
      return { success: false, error: 'Friend request not found' }
    }

    // Start a transaction to update request and create friendship
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'ACCEPTED' })
      .eq('id', requestId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Create bidirectional friendship
    const { data: friendship, error: friendshipError } = await supabase
      .from('friends')
      .insert([
        {
          user_id: request.sender_id,
          friend_id: request.receiver_id
        },
        {
          user_id: request.receiver_id,
          friend_id: request.sender_id
        }
      ])
      .select(`
        *,
        friend:users!friend_id(id, email, username, display_name, avatar_url)
      `)

    if (friendshipError) {
      return { success: false, error: friendshipError.message }
    }

    // Create notification for the original sender
    const { data: accepterUser } = await supabase
      .from('users')
      .select('display_name, username, email')
      .eq('id', user.id)
      .single()

    if (accepterUser) {
      const accepterName = accepterUser.display_name || accepterUser.username || accepterUser.email
      await createFriendRequestAcceptedNotification(request.sender_id, accepterName)
    }

    return { success: true, data: friendship[0] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requestId: string): Promise<ApiResponse<boolean>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'REJECTED' })
      .eq('id', requestId)
      .eq('receiver_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequest(requestId: string): Promise<ApiResponse<boolean>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'CANCELLED' })
      .eq('id', requestId)
      .eq('sender_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get all friends for the current user
 */
export async function getFriends(): Promise<ApiResponse<Friend[]>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Query for friendships where current user is either user_id or friend_id
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        user:users!user_id(id, email, username, display_name, avatar_url),
        friend:users!friend_id(id, email, username, display_name, avatar_url)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Transform the data to always show the "other" person as the friend
    // and deduplicate by friend ID to avoid showing the same friend twice
    const seenFriends = new Set<string>()
    const transformedData = (data || [])
      .map(friendship => {
        const isCurrentUserTheUser = friendship.user_id === user.id
        const friendInfo = isCurrentUserTheUser ? friendship.friend : friendship.user
        const friendId = isCurrentUserTheUser ? friendship.friend_id : friendship.user_id
        
        return {
          ...friendship,
          friend: friendInfo,
          friend_id: friendId
        }
      })
      .filter(friendship => {
        // Only include each friend once
        if (seenFriends.has(friendship.friend_id)) {
          return false
        }
        seenFriends.add(friendship.friend_id)
        return true
      })

    return { success: true, data: transformedData }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingFriendRequests(): Promise<ApiResponse<FriendRequest[]>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:users!sender_id(id, email, username, display_name, avatar_url)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get sent friend requests
 */
export async function getSentFriendRequests(): Promise<ApiResponse<FriendRequest[]>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        receiver:users!receiver_id(id, email, username, display_name, avatar_url)
      `)
      .eq('sender_id', user.id)
      .in('status', ['PENDING', 'ACCEPTED', 'REJECTED'])
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(friendId: string): Promise<ApiResponse<boolean>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Remove both directions of the friendship
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get a friend's tracked games
 */
export async function getFriendTrackedGames(friendId: string): Promise<ApiResponse<TrackedGame[]>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify that the current user and the friendId are actually friends
    const { data: friendship, error: friendshipError } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle()

    if (friendshipError) {
      return { success: false, error: friendshipError.message }
    }
    
    if (!friendship) {
      return { success: false, error: 'Not friends with this user' }
    }

    const { data, error } = await supabase
      .from('tracked_games')
      .select('*')
      .eq('user_id', friendId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Share a news item with a friend
 */
export async function shareNewsItem(
  friendId: string, 
  newsItemId: string, 
  message?: string
): Promise<ApiResponse<SharedContent>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify that the current user and the friendId are actually friends
    const { data: friendship, error: friendshipError } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle()

    if (friendshipError) {
      return { success: false, error: friendshipError.message }
    }
    
    if (!friendship) {
      return { success: false, error: 'Not friends with this user' }
    }

    const { data, error } = await supabase
      .from('shared_content')
      .insert({
        shared_by: user.id,
        shared_with: friendId,
        type: 'NEWS_ITEM',
        content_id: newsItemId,
        message
      })
      .select(`
        *,
        sender:users!shared_by(id, email, username, display_name, avatar_url),
        recipient:users!shared_with(id, email, username, display_name, avatar_url)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Get news item title for notification
    const { data: newsItem } = await supabase
      .from('news_items')
      .select('title')
      .eq('id', newsItemId)
      .single()

    // Create notification for the recipient
    if (data && data.sender && newsItem) {
      const senderName = data.sender.display_name || data.sender.username || data.sender.email
      await createSharedContentNotification(friendId, senderName, 'news', newsItem.title, message)
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Share a tracked game with a friend
 */
export async function shareTrackedGame(
  friendId: string, 
  gameId: string, 
  message?: string
): Promise<ApiResponse<SharedContent>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify that the current user and the friendId are actually friends
    const { data: friendship, error: friendshipError } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle()

    if (friendshipError) {
      return { success: false, error: friendshipError.message }
    }
    
    if (!friendship) {
      return { success: false, error: 'Not friends with this user' }
    }

    const { data, error } = await supabase
      .from('shared_content')
      .insert({
        shared_by: user.id,
        shared_with: friendId,
        type: 'GAME_SUGGESTION',
        content_id: gameId,
        message
      })
      .select(`
        *,
        sender:users!shared_by(id, email, username, display_name, avatar_url),
        recipient:users!shared_with(id, email, username, display_name, avatar_url)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Get game title for notification
    const { data: game } = await supabase
      .from('tracked_games')
      .select('title')
      .eq('id', gameId)
      .single()

    // Create notification for the recipient
    if (data && data.sender && game) {
      const senderName = data.sender.display_name || data.sender.username || data.sender.email
      await createSharedContentNotification(friendId, senderName, 'game', game.title, message)
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get shared content received by the current user
 */
export async function getSharedContent(): Promise<ApiResponse<SharedContent[]>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('shared_content')
      .select(`
        *,
        sender:users!shared_by(id, email, username, display_name, avatar_url),
        recipient:users!shared_with(id, email, username, display_name, avatar_url)
      `)
      .eq('shared_with', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Mark shared content as read
 */
export async function markSharedContentAsRead(sharedContentId: string): Promise<ApiResponse<boolean>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('shared_content')
      .update({ read: true })
      .eq('id', sharedContentId)
      .eq('shared_with', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 