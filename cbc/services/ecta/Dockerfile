FROM node:20-alpine AS builder

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

WORKDIR /app

# Copy service files
COPY services/ecta/package*.json ./
COPY services/ecta/tsconfig.json ./tsconfig.json
COPY services/ecta/src ./src
COPY services/shared ../shared
COPY services/tsconfig.base.json ../tsconfig.base.json

# Install and build
RUN npm install --legacy-peer-deps --prefer-offline || npm install --legacy-peer-deps
RUN npm run build || npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/../shared ./shared

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 nodejs && \
    mkdir -p logs wallet storage && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3003

HEALTHCHECK CMD node -e "require('http').get('http://localhost:3003/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/ecta/src/index.js"]
