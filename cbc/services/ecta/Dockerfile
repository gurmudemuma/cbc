FROM node:20-alpine

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

WORKDIR /app

# Copy shared folder first and install its dependencies
COPY services/shared ../shared
WORKDIR /shared
RUN npm install --legacy-peer-deps --prefer-offline || npm install --legacy-peer-deps

# Go back to app directory
WORKDIR /app

# Copy service files
COPY services/ecta/package*.json ./
COPY services/ecta/tsconfig.json ./tsconfig.json
COPY services/ecta/src ./src
COPY services/tsconfig.base.json ../tsconfig.base.json

# Install service dependencies
RUN npm install --legacy-peer-deps --prefer-offline || npm install --legacy-peer-deps

# Install ts-node and tsconfig-paths globally
RUN npm install -g ts-node typescript tsconfig-paths

# Create necessary directories
RUN mkdir -p logs wallet storage

# Set NODE_PATH to include shared node_modules
ENV NODE_PATH=/shared/node_modules:/app/node_modules

EXPOSE 3003

HEALTHCHECK CMD node -e "require('http').get('http://localhost:3003/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run with ts-node and tsconfig-paths for path resolution
CMD ["ts-node", "-r", "tsconfig-paths/register", "src/index.ts"]
