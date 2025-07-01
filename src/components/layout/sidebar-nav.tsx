/**
 * Sidebar Navigation Component
 * 
 * This component provides the sidebar navigation for the main application.
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Gamepad2, 
  Newspaper, 
  Lightbulb, 
  Bell, 
  Settings 
} from 'lucide-react'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Tracked Games',
    href: '/games',
    icon: Gamepad2,
  },
  {
    title: 'News',
    href: '/news',
    icon: Newspaper,
  },
  {
    title: 'Suggestions',
    href: '/suggestions',
    icon: Lightbulb,
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

type PageType = 'dashboard' | 'games' | 'news' | 'suggestions' | 'notifications' | 'settings'

interface SidebarNavProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
}

/**
 * Sidebar navigation with main application links
 */
export function SidebarNav({ currentPage, onPageChange }: SidebarNavProps) {
  const getPageType = (href: string): PageType => {
    switch (href) {
      case '/': return 'dashboard'
      case '/games': return 'games'
      case '/news': return 'news'
      case '/suggestions': return 'suggestions'
      case '/notifications': return 'notifications'
      case '/settings': return 'settings'
      default: return 'dashboard'
    }
  }

  return (
    <aside className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const pageType = getPageType(item.href)
          const isActive = currentPage === pageType
          
          return (
            <Button
              key={item.href}
              variant="ghost"
              onClick={() => onPageChange(pageType)}
              className={cn(
                "w-full justify-start",
                isActive 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
} 