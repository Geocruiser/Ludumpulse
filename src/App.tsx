/**
 * Main Application Component
 * 
 * This is the root component that sets up providers, routing, and the overall app structure.
 */

import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AppRouter } from '@/components/app-router'
import { initializeNewsService } from '@/lib/news/news-service'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  // Initialize news service and cleanup old articles on app startup
  useEffect(() => {
    initializeNewsService()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="ludumpulse-ui-theme"
      >
        <AuthProvider>
          <AppRouter />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App 