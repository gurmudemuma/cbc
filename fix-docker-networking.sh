#!/bin/bash

echo "🔧 Fixing Docker Networking Issues"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}1. Stopping current containers...${NC}"
cd "$PROJECT_ROOT/network"
docker-compose -f docker/docker-compose.yaml down

echo ""
echo -e "${BLUE}2. Cleaning up Docker resources...${NC}"
docker system prune -f
docker volume prune -f
docker network prune -f

echo ""
echo -e "${BLUE}3. Restarting Docker network...${NC}"
# Remove any existing network
docker network rm coffee-export-network 2>/dev/null || true

echo ""
echo -e "${BLUE}4. Starting containers with fresh network...${NC}"
docker-compose -f docker/docker-compose.yaml up -d

echo ""
echo -e "${BLUE}5. Waiting for containers to start...${NC}"
sleep 10

echo ""
echo -e "${BLUE}6. Testing port connectivity...${NC}"
PORTS=(7050 7051 8051 9051 10051)
WORKING_PORTS=0

for port in "${PORTS[@]}"; do
    echo -n "Testing port $port... "
    if timeout 5 bash -c "</dev/tcp/localhost/$port" 2>/dev/null; then
        echo -e "${GREEN}✅ Working${NC}"
        ((WORKING_PORTS++))
    else
        echo -e "${RED}❌ Not accessible${NC}"
    fi
done

echo ""
if [ $WORKING_PORTS -eq ${#PORTS[@]} ]; then
    echo -e "${GREEN}🎉 All ports are now accessible!${NC}"
    echo -e "${GREEN}✅ Docker networking issue resolved${NC}"
elif [ $WORKING_PORTS -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Some ports are working ($WORKING_PORTS/${#PORTS[@]})${NC}"
    echo -e "${YELLOW}This may be normal during startup. Wait a few more minutes.${NC}"
else
    echo -e "${RED}❌ No ports are accessible${NC}"
    echo -e "${RED}This indicates a deeper Docker Desktop networking issue.${NC}"
    echo ""
    echo -e "${YELLOW}Try these additional steps:${NC}"
    echo "1. Restart Docker Desktop completely"
    echo "2. Check Windows Defender Firewall"
    echo "3. Run Docker Desktop as Administrator"
    echo "4. Reset Docker Desktop to factory defaults"
fi

echo ""
echo -e "${BLUE}7. Container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "- Run: ./verify-system.sh to check system status"
echo "- If ports still don't work, restart Docker Desktop"
echo "- The blockchain network should be functional even if host ports aren't accessible"
