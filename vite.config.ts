import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
              fileName: () => 'preload.cjs'
            },
            rollupOptions: {
              external: ['electron']
            }
          },
        },
        onstart(options: { reload: () => void }) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
          // instead of restarting the entire Electron App.
          options.reload()
        },
      },
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
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  clearScreen: false,
}) 