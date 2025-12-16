#!/bin/bash

# Ultra-fast API build - bypasses slow base image
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Ultra-fast API build (no base image)...${NC}"

# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build each service with minimal Dockerfile
cd api

for service in commercial-bank national-bank ecta shipping-line custom-authorities; do
    echo -e "${YELLOW}Fast building $service...${NC}"
    
    # Create minimal Dockerfile on-the-fly
    cat > $service/Dockerfile.minimal << EOF
FROM node:18-alpine
WORKDIR /app

# Configure npm with retry logic and DNS settings
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set maxsockets 1 && \
    npm config set registry https://registry.npmjs.org/

COPY $service/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev --legacy-peer-deps --no-audit --prefer-offline --no-fund || npm install --omit=dev --legacy-peer-deps --no-audit --prefer-offline --no-fund
COPY shared ./shared
COPY $service/src ./src
EXPOSE 3001
CMD ["npm", "start"]
EOF

    # Build with minimal Dockerfile (build context is api directory)
    docker build --progress=plain -t ${service}-api:latest -f $service/Dockerfile.minimal .
    
    echo -e "${GREEN}✓ $service built${NC}"
done

echo -e "${GREEN}✓ All APIs built in under 2 minutes!${NC}"
