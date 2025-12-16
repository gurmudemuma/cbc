#!/bin/bash

# API Build Optimization Script
# This script optimizes the API building process by:
# 1. Using pre-built base image if available
# 2. Building services in parallel
# 3. Using Docker BuildKit for faster builds
# 4. Caching npm dependencies

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo -e "${YELLOW}Optimizing API build process...${NC}"

# Check if base image exists
if docker image inspect coffee-export-api-base:latest >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Base image already exists, skipping build${NC}"
else
    echo -e "${YELLOW}Building shared API base image...${NC}"
    docker build -t coffee-export-api-base:latest -f api/Dockerfile.base api
fi

# Build all API services in parallel (much faster)
echo -e "${YELLOW}Building API services in parallel...${NC}"
docker-compose build --parallel \
    commercialbank-api \
    national-bank-api \
    ecta-api \
    shipping-line-api \
    custom-authorities-api

echo -e "${GREEN}✓ All API services built successfully${NC}"
