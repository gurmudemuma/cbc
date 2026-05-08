FROM node:20-alpine

WORKDIR /app

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Install dependencies
COPY package*.json ./
RUN npm install --prefer-offline || npm install

# Install ts-node and tsconfig-paths globally
RUN npm install -g ts-node typescript tsconfig-paths

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3008/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service with ts-node and tsconfig-paths
CMD ["ts-node", "-r", "tsconfig-paths/register", "src/index.ts"]
