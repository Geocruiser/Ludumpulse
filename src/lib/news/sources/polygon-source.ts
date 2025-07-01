/**
 * Polygon News Source Adapter
 * 
 * Scraping configuration for Polygon gaming news website.
 * Provides selectors and URL building for game-specific news searches.
 */

import { NewsSource } from '@/types/news'

export const polygonNewsSource: NewsSource = {
  id: 'polygon',
  name: 'Polygon',
  baseUrl: 'https://www.polygon.com',
  maxArticles: 15,
  selectors: {
    articleContainer: '.c-entry-box, .c-compact-river__entry',
    title: '.c-entry-box--compact__title a, .c-entry-box__title a',
    link: '.c-entry-box--compact__title a, .c-entry-box__title a',
    date: '.c-byline__item time, .c-entry-box__meta time',
    summary: '.c-entry-box__dek, .c-entry-summary',
    sourceName: 'Polygon'
  },
  buildSearchUrl: (gameTitle: string) => {
    const encodedTitle = encodeURIComponent(gameTitle)
    return `https://www.polygon.com/search?q=${encodedTitle}`
  }
} 