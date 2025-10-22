# Multi-stage build for production
FROM node:20-alpine AS builder

# Install dumb-init early (then copy to final image without network)
RUN apk add --no-cache dumb-init

# Update npm to latest version
RUN npm install -g npm@latest

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 180000 && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set maxsockets 10

# Set working directory
WORKDIR /app

# Copy workspace package files (for dependencies)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy service-specific files
COPY national-bank/package*.json ./national-bank/
COPY national-bank/tsconfig.json ./national-bank/

# Install all workspace dependencies (including devDependencies for build)
# Split into two steps for better error handling and caching
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || \
    npm install --legacy-peer-deps --prefer-offline --no-audit
RUN npm cache clean --force

# Copy shared utilities
COPY shared ./shared

# Copy service source code
COPY national-bank/src ./national-bank/src

# Build TypeScript (use npx to find tsc from workspace root)
WORKDIR /app/national-bank

# Build TypeScript
RUN npx tsc && \
    if [ ! -d "dist" ]; then \
      echo "ERROR: dist directory was not created by build"; \
      echo "Contents of /app/national-bank:"; \
      ls -la; \
      exit 1; \
    fi

# Production stage
FROM node:20-alpine

# Copy dumb-init from builder to avoid apk in no-network stages
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy workspace package files
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/national-bank/dist ./national-bank/dist

# Copy shared utilities (needed at runtime)
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy wallet directory structure (will be populated at runtime)
RUN mkdir -p wallet && chown -R nodejs:nodejs wallet

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "national-bank/dist/src/index.js"]
