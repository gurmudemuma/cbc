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
COPY package*.json ./

# Install dependencies with network-friendly options
# Use ci for faster, more reliable installs and break into chunks if needed
RUN npm install --legacy-peer-deps --prefer-offline --no-audit --maxsockets=1 && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
