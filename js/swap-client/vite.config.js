import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@portaldefi/core',
      '@portaldefi/sdk'
    ]
  },
  resolve: {
    alias: {
      $fonts: resolve('./public')
    }
  },
  build: {
    commonjsOptions: {
      include: [/core/, /sdk/, /node_modules/]
    },
    minifiy: false,
    rollupOptions: {
      onwarn (warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
        warning.message.includes('\'use client\'')) {
          return
        }
        warn(warning)
      }
    }
  }
})
