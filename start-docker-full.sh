#!/bin/bash

# Coffee Blockchain Consortium - Full Containerized Startup
# This script builds and starts the complete system using Docker Compose

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║   Coffee Blockchain - Full Containerized Deployment       ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
BUILD_IMAGES=false
CLEAN_START=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD_IMAGES=true
            shift
            ;;
        --clean)
            CLEAN_START=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --build       Build Docker images before starting"
            echo "  --clean       Clean all volumes and start fresh"
            echo "  -h, --help    Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker and try again${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found${NC}"
    echo -e "${YELLOW}Please install docker-compose${NC}"
    exit 1
fi

# Clean start if requested
if [ "$CLEAN_START" = true ]; then
    echo -e "${BLUE}[1/5] Cleaning Previous Deployment...${NC}"
    echo -e "${YELLOW}Stopping all containers...${NC}"
    docker-compose -f docker-compose-full.yml down -v 2>/dev/null || true
    
    echo -e "${YELLOW}Removing network...${NC}"
    docker network rm coffee-export-network 2>/dev/null || true
    
    echo -e "${YELLOW}Pruning Docker system...${NC}"
    docker system prune -f
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    echo ""
fi

# Generate crypto material and setup network
echo -e "${BLUE}[2/5] Setting Up Blockchain Network...${NC}"
cd "$PROJECT_ROOT/network"

if [ ! -d "organizations/peerOrganizations" ] || [ "$CLEAN_START" = true ]; then
    echo -e "${YELLOW}Generating crypto material...${NC}"
    ./network.sh up
    ./network.sh createChannel
    echo -e "${GREEN}✅ Crypto material generated${NC}"
else
    echo -e "${GREEN}✅ Crypto material already exists${NC}"
fi

cd "$PROJECT_ROOT"
echo ""

# Build Docker images if requested
if [ "$BUILD_IMAGES" = true ]; then
    echo -e "${BLUE}[3/5] Building Docker Images...${NC}"
    echo -e "${YELLOW}This may take 10-15 minutes...${NC}"
    
    echo -e "${CYAN}Building API images...${NC}"
    docker-compose -f docker-compose-full.yml build commercialbank-api
    docker-compose -f docker-compose-full.yml build national-bank-api
    docker-compose -f docker-compose-full.yml build ncat-api
    docker-compose -f docker-compose-full.yml build shipping-line-api
    docker-compose -f docker-compose-full.yml build custom-authorities-api
    
    echo -e "${CYAN}Building frontend image...${NC}"
    docker-compose -f docker-compose-full.yml build frontend
    
    echo -e "${GREEN}✅ All images built successfully${NC}"
    echo ""
else
    echo -e "${BLUE}[3/5] Skipping Image Build${NC}"
    echo -e "${YELLOW}Use --build flag to rebuild images${NC}"
    echo ""
fi

# Start all services
echo -e "${BLUE}[4/5] Starting All Services...${NC}"
echo -e "${YELLOW}Starting containers (detached mode)...${NC}"

docker-compose -f docker-compose-full.yml up -d

echo -e "${GREEN}✅ All services started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${BLUE}[5/5] Waiting for Services to be Healthy...${NC}"
echo -e "${YELLOW}This may take 2-3 minutes...${NC}"

# Wait for IPFS
echo -n "  Waiting for IPFS..."
for i in {1..60}; do
    if docker-compose -f docker-compose-full.yml ps ipfs | grep -q "healthy"; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    sleep 1
    echo -n "."
done

# Wait for peers
echo -n "  Waiting for Fabric peers..."
for i in {1..60}; do
    PEER_COUNT=$(docker-compose -f docker-compose-full.yml ps | grep "peer0\." | grep -c "Up" || echo "0")
    if [ "$PEER_COUNT" -ge 5 ]; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    sleep 1
    echo -n "."
done

# Wait for APIs
echo -n "  Waiting for API services..."
for i in {1..90}; do
    API_COUNT=0
    for port in 3001 3002 3003 3004 3005; do
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            ((API_COUNT++))
        fi
    done
    if [ "$API_COUNT" -ge 5 ]; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    sleep 1
    echo -n "."
done

# Wait for frontend
echo -n "  Waiting for frontend..."
for i in {1..30}; do
    if curl -s http://localhost > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    sleep 1
    echo -n "."
done

echo ""
echo -e "${GREEN}✅ All services are running!${NC}"
echo ""

# Display service status
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║              🎉 Deployment Complete! 🎉                    ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Services Running:${NC}"
echo -e "  • IPFS:                ${GREEN}http://localhost:5001${NC} (API), ${GREEN}http://localhost:8080${NC} (Gateway)"
echo -e "  • commercialbank API:   ${GREEN}http://localhost:3001${NC}"
echo -e "  • National Bank API:   ${GREEN}http://localhost:3002${NC}"
echo -e "  • ECTA API:            ${GREEN}http://localhost:3003${NC}"
echo -e "  • Shipping Line API:   ${GREEN}http://localhost:3004${NC}"
echo -e "  • Custom Auth. API:    ${GREEN}http://localhost:3005${NC}"
echo -e "  • Frontend:            ${GREEN}http://localhost${NC}"
echo ""

echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View all containers:   ${CYAN}docker-compose -f docker-compose-full.yml ps${NC}"
echo -e "  View logs:             ${CYAN}docker-compose -f docker-compose-full.yml logs -f [service]${NC}"
echo -e "  Stop all:              ${CYAN}docker-compose -f docker-compose-full.yml down${NC}"
echo -e "  Stop + remove volumes: ${CYAN}docker-compose -f docker-compose-full.yml down -v${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Deploy chaincode using the CLI container"
echo -e "     ${CYAN}docker exec -it cli bash${NC}"
echo -e "     ${CYAN}./scripts/deployCC.sh${NC}"
echo ""
echo -e "  2. Access the application at ${GREEN}http://localhost${NC}"
echo ""
