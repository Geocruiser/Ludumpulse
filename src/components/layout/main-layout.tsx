/**
 * Main Layout Component
 * 
 * This component provides the main layout for authenticated users with navigation.
 */

'use client'

import React from 'react'
import { TopBar } from '@/components/layout/top-bar'
import { SidebarNav } from '@/components/layout/sidebar-nav'

/**
 * Main application layout with top bar and sidebar navigation
 */
export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Welcome to Ludumpulse</h1>
            <div className="grid gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
                <p className="text-muted-foreground">
                  Start tracking your favorite games and get AI-powered news summaries.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-2">Track Games</h3>
                  <p className="text-muted-foreground text-sm">
                    Add games you're interested in to start receiving news updates.
                  </p>
                </div>
                
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-2">News Summaries</h3>
                  <p className="text-muted-foreground text-sm">
                    Get AI-generated summaries of the latest gaming news.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 