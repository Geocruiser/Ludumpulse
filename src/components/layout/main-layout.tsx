/**
 * Main Layout Component
 * 
 * This component provides the main layout for authenticated users with navigation.
 */

'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/top-bar'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { TrackedGamesPage } from '@/components/pages/tracked-games-page'
import { NewsPage } from '@/components/pages/news-page'
import { AddGameModal } from '@/components/modals/add-game-modal'
import { GameDetailModal } from '@/components/modals/game-detail-modal'

type PageType = 'dashboard' | 'games' | 'news' | 'suggestions' | 'notifications' | 'settings'

/**
 * Main application layout with top bar and sidebar navigation
 */
export function MainLayout() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'games':
        return <TrackedGamesPage />
      case 'news':
        return <NewsPage />
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome to Ludumpulse</h1>
            <div className="grid gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
                <p className="text-muted-foreground">
                  Start tracking your favorite games and get AI-powered news summaries from across the web.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-2">Track Games</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Add games you're interested in to start receiving news updates.
                  </p>
                  <button
                    onClick={() => setCurrentPage('games')}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    Go to Tracked Games →
                  </button>
                </div>
                
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-2">News Scraping</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    View and scrape the latest gaming news from IGN, GameSpot, and Polygon.
                  </p>
                  <button
                    onClick={() => setCurrentPage('news')}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    Go to News →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        <SidebarNav currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderCurrentPage()}
          </div>
        </main>
      </div>
      
      {/* Global Modals */}
      <AddGameModal />
      <GameDetailModal />
    </div>
  )
} 