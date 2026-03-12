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
RUN chmod +x /app/startup.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with startup script
CMD ["/app/startup.sh"]
