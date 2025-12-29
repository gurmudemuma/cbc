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
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@mui/system/RtlProvider',
      '@mui/system/createStyled',
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
    strictPort: false,
    host: '0.0.0.0',
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
      // Exporter Portal API - External exporters (port 3004)
      '/api/exporter': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exporter/, '/api')
      },
      // Commercial Bank API - Banking operations (port 3001)
      '/api/banker': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/banker/, '/api')
      },
      // National Bank API - Regulatory (port 3005)
      '/api/nb-regulatory': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nb-regulatory/, '/api')
      },
      // ECTA API - Quality assurance (port 3003)
      '/api/ncat': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ncat/, '/api')
      },
      // Shipping Line API (port 3007)
      '/api/shipping': {
        target: 'http://localhost:3007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shipping/, '/api')
      },
      // Custom Authorities API (port 3002)
      '/api/customs': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/customs/, '/api')
      },
      // ECX API (port 3006)
      '/api/ecx': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ecx/, '/api')
      },
      // Legacy support - redirect to commercial bank
      '/api-portal': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-portal/, '/api')
      },
      // Default /api routes to commercial bank (port 3001)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
