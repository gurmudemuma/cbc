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
      // Exporter API - External exporters (port 3007)
      '/api/exporter': {
        target: 'http://localhost:3007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exporter/, '/api/exporter')
      },
      // Banker API - Banking operations (port 3001)
      '/api/banker': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/banker/, '/api')
      },
      // NB Regulatory API - National Bank regulatory (port 3002)
      '/api/nb-regulatory': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nb-regulatory/, '/api')
      },
      // NCAT API - Quality assurance (port 3003)
      '/api/ncat': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ncat/, '/api')
      },
      // Shipping Line API (port 3004)
      '/api/shipping': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shipping/, '/api')
      },
      // Custom Authorities API (port 3005)
      '/api/customs': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/customs/, '/api')
      },
      // Legacy support - redirect to banker
      '/api-portal': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-portal/, '/api')
      },
      // Default /api routes to banker (port 3001)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
