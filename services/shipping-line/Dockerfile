# Multi-stage build for production
FROM node:18-alpine AS builder

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
<<<<<<< HEAD
COPY api/tsconfig.base.json ./api/
=======
COPY api/tsconfig.base.json ./
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

# Copy service-specific files
COPY api/shipping-line/package*.json ./api/shipping-line/
COPY api/shipping-line/tsconfig.json ./api/shipping-line/

# Remove any existing package-lock.json in subdirectory to avoid conflicts
RUN rm -f ./api/shipping-line/package-lock.json

# Install all workspace dependencies
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || \
    npm install --legacy-peer-deps --prefer-offline --no-audit
RUN npm cache clean --force

# Copy shared utilities
COPY api/shared ./api/shared

# Copy service source code
COPY api/shipping-line/src ./api/shipping-line/src

# Build TypeScript (use npx to find tsc from workspace root)
WORKDIR /app/api/shipping-line
RUN npx tsc && \
    if [ ! -d "dist" ]; then \
      echo "ERROR: dist directory was not created by build"; \
      echo "Contents of /app/shipping-line:"; \
      ls -la; \
      exit 1; \
    fi

# Production stage
FROM node:18-alpine

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
COPY --from=builder --chown=nodejs:nodejs /app/api/shipping-line/dist ./api/shipping-line/dist

# Copy shared utilities (needed at runtime)
COPY --from=builder --chown=nodejs:nodejs /app/api/shared ./api/shared

# Copy wallet directory structure (will be populated at runtime)
RUN mkdir -p wallet logs && chown -R nodejs:nodejs wallet logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "api/shipping-line/dist/src/index.js"]
