/**
 * Game Summaries Component
 * 
 * Displays AI-generated summaries of recent news for tracked games.
 * Shows the last 3 days of news with sentiment analysis and key topics.
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Shuffle,
  Sparkles,
  Clock,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useGameSummaries, useRefreshGameSummaries } from '@/hooks/use-game-summaries'
import { TrackedGame } from '@/hooks/use-games'
import { GameNewsSummary } from '@/lib/news/ai-summary-service'
import { ScrapedArticle } from '@/types/news'
import { formatDistanceToNow } from 'date-fns'

/**
 * Helper function to check if an article is about updates or patches
 */
function isUpdateOrPatchArticle(article: ScrapedArticle): boolean {
  const text = `${article.title} ${article.summary || ''}`.toLowerCase()
  
  const updateKeywords = [
    'patch', 'update', 'hotfix', 'patch notes', 'changelog', 'fixes',
    'version', 'build', 'balance', 'nerf', 'buff', 'rework', 'overhaul',
    'release notes', 'what\'s new', 'latest update', 'new features',
    'content update', 'game update', 'title update', 'maintenance',
    'bug fix', 'stability', 'performance', 'optimization', 'tweaks',
    'balance changes', 'gameplay changes', 'system update'
  ]
  
  return updateKeywords.some(keyword => text.includes(keyword))
}

interface GameSummariesProps {
  games: TrackedGame[]
  className?: string
}

/**
 * Individual game summary card component
 */
function GameSummaryCard({ summary }: { summary: GameNewsSummary }) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'mixed':
        return <Shuffle className="h-4 w-4 text-yellow-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {summary.gameTitle}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getSentimentIcon(summary.sentiment)}
            <Badge className={getSentimentColor(summary.sentiment)}>
              {summary.sentiment}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{summary.articlesCount} articles</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(summary.lastUpdated))} ago</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Summary */}
        {summary.summary ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Game Changes Summary
            </div>
            <div className="text-sm leading-relaxed">
              {summary.summary.startsWith('NO GAME CHANGES') ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span className="text-muted-foreground">{summary.summary}</span>
                </div>
              ) : summary.summary.startsWith('GAME CHANGES') ? (
                <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-800 dark:text-green-200">{summary.summary}</span>
                </div>
              ) : (
                <p className="text-muted-foreground">{summary.summary}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <Minus className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-muted-foreground">
                No game updates in the {summary.timeframe}
              </p>
            </div>
          </div>
        )}
        
        {/* Key Topics */}
        {summary.keyTopics.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Key Topics</div>
            <div className="flex flex-wrap gap-1">
              {summary.keyTopics.map((topic) => (
                <Badge key={topic} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
                 {/* Recent Articles */}
         {summary.articles.length > 0 && (
           <div className="space-y-2">
             <div className="text-sm font-medium">Recent Articles</div>
             <div className="space-y-1">
               {summary.articles.slice(0, 2).map((article, index) => {
                 // Check if this is an update/patch article
                 const isUpdateArticle = isUpdateOrPatchArticle(article)
                 
                 return (
                   <div key={index} className="text-xs">
                     <div className="flex items-start gap-2">
                       <a 
                         href={article.url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 line-clamp-1 flex items-center gap-1 flex-1"
                       >
                         <span className="truncate">{article.title}</span>
                         <ExternalLink className="h-3 w-3 flex-shrink-0" />
                       </a>
                       {isUpdateArticle && (
                         <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1 py-0">
                           UPDATE
                         </Badge>
                       )}
                     </div>
                     <div className="text-muted-foreground">
                       {article.source} • {article.publishedAt ? 
                         formatDistanceToNow(new Date(article.publishedAt)) + ' ago' : 
                         'No date'
                       }
                     </div>
                   </div>
                 )
               })}
               {summary.articles.length > 2 && (
                 <div className="text-xs text-muted-foreground">
                   +{summary.articles.length - 2} more articles
                 </div>
               )}
             </div>
           </div>
         )}
      </CardContent>
    </Card>
  )
}

/**
 * Main game summaries component
 */
export function GameSummaries({ games, className }: GameSummariesProps) {
  const { data: summaries, isLoading, error } = useGameSummaries(games)
  const refreshSummaries = useRefreshGameSummaries()

  const handleRefresh = () => {
    refreshSummaries.mutate(games)
  }

  if (!games.length) {
    return null
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-2">Failed to load game summaries</p>
          <p className="text-muted-foreground text-sm mb-4">
            There was an error generating AI summaries.
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Filter out games with no news articles and organize by release status
  const summariesWithNews = summaries?.filter(summary => summary.articlesCount > 0) || []
  
  // Create a map to look up release status for each game
  const gameReleaseMap = new Map(games.map(game => [game.title, game.release_status]))
  
  // Separate and sort summaries by release status
  const releasedGames = summariesWithNews
    .filter(summary => gameReleaseMap.get(summary.gameTitle) === 'RELEASED')
    .sort((a, b) => a.gameTitle.localeCompare(b.gameTitle))
  
  const unreleasedGames = summariesWithNews
    .filter(summary => gameReleaseMap.get(summary.gameTitle) === 'UNRELEASED')
    .sort((a, b) => a.gameTitle.localeCompare(b.gameTitle))

  const allSummariesWithNews = [...releasedGames, ...unreleasedGames]

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            Game Changes Tracker
          </h2>
          <p className="text-muted-foreground text-sm">
            Direct updates on patches, updates, and changes to your tracked games
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshSummaries.isPending}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshSummaries.isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground mt-4">
                Generating AI summaries...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a moment for {games.length} games
              </p>
            </div>
          </CardContent>
        </Card>
      ) : allSummariesWithNews.length === 0 ? (
        /* No News State */
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Calendar className="h-8 w-8 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No Recent News</h3>
                <p className="text-muted-foreground mb-4">
                  None of your tracked games have news articles from the last 3 days.
                </p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Released Games Section */}
          {releasedGames.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  Released Games
                </h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {releasedGames.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {releasedGames.map((summary, index) => (
                  <motion.div
                    key={summary.gameTitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    <GameSummaryCard summary={summary} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Unreleased Games Section */}
          {unreleasedGames.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                  Upcoming Games
                </h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {unreleasedGames.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unreleasedGames.map((summary, index) => (
                  <motion.div
                    key={summary.gameTitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: (releasedGames.length + index) * 0.1 }}
                  >
                    <GameSummaryCard summary={summary} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {allSummariesWithNews.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {allSummariesWithNews.filter(s => s.summary && !s.summary.startsWith('NO GAME CHANGES')).length} of {allSummariesWithNews.length} games with news have recent updates or changes
          </p>
          {summaries && summaries.length > allSummariesWithNews.length && (
            <p className="text-xs text-muted-foreground mt-1">
              {summaries.length - allSummariesWithNews.length} games hidden (no recent news)
            </p>
          )}
        </div>
      )}
    </div>
  )
} 