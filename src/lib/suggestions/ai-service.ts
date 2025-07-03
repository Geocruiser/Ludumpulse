/**
 * AI Service for Game Suggestions
 * 
 * This service provides an abstraction layer for AI-powered game recommendations.
 * Currently uses a mock implementation but can be easily extended to use real AI providers.
 */

export interface AIRecommendation {
  title: string
  reason: string
  confidence: number // 0-1 score
}

export interface AIServiceConfig {
  provider: 'mock' | 'openai' | 'claude'
  apiKey?: string
  model?: string
}

/**
 * Abstract AI service interface
 */
export interface AIService {
  generateRecommendations(prompt: string): Promise<AIRecommendation[]>
}

/**
 * Mock AI service for development and demo purposes
 */
class MockAIService implements AIService {
  async generateRecommendations(prompt: string): Promise<AIRecommendation[]> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Extract candidate games from the prompt
    const candidateSection = prompt.split('CANDIDATE GAMES TO CONSIDER:')[1]
    if (!candidateSection) return []
    
    const candidateLines = candidateSection.split('\n').filter(line => line.startsWith('- '))
    const candidates = candidateLines.map(line => {
      const match = line.match(/- (.+?) \((.+?)\) - (.+?) - Rating: (.+?)\/100/)
      if (!match) return null
      
      const [, title, genres, developer, rating] = match
      return { title, genres, developer, rating: parseInt(rating) || 0 }
    }).filter(Boolean)
    
    if (!candidates.length) return []
    
    // Extract user preferences from prompt
    const genreMatch = prompt.match(/Favorite genres: (.+)/)?.[1]
    const userGenres = genreMatch ? genreMatch.split(', ').filter(g => g !== 'None specified') : []
    
    const devMatch = prompt.match(/Preferred developers: (.+)/)?.[1]
    const userDevs = devMatch ? devMatch.split(', ').filter(d => d !== 'None specified') : []
    
    const recentMatch = prompt.match(/Recently tracked games: (.+)/)?.[1]
    const recentGames = recentMatch ? recentMatch.split(', ').filter(g => g !== 'None') : []
    
    const avgRatingMatch = prompt.match(/Average rating preference: (.+?)\/100/)?.[1]
    const avgRating = avgRatingMatch ? parseInt(avgRatingMatch) : 75

    // Generate intelligent recommendations with varied reasoning strategies
    const recommendations: AIRecommendation[] = []
    const reasoningStrategies = [
      'genre_deep_dive',
      'developer_connection',
      'evolution_progression',
      'hidden_gem',
      'critical_acclaim',
      'thematic_similarity',
      'mechanical_innovation',
      'narrative_depth',
      'trending_discovery'
    ]
    
    for (const candidate of candidates.slice(0, 8)) {
      if (!candidate) continue
      
      let confidence = 0.5 // Base confidence
          const candidateGenres = candidate.genres.split(', ')
    const genreMatches = candidateGenres.filter((g: string) => userGenres.includes(g))
      
      // Calculate confidence based on multiple factors
      if (genreMatches.length > 0) {
        confidence += 0.3 * (genreMatches.length / candidateGenres.length)
      }
      if (userDevs.includes(candidate.developer)) {
        confidence += 0.2
      }
      if (candidate.rating >= avgRating) {
        confidence += 0.15
      }
      if (candidate.rating >= 85) {
        confidence += 0.1
      }
      
      // Select reasoning strategy based on game characteristics and user profile
      const strategy = this.selectReasoningStrategy(candidate, userGenres, userDevs, recentGames, reasoningStrategies)
      const reason = this.generateReasoningByStrategy(strategy, candidate, userGenres, userDevs, recentGames, avgRating)
      
      recommendations.push({
        title: candidate.title,
        reason: reason,
        confidence: Math.min(confidence, 0.95)
      })
    }
    
