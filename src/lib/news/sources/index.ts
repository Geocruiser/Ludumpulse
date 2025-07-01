/**
 * News Sources Index
 * 
 * Central registry for all news sources.
 * Provides easy access to all configured news source adapters.
 */

import { NewsSource } from '@/types/news'
import { ignNewsSource } from './ign-source'
import { gamespotNewsSource } from './gamespot-source'
import { polygonNewsSource } from './polygon-source'

// Export all individual sources
export { ignNewsSource } from './ign-source'
export { gamespotNewsSource } from './gamespot-source'
export { polygonNewsSource } from './polygon-source'

// All available news sources
export const ALL_NEWS_SOURCES: NewsSource[] = [
  ignNewsSource,
  gamespotNewsSource,
  polygonNewsSource
]

// News sources registry
export const NEWS_SOURCES_REGISTRY = new Map<string, NewsSource>([
  [ignNewsSource.id, ignNewsSource],
  [gamespotNewsSource.id, gamespotNewsSource],
  [polygonNewsSource.id, polygonNewsSource]
])

/**
 * Get a specific news source by ID
 */
export function getNewsSource(sourceId: string): NewsSource | undefined {
  return NEWS_SOURCES_REGISTRY.get(sourceId)
}

/**
 * Get all active news sources
 */
export function getAllNewsSources(): NewsSource[] {
  return ALL_NEWS_SOURCES
}

/**
 * Check if a source ID is valid
 */
export function isValidSourceId(sourceId: string): boolean {
  return NEWS_SOURCES_REGISTRY.has(sourceId)
} 