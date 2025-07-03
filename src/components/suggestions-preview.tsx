/**
 * Suggestions Preview Component
 *
 * A compact preview of AI-generated game suggestions for display on the dashboard.
 * Shows top 3 suggestions with quick accept/dismiss actions.
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Check,
  XCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useGameSuggestions, useUpdateSuggestionStatus } from '@/hooks/use-game-suggestions'

interface SuggestionsPreviewProps {
  onViewAll: () => void
}

/**
 * Compact suggestion card for dashboard preview
 */
function PreviewSuggestionCard({
  title,
  justification,
  onAccept,
  onDismiss,
}: {
  title: string
  justification?: string | null
  onAccept: () => void
  onDismiss: () => void
}) {
  // Check if this is a trending game based on the justification text
  const isTrending = justification?.includes('gaining significant momentum') || 
                     justification?.includes('trending') || 
                     justification?.includes('capturing players\' attention')

  return (
    <div className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            {isTrending && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>
          {justification && (
            <p className="text-xs text-muted-foreground line-clamp-4 mt-1 leading-relaxed">
              {justification}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onAccept} className="h-6 w-6 p-0">
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss} className="h-6 w-6 p-0">
            <XCircle className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Main suggestions preview component
 */
export function SuggestionsPreview({ onViewAll }: SuggestionsPreviewProps) {
  const { data: suggestions, isLoading } = useGameSuggestions(3) // Only get top 3 for preview
  const updateStatus = useUpdateSuggestionStatus()

  const handleAccept = (id: string, title: string) => {
    updateStatus.mutate({ id, status: 'ACCEPTED', title })
  }

  const handleDismiss = (id: string, title: string) => {
    updateStatus.mutate({ id, status: 'DISMISSED', title })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Game Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Game Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Track more games to get personalized AI recommendations!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Game Suggestions
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <PreviewSuggestionCard
              title={suggestion.game_title}
              justification={suggestion.justification}
              onAccept={() => handleAccept(suggestion.id, suggestion.game_title)}
              onDismiss={() => handleDismiss(suggestion.id, suggestion.game_title)}
            />
          </motion.div>
        ))}
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewAll}
          className="w-full mt-4 flex items-center gap-2"
        >
          View All Suggestions
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
} 