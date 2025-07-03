/**
 * Suggestions Page Component
 *
 * Displays a list of recommended games based on the user's existing tracked
 * games. Users can quickly accept a suggestion (which will add the game to
 * their tracked list) or dismiss it.
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  XCircle,
  Check,
  RefreshCw,
  Sparkles,
  Eye,
  RotateCcw,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useGameSuggestions, useUpdateSuggestionStatus } from '@/hooks/use-game-suggestions'
import { getDismissedSuggestions, undismissSuggestion } from '@/lib/suggestions/dismissed-suggestions-store'

/**
 * Individual suggestion card UI.
 */
function SuggestionCard({
  title,
  justification,
  status,
  onAccept,
  onDismiss,
}: {
  title: string
  justification?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED'
  onAccept: () => void
  onDismiss: () => void
}) {
  const statusBadge = {
    PENDING: { label: 'Pending', color: 'secondary' as const },
    ACCEPTED: { label: 'Accepted', color: 'default' as const },
    DISMISSED: { label: 'Dismissed', color: 'destructive' as const },
  }[status]

  // Check if this is a trending game based on the justification text
  const isTrending = justification?.includes('gaining significant momentum') || 
                     justification?.includes('trending') || 
                     justification?.includes('capturing players\' attention')

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg truncate">
            <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            {title}
            {isTrending && (
              <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
          </CardTitle>
          <Badge variant={statusBadge.color}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {justification && (
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <Sparkles className="h-3 w-3" />
              AI-Powered Recommendation
              {isTrending && (
                <span className="text-green-600 ml-2">• Trending Pick</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{justification}</p>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="flex gap-2 mt-auto">
            <Button size="sm" onClick={onAccept} className="flex items-center gap-1">
              <Check className="h-4 w-4" /> Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDismiss}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" /> Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Main SuggestionsPage exported component.
 */
export function SuggestionsPage() {
  const { data: suggestions, isLoading, refetch, isFetching } = useGameSuggestions()
  const updateStatus = useUpdateSuggestionStatus()
  const [showDismissed, setShowDismissed] = React.useState(false)
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState(getDismissedSuggestions())

  const handleAccept = (id: string, title: string) => {
    updateStatus.mutate({ id, status: 'ACCEPTED', title })
  }

  const handleDismiss = (id: string, title: string) => {
    updateStatus.mutate({ id, status: 'DISMISSED', title }, {
      onSuccess: () => {
        // Refresh dismissed suggestions list
        setDismissedSuggestions(getDismissedSuggestions())
      }
    })
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleUndismiss = (gameTitle: string) => {
    undismissSuggestion(gameTitle)
    setDismissedSuggestions(getDismissedSuggestions())
    refetch() // Refresh suggestions to potentially show the undismissed game
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Game Suggestions</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Personalized recommendations based on your tracked games
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Generate New
          </Button>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-medium mb-2">No suggestions yet</p>
            <p className="text-muted-foreground">
              Track more games to get AI-powered recommendations tailored to your preferences!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            className="text-3xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            AI Game Suggestions
          </motion.h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Personalized recommendations based on your tracked games
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDismissed(!showDismissed)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {showDismissed ? 'Hide' : 'Show'} Dismissed ({dismissedSuggestions.length})
          </Button>
          <Button onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Generate New
          </Button>
        </div>
      </div>

      {showDismissed ? (
        // Dismissed suggestions section
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Dismissed Suggestions</h2>
          {dismissedSuggestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No dismissed suggestions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dismissedSuggestions.map((dismissed, idx) => (
                <motion.div
                  key={dismissed.gameTitle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{dismissed.gameTitle}</h3>
                          <p className="text-xs text-muted-foreground">
                            Dismissed {new Date(dismissed.dismissedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUndismiss(dismissed.gameTitle)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Active suggestions section
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestions.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <SuggestionCard
                title={s.game_title}
                justification={s.justification}
                status={s.status}
                onAccept={() => handleAccept(s.id, s.game_title)}
                onDismiss={() => handleDismiss(s.id, s.game_title)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
} 