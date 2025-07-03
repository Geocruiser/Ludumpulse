/**
 * News Page - Main news viewing interface
 * 
 * Displays recent game news with filtering, search, and refresh capabilities.
 * Integrates with the news scraping system and shows AI-enhanced summaries.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Search, Filter, Newspaper, Calendar, ExternalLink, Trash2 } from 'lucide-react'
import { useSearchNews, useTrackedGamesNews, useScrapeAllGamesNews, useCleanupOldNews } from '@/hooks/use-news'
import { useTrackedGames } from '@/hooks/use-games'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ScrapedArticle } from '@/types/news'
import { formatDistanceToNow } from 'date-fns'

export function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Hooks
  const { data: games } = useTrackedGames()
  const { data: trackedGamesNews, isLoading: isLoadingTrackedNews, refetch: refetchTrackedNews } = useTrackedGamesNews(games || [])
  const { data: searchResults, isLoading: isSearching } = useSearchNews(searchQuery)
  const scrapeAllGamesNews = useScrapeAllGamesNews()
  const cleanupOldNews = useCleanupOldNews()

  // Determine which news to display
  const displayedNews: ScrapedArticle[] = searchQuery.trim() 
    ? (searchResults || []) 
    : (trackedGamesNews || [])

  /**
   * Handle manual news refresh
   */
  async function handleRefreshNews() {
    setIsRefreshing(true)
    try {
      await refetchTrackedNews()
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
      await scrapeAllGamesNews.mutateAsync(games)
      // Refresh the tracked games news after scraping
      await refetchTrackedNews()
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * Handle manual cleanup of old articles
   */
  async function handleCleanupOldNews() {
    await cleanupOldNews.mutateAsync(4) // Clean up articles older than 4 days
    // The hook will automatically show a toast and refresh the data
  }



  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Newspaper className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Your Game News</h1>
            <p className="text-muted-foreground">
              Updates, patches & news for your tracked games (prioritizing game updates)
              {games?.length ? (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {games.length} game{games.length === 1 ? '' : 's'} tracked
                </span>
              ) : null}
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
            disabled={isRefreshing || scrapeAllGamesNews.isPending || !games?.length}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Update Game News
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanupOldNews}
            disabled={cleanupOldNews.isPending}
            title="Remove articles older than 4 days to free up space"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup
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
        {(isLoadingTrackedNews || isSearching) && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoadingTrackedNews && !isSearching && displayedNews?.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No specific news found</h3>
                <p className="text-muted-foreground">
                  {searchQuery.trim() 
                    ? 'Try adjusting your search terms' 
                    : games?.length 
                      ? 'No breaking news found for your tracked games. Guides and reviews are filtered out. Try "Update Game News" for fresh articles.' 
                      : 'Add some games to your tracking list to see news that specifically mentions them!'
                  }
                </p>
                {!searchQuery.trim() && games?.length === 0 && (
                  <Button className="mt-4" onClick={() => window.location.href = '/games'}>
                    Track Some Games
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {displayedNews?.map((newsItem, index) => (
          <motion.div
            key={`${newsItem.url}-${index}`}
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
function NewsCard({ newsItem }: { newsItem: ScrapedArticle }) {
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
                <span>{formatNewsDate(newsItem.publishedAt)}</span>
              </div>
              {newsItem.matchedGame && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {newsItem.matchedGame}
                </Badge>
              )}
              {newsItem.relevanceScore && newsItem.relevanceScore > 400 && (
                <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                  Game Update
                </Badge>
              )}
              {newsItem.relevanceScore && newsItem.relevanceScore > 250 && newsItem.relevanceScore <= 400 && (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Direct Match
                </Badge>
              )}
              {newsItem.relevanceScore && newsItem.relevanceScore > 100 && newsItem.relevanceScore <= 250 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Good Match
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
      
      {newsItem.summary && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {newsItem.summary}
          </p>
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

 