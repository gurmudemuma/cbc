import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          ['@emotion/babel-plugin', { sourceMap: true, autoLabel: 'dev-only' }]
        ],
      },
    })
  ],
  resolve: {
    alias: {
      '@mui/material/Unstable_Grid2': path.resolve(__dirname, 'node_modules/@mui/material/Unstable_Grid2/index.js'),
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/x-date-pickers',
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query'
    ],
    force: true
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    open: true,
    proxy: {
      '/api/approvals': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/fx-rates': { target: 'http://localhost:3002', changeOrigin: true },
      '/api/bookings': { target: 'http://localhost:3003', changeOrigin: true },
      '/api/quality': { target: 'http://localhost:3004', changeOrigin: true },
      '/api/contracts': { target: 'http://localhost:3005', changeOrigin: true },
      '/api/clearance': { target: 'http://localhost:3006', changeOrigin: true },
      '/api/documents': { target: 'http://localhost:3001', changeOrigin: true },
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
})
