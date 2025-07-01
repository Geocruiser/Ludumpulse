/**
 * News Page - Main news viewing interface
 * 
 * Displays recent game news with filtering, search, and refresh capabilities.
 * Integrates with the news scraping system and shows AI-enhanced summaries.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Search, Filter, Newspaper, Calendar, ExternalLink } from 'lucide-react'
import { useRecentNews, useSearchNews, useScrapeGameNews } from '@/hooks/use-news'
import { useTrackedGames } from '@/hooks/use-games'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { NewsItem } from '@/types/news'
import { formatDistanceToNow } from 'date-fns'

export function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Hooks
  const { data: recentNews, isLoading: isLoadingNews, refetch: refetchNews } = useRecentNews(50)
  const { data: searchResults, isLoading: isSearching } = useSearchNews(searchQuery, selectedGameId)
  const { data: games } = useTrackedGames()
  const scrapeGameNews = useScrapeGameNews()

  // Determine which news to display
  const displayedNews = searchQuery.trim() ? searchResults : recentNews

  /**
   * Handle manual news refresh
   */
  async function handleRefreshNews() {
    setIsRefreshing(true)
    try {
      await refetchNews()
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * Handle scraping news for all tracked games
   */
  async function handleScrapeAllNews() {
    if (!games?.length) return

    setIsRefreshing(true)
    try {
      // Scrape news for each tracked game
      const scrapePromises = games.map(game =>
        scrapeGameNews.mutateAsync({
          gameId: game.id,
          gameTitle: game.title
        })
      )

      await Promise.allSettled(scrapePromises)
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * Format news item date
   */
  function formatNewsDate(dateString: string | null): string {
    if (!dateString) return 'Unknown date'
    
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return 'Invalid date'
    }
  }

  /**
   * Get sentiment badge color
   */
  function getSentimentColor(sentiment: string | null): string {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'negative': return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'neutral': return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Newspaper className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Game News</h1>
            <p className="text-muted-foreground">
              Latest gaming news from across the web
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshNews}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleScrapeAllNews}
            disabled={isRefreshing || scrapeGameNews.isPending}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Scrape All News
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                <SelectTrigger>
                  <SelectValue placeholder="All games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All games</SelectItem>
                  {games?.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Grid */}
      <div className="space-y-4">
        {(isLoadingNews || isSearching) && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoadingNews && !isSearching && displayedNews?.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No news found</h3>
                <p className="text-muted-foreground">
                  {searchQuery.trim() 
                    ? 'Try adjusting your search terms' 
                    : 'Start by scraping news for your tracked games'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {displayedNews?.map((newsItem, index) => (
          <motion.div
            key={newsItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NewsCard newsItem={newsItem} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/**
 * Individual news item card component
 */
function NewsCard({ newsItem }: { newsItem: NewsItem }) {
  /**
   * Get game title from newsItem if available
   */
  function getGameTitle(): string | null {
    // @ts-ignore - This might have joined data from the query
    return newsItem.tracked_games?.title || null
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between space-x-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg leading-tight">
              {newsItem.title}
            </CardTitle>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <Badge variant="secondary">{newsItem.source}</Badge>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(newsItem.published_at || newsItem.created_at), { addSuffix: true })}</span>
              </div>
              {getGameTitle() && (
                <Badge variant="outline">{getGameTitle()}</Badge>
              )}
              {newsItem.sentiment && (
                <Badge className={getSentimentColor(newsItem.sentiment)}>
                  {newsItem.sentiment}
                </Badge>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardHeader>
      
      {(newsItem.ai_summary || newsItem.summary) && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {newsItem.ai_summary || newsItem.summary}
          </p>
          {newsItem.ai_summary && newsItem.summary && newsItem.ai_summary !== newsItem.summary && (
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Original summary
              </summary>
              <p className="text-xs text-muted-foreground mt-2">
                {newsItem.summary}
              </p>
            </details>
          )}
        </CardContent>
      )}
    </Card>
  )
}

/**
 * Format news date helper
 */
function formatNewsDate(dateString: string | null): string {
  if (!dateString) return 'Unknown date'
  
  try {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Get sentiment badge color helper
 */
function getSentimentColor(sentiment: string | null): string {
  switch (sentiment) {
    case 'positive': return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'negative': return 'bg-red-100 text-red-800 hover:bg-red-200'
    case 'neutral': return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
} 