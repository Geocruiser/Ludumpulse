/**
 * Database Types
 * 
 * TypeScript types for our database models and API responses.
 */

export interface User {
  id: string
  email: string
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