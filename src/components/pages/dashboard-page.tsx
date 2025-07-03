/**
 * Dashboard Page Component
 * 
 * Main dashboard with overview, AI news summaries, and quick actions for tracked games.
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Gamepad2, 
  Newspaper, 
  Sparkles,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameSummaries } from '@/components/game-summaries'
import { SuggestionsPreview } from '@/components/suggestions-preview'
import { useTrackedGames } from '@/hooks/use-games'
import { useGameStore } from '@/lib/stores/game-store'

interface DashboardPageProps {
  onNavigateTo: (page: 'games' | 'news' | 'suggestions') => void
}

/**
 * Dashboard stats card component
 */
function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  className = '' 
}: {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Quick action card component
 */
function QuickActionCard({
  title,
  description,
  buttonText,
  onClick,
  icon: Icon
}: {
  title: string
  description: string
  buttonText: string
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {description}
            </p>
            <Button onClick={onClick} variant="outline" size="sm">
              {buttonText}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main dashboard page component
 */
export function DashboardPage({ onNavigateTo }: DashboardPageProps) {
  const { data: games } = useTrackedGames()
  const { openAddGameModal } = useGameStore()

  const trackedGamesCount = games?.length || 0
  const releasedGamesCount = games?.filter(game => game.release_status === 'RELEASED').length || 0
  const unreleasedGamesCount = games?.filter(game => game.release_status === 'UNRELEASED').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <motion.h1 
          className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome to Ludumpulse
        </motion.h1>
        <p className="text-muted-foreground text-lg">
          Your AI-powered gaming news dashboard
        </p>
      </div>

      {/* Quick Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatsCard
          title="Tracked Games"
          value={trackedGamesCount}
          description="Games you're following"
          icon={Gamepad2}
        />
        <StatsCard
          title="Released Games"
          value={releasedGamesCount}
          description="Available to play"
          icon={TrendingUp}
        />
        <StatsCard
          title="Upcoming Games"
          value={unreleasedGamesCount}
          description="Coming soon"
          icon={Calendar}
        />
      </motion.div>

      {/* AI News Summaries Section */}
      {games && games.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GameSummaries games={games} />
          <SuggestionsPreview onViewAll={() => onNavigateTo('suggestions')} />
        </motion.div>
      ) : (
        /* Getting Started Section */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Get Started with AI News Summaries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Track your favorite games to see if there are any updates, patches, or changes coming to them. 
                Get direct answers about what's actually changing in your games - no fluff, just the facts.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Game Changes Only
                </Badge>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Patches & Updates
                </Badge>
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  <Calendar className="h-3 w-3 mr-1" />
                  Last 3 Days
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard
            title="Track New Games"
            description="Add games you're interested in to start receiving AI-powered news summaries."
            buttonText={trackedGamesCount > 0 ? "Manage Games" : "Add Your First Game"}
            onClick={() => trackedGamesCount > 0 ? onNavigateTo('games') : openAddGameModal()}
            icon={Gamepad2}
          />
          <QuickActionCard
            title="Browse Latest News"
            description="View and search the latest gaming news from IGN, GameSpot, and Polygon."
            buttonText="View News"
            onClick={() => onNavigateTo('news')}
            icon={Newspaper}
          />
        </div>
      </motion.div>

      {/* Recent Activity Placeholder */}
      {games && games.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Your recent news and game tracking activity will appear here.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
} 