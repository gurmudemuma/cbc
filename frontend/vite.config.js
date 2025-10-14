import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react({
    jsxImportSource: '@emotion/react',
    babel: {
      plugins: ['@emotion/babel-plugin'],
    },
  })],
  resolve: {
    alias: {
      '@mui/material/Unstable_Grid2': path.resolve(__dirname, 'node_modules/@mui/material/Unstable_Grid2/index.js')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api/exporter': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exporter/, '/api')
      },
      '/api/nationalbank': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nationalbank/, '/api')
      },
      '/api/ncat': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ncat/, '/api')
      },
      '/api/shipping': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shipping/, '/api')
      },
      // Default /api routes to exporter backend (port 3001)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})