    // Sort by confidence and return top recommendations
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6)
  }

  /**
   * Select the most appropriate reasoning strategy for a game
   */
  private selectReasoningStrategy(
    candidate: any,
    userGenres: string[],
    userDevs: string[],
    recentGames: string[],
    strategies: string[]
  ): string {
    const candidateGenres = candidate.genres.split(', ')
    const genreMatches = candidateGenres.filter((g: string) => userGenres.includes(g))
    
    // Developer connection strategy
    if (userDevs.includes(candidate.developer)) {
      return 'developer_connection'
    }
    
    // High rating games get critical acclaim strategy
    if (candidate.rating >= 90) {
      return 'critical_acclaim'
    }
    
    // Multiple genre matches get deep dive strategy
    if (genreMatches.length >= 2) {
      return 'genre_deep_dive'
    }
    
    // Single strong genre match gets thematic similarity
    if (genreMatches.length === 1) {
      return 'thematic_similarity'
    }
    
    // Games with unique genres get hidden gem or innovation strategy
    if (candidateGenres.some((g: string) => ['Puzzle', 'Simulation', 'Strategy'].includes(g))) {
      return Math.random() > 0.5 ? 'hidden_gem' : 'mechanical_innovation'
    }
    
    // Story-heavy genres get narrative depth
    if (candidateGenres.some((g: string) => ['RPG', 'Adventure', 'Visual Novel'].includes(g))) {
      return 'narrative_depth'
    }
    
    // Random chance for trending discovery (20% chance)
    if (Math.random() < 0.2) {
      return 'trending_discovery'
    }
    
    // Default to evolution progression
    return 'evolution_progression'
  }

  /**
   * Generate specific reasoning based on the selected strategy
   */
  private generateReasoningByStrategy(
    strategy: string,
    candidate: any,
    userGenres: string[],
    userDevs: string[],
    recentGames: string[],
    avgRating: number
  ): string {
    const candidateGenres = candidate.genres.split(', ')
    const genreMatches = candidateGenres.filter((g: string) => userGenres.includes(g))
    
    switch (strategy) {
      case 'developer_connection':
        return `Since you're already a fan of ${candidate.developer}'s work, ${candidate.title} represents their latest evolution in game design. This studio consistently delivers the quality and attention to detail you've come to appreciate, with refined mechanics that build on their signature style.`
      
      case 'genre_deep_dive':
        return `This ${genreMatches.join('/')}-focused experience takes everything you love about ${genreMatches[0]} games and elevates it with innovative ${candidateGenres.filter((g: string) => !genreMatches.includes(g))[0] || 'gameplay'} elements. It's designed for players who want to dive deeper into the ${genreMatches.join(' and ')} mechanics you clearly enjoy.`
      
      case 'evolution_progression':
        const recentGame = recentGames[0] || 'your recent additions'
        return `Building on your interest in ${recentGame}, ${candidate.title} represents the next step in your gaming journey. It introduces more sophisticated ${candidateGenres[0].toLowerCase()} mechanics while maintaining the accessibility that makes it immediately engaging.`
      
      case 'hidden_gem':
        return `While ${candidate.title} might not be on everyone's radar, it's exactly the kind of overlooked masterpiece that sophisticated gamers discover and treasure. The ${candidateGenres[0].toLowerCase()} mechanics are refined and thoughtful, offering depth without unnecessary complexity.`
      
      case 'critical_acclaim':
        return `With a ${candidate.rating}/100 rating, ${candidate.title} has earned widespread critical recognition for good reason. The game masterfully balances ${candidateGenres.slice(0, 2).join(' and ').toLowerCase()} elements, creating an experience that's both immediately satisfying and deeply rewarding over time.`
      
      case 'thematic_similarity':
        const sharedGenre = genreMatches[0]
        return `The ${sharedGenre.toLowerCase()} elements in ${candidate.title} will feel familiar yet fresh, taking the core concepts you enjoy and presenting them through a unique lens. It's like discovering a new perspective on a favorite theme - comfortable yet surprising.`
      
      case 'mechanical_innovation':
        return `${candidate.title} introduces clever mechanical twists that reinvent traditional ${candidateGenres[0].toLowerCase()} gameplay. It's the kind of game that makes you think "why hasn't anyone done this before?" while delivering the satisfying core experience you're looking for.`
      
      case 'narrative_depth':
        return `The storytelling in ${candidate.title} goes beyond surface-level entertainment, offering the kind of narrative complexity that stays with you long after playing. If you appreciate games that respect your intelligence and emotional investment, this delivers that experience in spades.`
      
      case 'trending_discovery':
        return `${candidate.title} is gaining significant momentum in the ${candidateGenres[0].toLowerCase()} community right now. This trending title combines the ${candidateGenres.slice(0, 2).join(' and ').toLowerCase()} elements you love with fresh ideas that are capturing players' attention. Sometimes the best discoveries come from riding the wave of what's exciting other gamers.`
      
      default:
        return `${candidate.title} offers a compelling ${candidateGenres[0].toLowerCase()} experience that aligns perfectly with your demonstrated preferences, featuring polished gameplay and thoughtful design choices that make it stand out in its genre.`
    }
  }
}

/**
 * OpenAI service implementation (placeholder)
 */
class OpenAIService implements AIService {
  constructor(private apiKey: string, private model: string = 'gpt-3.5-turbo') {}
  
  async generateRecommendations(prompt: string): Promise<AIRecommendation[]> {
    // TODO: Implement OpenAI API integration
    // For now, fall back to mock service
    console.warn('OpenAI service not implemented yet, using mock service')
    return new MockAIService().generateRecommendations(prompt)
  }
}

/**
 * Claude service implementation (placeholder)
 */
class ClaudeService implements AIService {
  constructor(private apiKey: string, private model: string = 'claude-3-sonnet') {}
  
  async generateRecommendations(prompt: string): Promise<AIRecommendation[]> {
    // TODO: Implement Claude API integration
    // For now, fall back to mock service
    console.warn('Claude service not implemented yet, using mock service')
    return new MockAIService().generateRecommendations(prompt)
  }
}

/**
 * Factory function to create AI service instances
 */
export function createAIService(config: AIServiceConfig): AIService {
  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) throw new Error('OpenAI API key required')
      return new OpenAIService(config.apiKey, config.model)
    
    case 'claude':
      if (!config.apiKey) throw new Error('Claude API key required')
      return new ClaudeService(config.apiKey, config.model)
    
    case 'mock':
    default:
      return new MockAIService()
  }
}

/**
 * Default AI service instance
 */
export const defaultAIService = createAIService({ provider: 'mock' }) 