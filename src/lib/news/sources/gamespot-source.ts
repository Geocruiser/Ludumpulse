/**
 * GameSpot News Source Adapter
 * 
 * Scraping configuration for GameSpot gaming news website.
 * Provides selectors and URL building for game-specific news searches.
 */

import { NewsSource } from '@/types/news'

export const gamespotNewsSource: NewsSource = {
  id: 'gamespot',
  name: 'GameSpot',
  baseUrl: 'https://www.gamespot.com',
  maxArticles: 15,
  selectors: {
    articleContainer: '.media-article, .news-river-article',
    title: '.media-title a, .news-river-title a, h3 a',
    link: '.media-title a, .news-river-title a, h3 a',
    date: '.media-date, .news-river-date, .publish-date',
    summary: '.media-summary, .news-river-summary, .article-summary',
    sourceName: 'GameSpot'
  },
  buildSearchUrl: (gameTitle: string) => {
    const encodedTitle = encodeURIComponent(gameTitle)
    return `https://www.gamespot.com/search/?q=${encodedTitle}&i=news`
  }
} 