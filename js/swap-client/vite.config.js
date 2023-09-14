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
  },
  server: {
    proxy: {
      '/api': {
        target: 'ws://localhost:42297',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url)
          })
        }
      }
    }
  }
})
