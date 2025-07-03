/**
 * Mock News Data
 * 
 * This file contains mock news articles for fallback purposes when the NewsAPI fails or is rate-limited.
 * This ensures the application remains usable for testing and demonstration even without API access.
 */
import { ScrapedArticle } from '@/types/news'

export const mockNewsData: ScrapedArticle[] = [
  {
    title: "Community-Driven 'Project Nova' Revives Classic Galactic Warfare",
    url: '#',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    summary:
      "A passionate team of modders has launched 'Project Nova', a community-led initiative to restore and enhance the beloved but defunct online shooter 'Galactic Warfare'. The project already has thousands of players.",
    source: 'Community Times',
  },
  {
    title: "Indie Gem 'Pixel Prowler' Hits 1 Million Sales on Steam",
    url: '#',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    summary:
      "'Pixel Prowler', a stealth-action game developed by a solo developer, has surpassed 1 million copies sold. Its success highlights the power of creative game design and community support.",
    source: 'IndieGames Weekly',
  },
  {
    title: 'Upcoming "Cyber Odyssey" Expansion "Neon Shadows" Details Leaked',
    url: '#',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    summary:
      "A massive leak has revealed new classes, a sprawling new city district, and a dramatic storyline for the 'Neon Shadows' expansion of the popular MMORPG 'Cyber Odyssey'. The developer has yet to comment.",
    source: 'GameLeaks Central',
  },
  {
    title: "Esports League for 'Arena Champions' Announces $500,000 Prize Pool",
    url: '#',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    summary:
      "The official esports league for the hero shooter 'Arena Champions' is back with its biggest season yet, featuring a $500,000 prize pool and a global tournament circuit.",
    source: 'Esports Insider',
  },
  {
    title: "Retro Revival: 'Dungeon Delve HD' Remaster Coming to Consoles",
    url: '#',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    summary:
      "The classic 16-bit RPG 'Dungeon Delve' is getting a full HD remaster with quality-of-life improvements and a new orchestrated soundtrack. It's set to release on all major consoles this fall.",
    source: 'RetroGamer Hub',
  },
] 