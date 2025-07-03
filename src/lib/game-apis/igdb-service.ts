/**
 * IGDB (Internet Game Database) API service
 * Provides game metadata, cover art, and details via Electron's main process
 * Uses IPC to communicate with the main process to avoid CORS restrictions
 */

import { TrackedGame } from '../../types/database'

export interface IGDBGame {
  id: number
  name: string
  summary?: string
  cover?: {
    url: string
  }
  first_release_date?: number
  genres?: Array<{
    name: string
  }>
  platforms?: Array<{
    name: string
  }>
  involved_companies?: Array<{
    company: {
      name: string
    }
    developer: boolean
    publisher: boolean
  }>
  rating?: number
  rating_count?: number
  screenshots?: Array<{
    url: string
  }>
}

/**
 * Wait for the IGDB API to be available
 */
async function waitForIGDBAPI(maxWaitMs: number = 2000): Promise<boolean> {
  // First, immediate check
  if (typeof window !== 'undefined' && window.igdbApi) {
    console.log('IGDB API is immediately available!')
    return true
  }
  
  console.log('IGDB API not immediately available, waiting...', {
    windowExists: typeof window !== 'undefined',
    igdbApiExists: typeof window !== 'undefined' ? !!window.igdbApi : false,
    windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(k => k.toLowerCase().includes('igdb') || k.toLowerCase().includes('api') || k.toLowerCase().includes('diagnostic')) : []
  })
  
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    if (typeof window !== 'undefined' && window.igdbApi) {
      console.log('IGDB API became available after', Date.now() - startTime, 'ms')
      return true
    }
    
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  console.error('IGDB API not available after waiting', maxWaitMs, 'ms')
  console.error('Final window state:', {
    windowExists: typeof window !== 'undefined',
    igdbApiExists: typeof window !== 'undefined' ? !!window.igdbApi : false,
    allWindowKeys: typeof window !== 'undefined' ? Object.keys(window).slice(0, 20) : []
  })
  return false
}

/**
 * Check if IGDB API is configured
 */
export async function isIGDBConfigured(): Promise<boolean> {
  try {
    // Try direct access first
    if (typeof window !== 'undefined' && window.igdbApi) {
      return await window.igdbApi.isConfigured()
    }
    
    // Fall back to waiting
    if (!(await waitForIGDBAPI())) {
      return false
    }
    
    return await window.igdbApi.isConfigured()
  } catch (error) {
    console.error('Error checking IGDB configuration:', error)
    return false
  }
}

/**
 * Test IGDB API connection
 */
