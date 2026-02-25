# Multi-stage build for production
FROM node:20-alpine AS builder

# Configure npm for better network resilience and use multiple registries
RUN npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-timeout 600000 && \
    npm config set maxsockets 1 && \
    npm config set registry https://registry.npmjs.org/

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies with network-friendly options
RUN npm install --legacy-peer-deps --prefer-offline --no-audit --maxsockets=1 && \
    npm cache clean --force

# Copy shared API endpoints
COPY services/shared/api-endpoints.constants.ts ./services/shared/api-endpoints.constants.ts

# Copy frontend source code
COPY frontend/ .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
