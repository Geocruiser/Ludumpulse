/**
 * Minimal Preload Script for Testing
 * This script only includes basic functionality to test if preload works
 */

import { contextBridge, ipcRenderer } from 'electron'

// Start with very basic debugging
console.log('MINIMAL PRELOAD SCRIPT STARTING')

// Simple test exposure
try {
  contextBridge.exposeInMainWorld('minimalTest', {
    getMessage: () => 'Minimal preload is working!',
    getTime: () => new Date().toISOString()
  })
  console.log('minimalTest exposed successfully')
} catch (error) {
  console.error('Failed to expose minimalTest:', error)
}

// Basic IGDB API (minimal version)
try {
  contextBridge.exposeInMainWorld('igdbApi', {
    isConfigured: () => ipcRenderer.invoke('igdb:is-configured'),
    searchGames: (query: string, limit?: number) => ipcRenderer.invoke('igdb:search-games', query, limit)
  })
  console.log('igdbApi exposed successfully')
} catch (error) {
  console.error('Failed to expose igdbApi:', error)
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('MINIMAL PRELOAD: DOM Ready')
  console.log('minimalTest available:', typeof (window as any).minimalTest)
  console.log('igdbApi available:', typeof (window as any).igdbApi)
  
  if ((window as any).minimalTest) {
    console.log('Test message:', (window as any).minimalTest.getMessage())
  }
})

console.log('MINIMAL PRELOAD SCRIPT COMPLETED') 