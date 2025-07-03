/* eslint-disable */
/**
 * Minimal Preload Script for Testing (CommonJS .cjs)
 */

const { contextBridge, ipcRenderer } = require('electron')

console.log('MINIMAL PRELOAD SCRIPT (.cjs) STARTING')

try {
  contextBridge.exposeInMainWorld('minimalTest', {
    getMessage: () => 'Minimal preload .cjs is working!',
    getTime: () => new Date().toISOString(),
  })
  console.log('minimalTest exposed successfully (.cjs)')
} catch (error) {
  console.error('Failed to expose minimalTest (.cjs):', error)
}

try {
  contextBridge.exposeInMainWorld('igdbApi', {
    isConfigured: () => ipcRenderer.invoke('igdb:is-configured'),
  })
  console.log('igdbApi exposed successfully (.cjs)')
} catch (error) {
  console.error('Failed to expose igdbApi (.cjs):', error)
} 