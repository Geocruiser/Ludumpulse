/**
 * Notifications Hooks
 *
 * Custom React hooks for managing notifications.
 */

import { useState, useEffect, useCallback } from 'react'
import { getUnreadFriendNotificationsCount } from '@/lib/notifications/friends-notifications'

/**
 * Hook for fetching the count of unread friend-related notifications.
 */
export function useUnreadFriendNotifications() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCount = useCallback(async () => {
    // Don't set loading to true on refetch, to avoid UI flicker
    const result = await getUnreadFriendNotificationsCount()
    if (result.success) {
      setCount(result.data ?? 0)
    } else {
      setError(result.error || 'Failed to fetch notification count')
      // We won't show a toast here to avoid bothering the user
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchCount()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return { count, isLoading, error, refetch: fetchCount }
} 