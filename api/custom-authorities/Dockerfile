# Multi-stage build for production
FROM node:18-alpine AS builder

# Install dumb-init early (then copy to final image without network)
RUN apk add --no-cache dumb-init

# Configure npm for better reliability with increased timeouts
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set maxsockets 3 && \
    npm config set registry https://registry.npmjs.org/

# Set working directory
WORKDIR /app

# Copy workspace package files (for dependencies)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy service-specific files
COPY custom-authorities/package*.json ./custom-authorities/
COPY custom-authorities/tsconfig.json ./custom-authorities/

# Install all workspace dependencies
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || \
    npm install --legacy-peer-deps --prefer-offline --no-audit
RUN npm cache clean --force

# Copy shared utilities
COPY shared ./shared

# Copy service source code
COPY custom-authorities/src ./custom-authorities/src

# Build TypeScript (use npx to find tsc from workspace root)
WORKDIR /app/custom-authorities
RUN npx tsc && \
    if [ ! -d "dist" ]; then \
      echo "ERROR: dist directory was not created by build"; \
      echo "Contents of /app/custom-authorities:"; \
      ls -la; \
      exit 1; \
    fi

# Production stage
FROM node:18-alpine

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
COPY --from=builder --chown=nodejs:nodejs /app/custom-authorities/dist ./custom-authorities/dist

# Copy shared utilities (needed at runtime)
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy wallet directory structure (will be populated at runtime)
RUN mkdir -p wallet logs && chown -R nodejs:nodejs wallet logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "custom-authorities/dist/custom-authorities/src/index.js"]
