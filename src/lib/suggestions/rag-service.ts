/**
 * RAG (Retrieval-Augmented Generation) Suggestion Service
 *
 * This service dynamically generates game suggestions by:
 * 1. Analyzing the user's tracked games (genres, themes, developers, etc.)
 * 2. Retrieving relevant context from IGDB popular games
 * 3. Using AI to generate personalized recommendations with explanations
 */

import { TrackedGame } from '@/hooks/use-games'
import { getPopularGames, getTrendingGames } from '@/lib/game-apis/igdb-service'
import { GameSuggestion } from '@/types/database'
import { defaultAIService } from './ai-service'
import { isSuggestionDismissed } from './dismissed-suggestions-store'

/**
 * Analyzes user's gaming preferences from their tracked games
 */
function analyzeUserPreferences(trackedGames: TrackedGame[]): {
  topGenres: string[]
  preferredDevelopers: string[]
  gameThemes: string[]
  averageRating: number
  recentGames: TrackedGame[]
} {
  if (!trackedGames.length) {
    return {
      topGenres: [],
      preferredDevelopers: [],
      gameThemes: [],
      averageRating: 0,
      recentGames: []
    }
  }

  // Analyze genres
  const genreFreq = new Map<string, number>()
  trackedGames.forEach(game => {
    game.genres.forEach(genre => {
      if (genre) genreFreq.set(genre, (genreFreq.get(genre) || 0) + 1)
    })
  })

  const topGenres = [...genreFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre)

  // Analyze developers
  const devFreq = new Map<string, number>()
  trackedGames.forEach(game => {
    if (game.developer) {
      devFreq.set(game.developer, (devFreq.get(game.developer) || 0) + 1)
    }
  })

  const preferredDevelopers = [...devFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dev]) => dev)

  // Extract themes from tags and titles
  const allTags = trackedGames.flatMap(game => game.tags || [])
  const gameThemes = [...new Set(allTags)].slice(0, 10)

  // Calculate average rating preference
  const ratedGames = trackedGames.filter(game => game.rating && game.rating > 0)
  const averageRating = ratedGames.length > 0 
    ? ratedGames.reduce((sum, game) => sum + (game.rating || 0), 0) / ratedGames.length
    : 75 // Default to 75 if no ratings

  // Get recent games (last 5 added)
  const recentGames = [...trackedGames]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return {
    topGenres,
    preferredDevelopers,
    gameThemes,
    averageRating,
    recentGames
  }
}

/**
 * Generates AI prompt for game suggestions based on user preferences
 */
function generateSuggestionPrompt(
  preferences: ReturnType<typeof analyzeUserPreferences>,
  candidateGames: TrackedGame[],
  trackedGameTitles: string[]
): string {
  const { topGenres, preferredDevelopers, gameThemes, averageRating, recentGames } = preferences

  return `You are a gaming expert providing personalized game recommendations. 

USER PROFILE:
- Favorite genres: ${topGenres.join(', ') || 'None specified'}
- Preferred developers: ${preferredDevelopers.join(', ') || 'None specified'}
- Game themes/tags: ${gameThemes.join(', ') || 'None specified'}
- Average rating preference: ${averageRating}/100
- Recently tracked games: ${recentGames.map(g => g.title).join(', ') || 'None'}

CURRENTLY TRACKING: ${trackedGameTitles.join(', ')}

CANDIDATE GAMES TO CONSIDER:
${candidateGames.map(game => 
  `- ${game.title} (${game.genres.join(', ')}) - ${game.developer || 'Unknown dev'} - Rating: ${game.rating || 'N/A'}/100`
).join('\n')}

NOTE: This list includes both popular games and trending titles in your preferred genres.

Please recommend 5-8 games from the candidate list that would best match this user's preferences. 
For each recommendation, provide:
1. Game title (must match exactly from candidate list)
2. Brief compelling reason why it fits their preferences (2-3 sentences max)

Format your response as a JSON array like this:
[
  {
    "title": "Game Title",
    "reason": "This game perfectly matches your love for RPGs and features the same developer as your favorite game. The deep story and character progression will appeal to your preference for narrative-driven experiences."
  }
]

Focus on games that genuinely match their demonstrated preferences, including both established favorites and trending discoveries.`
}

/**
 * Generates AI recommendations using the configured AI service
 */
async function generateAISuggestions(prompt: string): Promise<Array<{ title: string; reason: string }>> {
  const recommendations = await defaultAIService.generateRecommendations(prompt)
  return recommendations.map(rec => ({
    title: rec.title,
    reason: rec.reason
  }))
}

/**
 * Main RAG function that generates personalized game suggestions
 */
export async function generateRAGSuggestions(
  trackedGames: TrackedGame[],
  limit: number = 8
): Promise<GameSuggestion[]> {
  try {
    // Step 1: Analyze user preferences
    const preferences = analyzeUserPreferences(trackedGames)
    
    if (!preferences.topGenres.length && !preferences.preferredDevelopers.length) {
      return [] // Not enough data to make suggestions
    }

    // Step 2: Retrieve candidate games from IGDB (mix of popular and trending)
    const [popularGames, trendingGames] = await Promise.all([
      getPopularGames(100), // Get popular games
      getTrendingGames(preferences.topGenres, 50) // Get trending games in user's preferred genres
    ])
    
    // Combine and deduplicate games
    const allCandidates = [...popularGames, ...trendingGames]
    const uniqueCandidates = Array.from(
      new Map(allCandidates.map(game => [game.igdb_id, game])).values()
    )
    
    // Filter out already tracked games
    const trackedIds = new Set(trackedGames.map(g => g.igdb_id).filter(Boolean))
    const trackedTitles = new Set(trackedGames.map(g => g.title.toLowerCase()))
    
    const filteredCandidates = uniqueCandidates.filter((game: TrackedGame) => 
      !trackedIds.has(game.igdb_id) && 
      !trackedTitles.has(game.title.toLowerCase()) &&
      game.genres.length > 0 // Must have genre data
    )

    if (filteredCandidates.length === 0) {
      return []
    }

    // Step 3: Generate AI prompt
    const prompt = generateSuggestionPrompt(
      preferences,
      filteredCandidates.slice(0, 50), // Limit candidates in prompt
      trackedGames.map(g => g.title)
    )

    // Step 4: Get AI suggestions
    const aiSuggestions = await generateAISuggestions(prompt)

    // Step 5: Convert to GameSuggestion format
    const suggestions: GameSuggestion[] = aiSuggestions.slice(0, limit).map((suggestion, index) => ({
      id: `rag-${Date.now()}-${index}`,
      user_id: '',
      game_title: suggestion.title,
      justification: suggestion.reason,
      status: 'PENDING' as const,
      created_at: new Date().toISOString(),
    }))

    // Step 6: Filter out dismissed suggestions
    const filteredSuggestions = suggestions.filter(suggestion => 
      !isSuggestionDismissed(suggestion.game_title)
    )

    return filteredSuggestions

  } catch (error) {
    console.error('Error generating RAG suggestions:', error)
    return []
  }
}

/**
 * Validates if a game suggestion is still relevant
 * (e.g., user hasn't already added the game since suggestion was generated)
 */
export function validateSuggestion(
  suggestion: GameSuggestion,
  currentTrackedGames: TrackedGame[]
): boolean {
  const trackedTitles = new Set(currentTrackedGames.map(g => g.title.toLowerCase()))
  return !trackedTitles.has(suggestion.game_title.toLowerCase())
} 