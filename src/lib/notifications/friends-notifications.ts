/**
 * Friends Notifications Service
 * 
 * Extends the notification system to handle friend requests and shared content notifications.
 */

import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types/database'

// Friend notification types
export const FRIEND_NOTIFICATION_TYPES = {
  FRIEND_REQUEST_RECEIVED: 'friend_request_received',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
  SHARED_CONTENT_RECEIVED: 'shared_content_received',
  NEW_FRIEND_JOINED: 'new_friend_joined'
} as const

export type FriendNotificationType = typeof FRIEND_NOTIFICATION_TYPES[keyof typeof FRIEND_NOTIFICATION_TYPES]

/**
 * Create a notification for a friend request received
 */
export async function createFriendRequestNotification(
  receiverId: string,
  senderId: string,
  senderName: string,
  message?: string
): Promise<ApiResponse<void>> {
  try {
    const notificationMessage = message 
      ? `${senderName} sent you a friend request: "${message}"`
      : `${senderName} sent you a friend request`

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: FRIEND_NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED,
        message: notificationMessage,
        read: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Create a notification for a friend request accepted
 */
export async function createFriendRequestAcceptedNotification(
  senderId: string,
  accepterName: string
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: senderId,
        type: FRIEND_NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED,
        message: `${accepterName} accepted your friend request! You are now friends.`,
        read: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Create a notification for shared content received
 */
export async function createSharedContentNotification(
  recipientId: string,
  senderName: string,
  contentType: 'news' | 'game' | 'article',
  contentTitle: string,
  message?: string
): Promise<ApiResponse<void>> {
  try {
    const getContentTypeLabel = (type: string) => {
      switch (type) {
        case 'news': return 'news article'
        case 'game': return 'game'
        case 'article': return 'article'
        default: return 'content'
      }
    }

    const baseMessage = `${senderName} shared a ${getContentTypeLabel(contentType)} with you: "${contentTitle}"`
    const notificationMessage = message 
      ? `${baseMessage}\nMessage: "${message}"`
      : baseMessage

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: FRIEND_NOTIFICATION_TYPES.SHARED_CONTENT_RECEIVED,
        message: notificationMessage,
        read: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Create a notification when someone new joins as a friend (mutual connection)
 */
export async function createNewFriendJoinedNotification(
  userId: string,
  newFriendName: string,
  mutualFriendName: string
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: FRIEND_NOTIFICATION_TYPES.NEW_FRIEND_JOINED,
        message: `${newFriendName} joined through ${mutualFriendName}. You might know them!`,
        read: false
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get friend-related notifications for the current user
 */
export async function getFriendNotifications(): Promise<ApiResponse<any[]>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const friendNotificationTypes = Object.values(FRIEND_NOTIFICATION_TYPES)

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .in('type', friendNotificationTypes)
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
 * Mark all friend notifications as read
 */
export async function markAllFriendNotificationsAsRead(): Promise<ApiResponse<void>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const friendNotificationTypes = Object.values(FRIEND_NOTIFICATION_TYPES)

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .in('type', friendNotificationTypes)
      .eq('read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get count of unread friend notifications
 */
export async function getUnreadFriendNotificationsCount(): Promise<ApiResponse<number>> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const friendNotificationTypes = Object.values(FRIEND_NOTIFICATION_TYPES)

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('type', friendNotificationTypes)
      .eq('read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: count || 0 }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 