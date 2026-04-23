FROM node:20-alpine

# Install Docker CLI for executing commands in CLI container
RUN apk add --no-cache docker-cli

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with timeout handling
RUN npm install --omit=dev --prefer-offline || npm install --omit=dev

# Copy application files
COPY . .

# Create wallets directory
RUN mkdir -p wallets

# Copy startup script
COPY startup.sh /app/startup.sh
RUN sed -i 's/\r$//' /app/startup.sh && chmod +x /app/startup.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start with startup script when present; fall back to server directly.
CMD ["sh", "-c", "if [ -f /app/startup.sh ]; then exec /app/startup.sh; else echo 'startup.sh not found, starting server directly'; exec node /app/src/server.js; fi"]
