/**
 * Dismissed Suggestions Store
 *
 * Manages locally dismissed suggestions to prevent them from appearing again.
 * Uses localStorage to persist dismissals across sessions.
 */

const DISMISSED_SUGGESTIONS_KEY = 'ludumpulse_dismissed_suggestions'

export interface DismissedSuggestion {
  gameTitle: string
  dismissedAt: string
  userId?: string
}

/**
 * Get all dismissed suggestions from localStorage
 */
export function getDismissedSuggestions(): DismissedSuggestion[] {
  try {
    const stored = localStorage.getItem(DISMISSED_SUGGESTIONS_KEY)
    if (!stored) return []
    
    const dismissed: DismissedSuggestion[] = JSON.parse(stored)
    
    // Clean up old dismissals (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const filtered = dismissed.filter(item => 
      new Date(item.dismissedAt) > thirtyDaysAgo
    )
    
    // Update storage if we filtered anything
    if (filtered.length !== dismissed.length) {
      localStorage.setItem(DISMISSED_SUGGESTIONS_KEY, JSON.stringify(filtered))
    }
    
    return filtered
  } catch (error) {
    console.error('Error reading dismissed suggestions:', error)
    return []
  }
}

/**
 * Add a suggestion to the dismissed list
 */
export function dismissSuggestion(gameTitle: string, userId?: string): void {
  try {
    const dismissed = getDismissedSuggestions()
    
    // Check if already dismissed
    const alreadyDismissed = dismissed.some(item => 
      item.gameTitle.toLowerCase() === gameTitle.toLowerCase()
    )
    
    if (alreadyDismissed) return
    
    // Add new dismissal
    const newDismissal: DismissedSuggestion = {
      gameTitle,
      dismissedAt: new Date().toISOString(),
      userId
    }
    
    dismissed.push(newDismissal)
    localStorage.setItem(DISMISSED_SUGGESTIONS_KEY, JSON.stringify(dismissed))
  } catch (error) {
    console.error('Error dismissing suggestion:', error)
  }
}

/**
 * Check if a game title has been dismissed
 */
export function isSuggestionDismissed(gameTitle: string): boolean {
  const dismissed = getDismissedSuggestions()
  return dismissed.some(item => 
    item.gameTitle.toLowerCase() === gameTitle.toLowerCase()
  )
}

/**
 * Remove a dismissal (for testing or if user wants to see suggestion again)
 */
export function undismissSuggestion(gameTitle: string): void {
  try {
    const dismissed = getDismissedSuggestions()
    const filtered = dismissed.filter(item => 
      item.gameTitle.toLowerCase() !== gameTitle.toLowerCase()
    )
    localStorage.setItem(DISMISSED_SUGGESTIONS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error undismissing suggestion:', error)
  }
}

/**
 * Clear all dismissed suggestions (for testing)
 */
export function clearDismissedSuggestions(): void {
  try {
    localStorage.removeItem(DISMISSED_SUGGESTIONS_KEY)
  } catch (error) {
    console.error('Error clearing dismissed suggestions:', error)
  }
} 