/**
 * Database Types
 * 
 * TypeScript types for our database models and API responses.
 */

export interface User {
  id: string
  email: string
  username?: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface TrackedGame {
  id: string
  user_id: string
  title: string
  tags: string[]
  release_status: 'RELEASED' | 'UNRELEASED'
  created_at: string
  updated_at: string
  // IGDB Integration Fields
  igdb_id?: number
  cover_art_url?: string
  description?: string
  release_date?: string
  developer?: string
  publisher?: string
  genres: string[]
  platforms: string[]
  rating?: number
  screenshots: string[]
}

export interface NewsItem {
  id: string
  game_id: string
  title: string
  summary?: string
  full_article_url?: string
  published_at?: string
  created_at: string
}

export interface GameSuggestion {
  id: string
  user_id: string
  game_title: string
  justification?: string
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  game_id?: string
  type: string
  message: string
  read: boolean
  created_at: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Friends System Types
export interface Friend {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend?: User // Populated friend user data
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  message?: string
  created_at: string
  updated_at: string
  sender?: User // Populated sender user data
  receiver?: User // Populated receiver user data
}

export interface SharedContent {
  id: string
  shared_by: string
  shared_with: string
  type: 'NEWS_ITEM' | 'ARTICLE' | 'GAME_SUGGESTION'
  content_id: string
  message?: string
  read: boolean
  created_at: string
  sender?: User // Populated sender user data
  recipient?: User // Populated recipient user data
  // Content data based on type
  news_item?: NewsItem
  tracked_game?: TrackedGame
}

// Extended User interface with friends data
export interface UserWithFriends extends User {
  friends_count?: number
  is_friend?: boolean
  friend_request_status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | null
  mutual_friends_count?: number
} 