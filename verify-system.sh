#!/bin/bash

echo "🔍 Coffee Blockchain Consortium - System Verification"
echo "====================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}1. Checking Docker containers...${NC}"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(peer0|orderer|cli|couchdb)"; then
    echo -e "${GREEN}✅ Blockchain containers are running${NC}"
else
    echo -e "${RED}❌ Blockchain containers are not running${NC}"
    echo "   Run: ./start-system.sh to start the network"
fi
echo ""

echo -e "${BLUE}2. Checking blockchain network ports...${NC}"
BLOCKCHAIN_PORTS=(7050 7051 8051 9051 10051)
for port in "${BLOCKCHAIN_PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $port is active${NC}"
    else
        echo -e "${RED}❌ Port $port is not active${NC}"
    fi
done
echo ""

echo -e "${BLUE}3. Checking API ports...${NC}"
API_PORTS=(3001 3002 3003 3004)
API_RUNNING=0
for port in "${API_PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ API on port $port is running${NC}"
        ((API_RUNNING++))
    else
        echo -e "${RED}❌ API on port $port is not running${NC}"
    fi
done
echo -e "${YELLOW}APIs running: $API_RUNNING/4${NC}"
echo ""

echo -e "${BLUE}4. Checking IPFS (Required)...${NC}"
if command -v ipfs &> /dev/null; then
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ IPFS daemon is running on port 5001${NC}"
    else
        echo -e "${RED}❌ IPFS is installed but daemon is not running${NC}"
        echo -e "${YELLOW}   Start IPFS with: ipfs daemon${NC}"
    fi
else
    echo -e "${RED}❌ IPFS is not installed (Required)${NC}"
    echo -e "${YELLOW}   Install IPFS from: https://docs.ipfs.tech/install/${NC}"
fi
echo ""

echo -e "${BLUE}5. Checking critical files...${NC}"
CRITICAL_FILES=(
    "network/scripts/envVar.sh"
    "network/scripts/setAnchorPeer.sh"
    "scripts/dev-apis.sh"
    "api/package.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file is missing${NC}"
    fi
done
echo ""

echo -e "${BLUE}6. Testing chaincode deployment...${NC}"
if docker exec cli peer chaincode list --installed 2>/dev/null | grep -q "coffee-export"; then
    echo -e "${GREEN}✅ coffee-export chaincode is installed${NC}"
else
    echo -e "${RED}❌ coffee-export chaincode is not installed${NC}"
fi

if docker exec cli peer chaincode list --installed 2>/dev/null | grep -q "user-management"; then
    echo -e "${GREEN}✅ user-management chaincode is installed${NC}"
else
    echo -e "${RED}❌ user-management chaincode is not installed${NC}"
fi
echo ""

echo -e "${BLUE}7. System Summary${NC}"
echo "=================="

# Count running services
TOTAL_SERVICES=0
RUNNING_SERVICES=0

# Blockchain (core requirement)
if docker ps --format "{{.Names}}" | grep -q "peer0.commercialbank"; then
    echo -e "  Blockchain Network: ${GREEN}✅ Running${NC}"
    ((RUNNING_SERVICES++))
else
    echo -e "  Blockchain Network: ${RED}❌ Not Running${NC}"
fi
((TOTAL_SERVICES++))

# APIs (optional but recommended)
if [ $API_RUNNING -gt 0 ]; then
    echo -e "  API Services: ${YELLOW}⚠️ $API_RUNNING/4 Running${NC}"
    if [ $API_RUNNING -eq 4 ]; then
        ((RUNNING_SERVICES++))
    fi
else
    echo -e "  API Services: ${RED}❌ Not Running${NC}"
fi
((TOTAL_SERVICES++))

# IPFS (required)
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "  IPFS Daemon: ${GREEN}✅ Running (Required)${NC}"
    ((RUNNING_SERVICES++))
else
    echo -e "  IPFS Daemon: ${RED}❌ Not Running (Required)${NC}"
fi
((TOTAL_SERVICES++))

echo ""
echo -e "${BLUE}Overall Status: ${NC}"
if [ $RUNNING_SERVICES -eq $TOTAL_SERVICES ]; then
    echo -e "${GREEN}🎉 All services are running perfectly!${NC}"
elif [ $RUNNING_SERVICES -gt 0 ]; then
    echo -e "${YELLOW}⚠️ System is partially running ($RUNNING_SERVICES/$TOTAL_SERVICES services)${NC}"
    echo -e "${YELLOW}The blockchain core is functional, some optional services may need attention.${NC}"
else
    echo -e "${RED}❌ System is not running${NC}"
    echo -e "${RED}Run ./start-system.sh to start the system${NC}"
fi

echo ""
echo -e "${BLUE}Quick Actions:${NC}"
echo "  Start system: ${GREEN}./start-system.sh${NC}"
echo "  Fix issues:   ${GREEN}./fix-all-issues.sh${NC}"
echo "  View logs:    ${GREEN}tail -f logs/*.log${NC}"
