#!/bin/bash

# Docker Network Fix Script
# Resolves EAI_AGAIN and network connectivity issues

set -e

echo "=========================================="
echo "Coffee Export Blockchain - Docker Fix"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}[1/7]${NC} Checking Docker daemon..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Stop all containers
echo -e "${YELLOW}[2/7]${NC} Stopping containers..."
docker-compose -f docker-compose.postgres.yml down 2>/dev/null || true
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Remove network
echo -e "${YELLOW}[3/7]${NC} Cleaning up networks..."
docker network prune -f > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Networks cleaned${NC}"
echo ""

# Rebuild images
echo -e "${YELLOW}[4/7]${NC} Rebuilding Docker images..."
docker-compose -f docker-compose.postgres.yml build --no-cache 2>&1 | grep -E "^(Building|Successfully)" || true
echo -e "${GREEN}✓ Images rebuilt${NC}"
echo ""

# Start services
echo -e "${YELLOW}[5/7]${NC} Starting services..."
docker-compose -f docker-compose.postgres.yml up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}[6/7]${NC} Waiting for services to be healthy (60 seconds)..."
for i in {1..60}; do
    if docker-compose -f docker-compose.postgres.yml ps | grep -q "healthy"; then
        echo -ne "\r${GREEN}✓ Services are healthy${NC}                    "
        break
    fi
    echo -ne "\rWaiting... $i/60 seconds"
    sleep 1
done
echo ""
echo ""

# Verify connectivity
echo -e "${YELLOW}[7/7]${NC} Verifying connectivity..."
echo ""

# Check network
if docker network inspect coffee-export-network > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Network 'coffee-export-network' exists${NC}"
else
    echo -e "${RED}✗ Network 'coffee-export-network' NOT found${NC}"
fi

# Check PostgreSQL
if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
else
    echo -e "${RED}✗ PostgreSQL is NOT ready${NC}"
fi

# Check IPFS
if docker exec ipfs ipfs id > /dev/null 2>&1; then
    echo -e "${GREEN}✓ IPFS is ready${NC}"
else
    echo -e "${RED}✗ IPFS is NOT ready${NC}"
fi

# Check API
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo -e "${GREEN}✓ CommercialBankAPI is responding${NC}"
else
    echo -e "${RED}✗ CommercialBankAPI is NOT responding${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Fix Complete!${NC}"
echo "=========================================="
echo ""
echo "Services Status:"
docker-compose -f docker-compose.postgres.yml ps
echo ""
echo "Next steps:"
echo "1. Check logs: docker-compose -f docker-compose.postgres.yml logs -f"
echo "2. Test API: curl http://localhost:3001/health"
echo "3. View database: docker exec postgres psql -U postgres -d coffee_export_db"
echo ""
