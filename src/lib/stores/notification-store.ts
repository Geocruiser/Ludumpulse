/**
 * Notification State Store
 *
 * This store manages the global state for notifications, such as the count of unread items.
 * It uses Zustand for simple and effective state management.
 */

import { create } from 'zustand'
import { getUnreadFriendNotificationsCount } from '@/lib/notifications/friends-notifications'

interface NotificationStoreState {
  unreadFriendCount: number
  fetchUnreadFriendCount: () => Promise<void>
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  unreadFriendCount: 0,
  fetchUnreadFriendCount: async () => {
    const result = await getUnreadFriendNotificationsCount()
    if (result.success) {
      set({ unreadFriendCount: result.data ?? 0 })
    }
  },
})) 