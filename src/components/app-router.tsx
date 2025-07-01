/**
 * Application Router Component
 * 
 * This component handles the main routing logic and authentication flow.
 */

'use client'

import React from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AuthPages } from '@/components/auth/auth-pages'
import { MainLayout } from '@/components/layout/main-layout'

/**
 * Main application router that determines which UI to show based on auth state
 */
export function AppRouter() {
  const { user, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show authentication pages if user is not signed in
  if (!user) {
    return <AuthPages />
  }

  // Show main application if user is authenticated
  return <MainLayout />
} 