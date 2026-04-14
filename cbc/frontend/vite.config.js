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
      '/api/exporter-api': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exporter-api/, '/api')
      },
      // Exporter Portal API - Legacy path (keep for backward compatibility)
      '/api/exporter': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        // Don't rewrite - keep the full path
      },
      // Commercial Bank API - Banking operations (port 3001)
      '/api/banker': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/banker/, '/api')
      },
      // National Bank API - Regulatory (port 3005)
      '/api/nb-regulatory': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nb-regulatory/, '/api')
      },
      // ECTA API - Quality assurance (port 3003) - Route to gateway instead
      '/api/ecta': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        // Don't rewrite - gateway handles /api/ecta/* paths
      },
      // Shipping Line API (port 3007)
      '/api/shipping': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shipping/, '/api')
      },
      // Custom Authorities API (port 3002)
      '/api/customs': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/customs/, '/api')
      },
      // ECX API (port 3006)
      '/api/ecx': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ecx/, '/api')
      },
      // Network Submission API - Network Submission System (port 3008)
      '/api/esw': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        // Don't rewrite - ESW API expects /api/esw/* paths
      },
      // Auth routes - Coffee Export Gateway (port 3000)
      '/api/auth': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        // Don't rewrite - keep the full path
      },
      // Pre-registration routes - Coffee Export Gateway (port 3000)
      '/api/preregistration': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        // Don't rewrite - keep the full path
      },
      // Exports routes - Coffee Export Gateway (port 3000)
      '/api/exports': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        // Don't rewrite - keep the full path
      },
      // Contracts routes - Coffee Export Gateway (port 3000)
      '/api/contracts': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        // Don't rewrite - keep the full path
      },
      // Legacy support - redirect to gateway
      '/api-portal': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-portal/, '/api')
      },
      // Default /api routes to gateway (port 3000)
      '/api': {
        target: 'http://coffee-gateway:3000',
        changeOrigin: true
      }
    }
  }
})
