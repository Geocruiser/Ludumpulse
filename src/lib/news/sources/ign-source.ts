/**
 * IGN News Source Adapter
 * 
 * Scraping configuration for IGN gaming news website.
 * Provides selectors and URL building for game-specific news searches.
 */

import { NewsSource } from '@/types/news'

export const ignNewsSource: NewsSource = {
  id: 'ign',
  name: 'IGN',
  baseUrl: 'https://www.ign.com',
  maxArticles: 15,
  selectors: {
    articleContainer: '.article-item, .jsx-article-item',
    title: '.item-title a, .headline a, h3 a',
    link: '.item-title a, .headline a, h3 a',
    date: '.publish-date, .article-timestamp, time',
    summary: '.item-summary, .article-summary, .excerpt',
    sourceName: 'IGN'
  },
  buildSearchUrl: (gameTitle: string) => {
    const encodedTitle = encodeURIComponent(gameTitle)
    return `https://www.ign.com/search?q=${encodedTitle}&type=article&filter=articles`
  }
} 