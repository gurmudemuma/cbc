FROM node:20-alpine

WORKDIR /app

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Install dependencies
COPY package*.json ./
RUN npm install --prefer-offline || npm install

# Install ts-node and typescript globally
RUN npm install -g ts-node typescript ts-node-dev

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3009/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start compiled service
CMD ["node", "dist/index.js"]