export async function testIGDBConnection(): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    if (!(await waitForIGDBAPI())) {
      return {
        success: false,
        message: 'IGDB API not available in this environment'
      }
    }
    
    return await window.igdbApi.testConnection()
  } catch (error) {
    console.error('Error testing IGDB connection:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Convert IGDB image URL to high-resolution format
 */
function processImageUrl(url: string): string {
  if (!url) return ''
  
  // Remove protocol if present
  const cleanUrl = url.replace(/^https?:/, '')
  
  // If it's a thumbnail, convert to high-res
  if (cleanUrl.includes('thumb')) {
    return `https:${cleanUrl.replace('thumb', 'cover_big')}`
  }
  
  // If it's already a full URL, add https
  if (cleanUrl.startsWith('//')) {
    return `https:${cleanUrl}`
  }
  
  // If it's a relative path, add the base URL
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cleanUrl}`
}

/**
 * Transform IGDB game data to our TrackedGame interface
 */
function transformIGDBGame(igdbGame: IGDBGame): TrackedGame {
  const developers = igdbGame.involved_companies?.filter(c => c.developer)?.map(c => c.company.name) || []
  const publishers = igdbGame.involved_companies?.filter(c => c.publisher)?.map(c => c.company.name) || []
  const genres = igdbGame.genres?.map(g => g.name) || []
  const platforms = igdbGame.platforms?.map(p => p.name) || []
  const screenshots = igdbGame.screenshots?.map(s => processImageUrl(s.url)) || []
  
  return {
    id: igdbGame.id.toString(),
    user_id: '',
    title: igdbGame.name,
    tags: genres,
    release_status: 'RELEASED' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // IGDB Integration Fields
    igdb_id: igdbGame.id,
    cover_art_url: igdbGame.cover ? processImageUrl(igdbGame.cover.url) : '',
    description: igdbGame.summary || '',
    release_date: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000).toISOString().split('T')[0] : '',
    developer: developers.length > 0 ? developers[0] : '',
    publisher: publishers.length > 0 ? publishers[0] : '',
    genres: genres,
    platforms: platforms,
    rating: igdbGame.rating || 0,
    screenshots: screenshots
  }
}

/**
 * Search for games on IGDB
 */
export async function searchGames(query: string, limit: number = 20): Promise<TrackedGame[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    console.log('Searching games with query:', query)
    
    // Try direct access first
    if (typeof window !== 'undefined' && window.igdbApi) {
      console.log('Using immediately available IGDB API')
      try {
        const response = await window.igdbApi.searchGames(query, limit)
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to search games')
        }

        const games = response.data || []
        console.log('Found games:', games.length)
        
        return games.map(transformIGDBGame)
      } catch (error) {
        console.error('Error searching games (direct):', error)
        throw error
      }
    }
    
    // Fall back to waiting for API
    console.log('IGDB API not immediately available, waiting...')
    if (!(await waitForIGDBAPI())) {
      throw new Error('IGDB API not available in this environment')
    }

    const response = await window.igdbApi.searchGames(query, limit)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to search games')
    }

    const games = response.data || []
    console.log('Found games:', games.length)
    
    return games.map(transformIGDBGame)
  } catch (error) {
    console.error('Error searching games:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to search games')
  }
}

/**
 * Get a specific game by IGDB ID
 */
export async function getGameById(igdbId: number): Promise<TrackedGame | null> {
  try {
    console.log('Getting game by ID:', igdbId)
    
    if (!(await waitForIGDBAPI())) {
      throw new Error('IGDB API not available in this environment')
    }

    const response = await window.igdbApi.getGameById(igdbId)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get game details')
    }

    const game = response.data
    
    if (!game) {
      return null
    }

    console.log('Found game:', game.name)
    return transformIGDBGame(game)
  } catch (error) {
    console.error('Error getting game by ID:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get game details')
  }
}

/**
 * Get popular games from IGDB
 */
export async function getPopularGames(limit: number = 50): Promise<TrackedGame[]> {
  try {
    console.log('Getting popular games, limit:', limit)
    
    if (!(await waitForIGDBAPI())) {
      throw new Error('IGDB API not available in this environment')
    }

    const response = await window.igdbApi.getPopularGames(limit)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get popular games')
    }

    const games = response.data || []
    console.log('Found popular games:', games.length)
    
    return games.map(transformIGDBGame)
  } catch (error) {
    console.error('Error getting popular games:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get popular games')
  }
}

/**
 * Get upcoming games from IGDB
 */
export async function getUpcomingGames(limit: number = 50): Promise<TrackedGame[]> {
  try {
    console.log('Getting upcoming games, limit:', limit)
    
    // For now, return popular games as IGDB doesn't have a simple upcoming endpoint
    return await getPopularGames(limit)
  } catch (error) {
    console.error('Error getting upcoming games:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get upcoming games')
  }
}

/**
 * Get trending games from IGDB, optionally filtered by genres
 */
export async function getTrendingGames(genres: string[] = [], limit: number = 50): Promise<TrackedGame[]> {
  try {
    console.log('Getting trending games, genres:', genres, 'limit:', limit)
    
    if (!(await waitForIGDBAPI())) {
      throw new Error('IGDB API not available in this environment')
    }

    const response = await window.igdbApi.getTrendingGames(genres, limit)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get trending games')
    }

    const games = response.data || []
    console.log('Found trending games:', games.length)
    
    return games.map(transformIGDBGame)
  } catch (error) {
    console.error('Error getting trending games:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get trending games')
  }
}

/**
 * Debug function to test IGDB API availability
 * Call this from the browser console to test the API state
 */
export function debugIGDBState(): void {
  console.log('=== IGDB API Debug Information ===')
  console.log('Window exists:', typeof window !== 'undefined')
  
  if (typeof window !== 'undefined') {
    console.log('window.igdbApi exists:', !!window.igdbApi)
    console.log('window.diagnostics exists:', !!(window as any).diagnostics)
    
    if (window.igdbApi) {
      console.log('IGDB API methods:', Object.keys(window.igdbApi))
      
      // Test isConfigured
      window.igdbApi.isConfigured().then(result => {
        console.log('IGDB isConfigured result:', result)
      }).catch(err => {
        console.error('IGDB isConfigured error:', err)
      })
    }
    
    // Test diagnostics if available
    if ((window as any).diagnostics) {
      (window as any).diagnostics.testIGDBAvailability()
      ;(window as any).diagnostics.testIGDBConnection()
    }
    
    console.log('Relevant window keys:', Object.keys(window).filter(k => 
      k.toLowerCase().includes('igdb') || 
      k.toLowerCase().includes('api') || 
      k.toLowerCase().includes('diagnostic')
    ))
  }
  
  console.log('=== End Debug Information ===')
}

// Make the debug function available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).debugIGDBState = debugIGDBState
}