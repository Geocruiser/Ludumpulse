/**
 * Main Layout Component
 * 
 * This component provides the main layout for authenticated users with navigation.
 */

'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/top-bar'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { TrackedGamesPage } from '@/components/pages/tracked-games-page'
import { NewsPage } from '@/components/pages/news-page'
import { AddGameModal } from '@/components/modals/add-game-modal'
import { GameDetailModal } from '@/components/modals/game-detail-modal'
import { SuggestionsPage } from '@/components/pages/suggestions-page'

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
      case 'suggestions':
        return <SuggestionsPage />
      case 'dashboard':
      default:
        return <DashboardPage onNavigateTo={setCurrentPage} />
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