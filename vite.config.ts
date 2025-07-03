import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('🔧 Vite Config - Mode:', mode)
  
  return {
    plugins: [
      react(),
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'electron/main.ts',
          onstart({ startup }) {
            startup()
          },
        },
        // Note: Using preload-minimal.js directly (CommonJS) to avoid ES module issues
      ]),
      renderer(),
    ],
    resolve: {
      alias: {
        '@': resolve(fileURLToPath(new URL('./src', import.meta.url))),
        '@/components': resolve(fileURLToPath(new URL('./src/components', import.meta.url))),
        '@/lib': resolve(fileURLToPath(new URL('./src/lib', import.meta.url))),
        '@/hooks': resolve(fileURLToPath(new URL('./src/hooks', import.meta.url))),
        '@/stores': resolve(fileURLToPath(new URL('./src/stores', import.meta.url))),
        '@/types': resolve(fileURLToPath(new URL('./src/types', import.meta.url))),
        '@/styles': resolve(fileURLToPath(new URL('./src/styles', import.meta.url))),
      },
    },
    build: {
      rollupOptions: {
        external: ['electron'],
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      host: 'localhost',
      hmr: {
        port: 3000,
        host: 'localhost',
      },
      cors: true,
    },
    clearScreen: false,
  }
}) 