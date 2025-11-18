#!/bin/bash

# Fix and Start Script for Coffee Blockchain Consortium
# This script fixes the crypto material issue and starts the system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Add Fabric binaries to PATH
export PATH="$PROJECT_ROOT/bin:$PATH"
export FABRIC_CFG_PATH="$PROJECT_ROOT/config"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║     Coffee Blockchain Consortium - Fix & Start             ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Step 1: Stopping any running containers...${NC}"
cd "$PROJECT_ROOT/network"
docker-compose -f docker/docker-compose.yaml down 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

echo -e "${YELLOW}Step 2: Cleaning up crypto material directories...${NC}"
# Remove crypto directories - they might be owned by root from Docker
if [ -d "organizations/peerOrganizations" ]; then
    echo "Removing peerOrganizations..."
    sudo rm -rf organizations/peerOrganizations
fi

if [ -d "organizations/ordererOrganizations" ]; then
    echo "Removing ordererOrganizations..."
    sudo rm -rf organizations/ordererOrganizations
fi

# Also clean up any old chaincode packages
rm -f *.tar.gz 2>/dev/null || true
rm -f log.txt 2>/dev/null || true

echo -e "${GREEN}✅ Crypto directories cleaned${NC}"
echo ""

echo -e "${YELLOW}Step 3: Checking Fabric binaries...${NC}"
# Check if cryptogen is available
if ! command -v cryptogen &> /dev/null; then
    echo -e "${RED}❌ cryptogen not found in PATH${NC}"
    echo -e "${YELLOW}Checking if binaries exist in $PROJECT_ROOT/bin...${NC}"
    if [ -f "$PROJECT_ROOT/bin/cryptogen" ]; then
        echo -e "${GREEN}✅ Found binaries, adding to PATH${NC}"
        export PATH="$PROJECT_ROOT/bin:$PATH"
    else
        echo -e "${RED}❌ Fabric binaries not installed${NC}"
        echo -e "${YELLOW}Please run: ./scripts/install-fabric.sh${NC}"
        exit 1
    fi
fi

# Verify cryptogen is now available
if command -v cryptogen &> /dev/null; then
    echo -e "${GREEN}✅ cryptogen available: $(which cryptogen)${NC}"
else
    echo -e "${RED}❌ cryptogen still not found${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Generating crypto material...${NC}"
# Manually call createOrgs to ensure crypto is generated
if [ -f "./organizations/cryptogen/crypto-config-commercialbank.yaml" ]; then
    echo "Creating commercialbank Identities..."
    cryptogen generate --config=./organizations/cryptogen/crypto-config-commercialbank.yaml --output="organizations"
    
    echo "Creating National Bank Identities..."
    cryptogen generate --config=./organizations/cryptogen/crypto-config-nationalbank.yaml --output="organizations"
    
    echo "Creating ECTA Identities..."
    cryptogen generate --config=./organizations/cryptogen/crypto-config-ncat.yaml --output="organizations"
    
    echo "Creating Shipping Line Identities..."
    cryptogen generate --config=./organizations/cryptogen/crypto-config-shippingline.yaml --output="organizations"
    
    echo "Creating Orderer Org Identities..."
    cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"
    
    echo -e "${GREEN}✅ Crypto material generated${NC}"
else
    echo -e "${RED}❌ Cryptogen config files not found${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Generating connection profiles...${NC}"
if [ -f "./organizations/ccp-generate.sh" ]; then
    chmod +x ./organizations/ccp-generate.sh
    ./organizations/ccp-generate.sh
    echo -e "${GREEN}✅ Connection profiles generated${NC}"
else
    echo -e "${YELLOW}⚠️  ccp-generate.sh not found${NC}"
fi
echo ""

echo -e "${YELLOW}Step 6: Verifying crypto material...${NC}"
if [ -d "organizations/peerOrganizations/commercialbank.coffee-export.com/msp" ]; then
    echo -e "${GREEN}✅ commercialbank crypto verified${NC}"
else
    echo -e "${RED}❌ commercialbank crypto missing${NC}"
    exit 1
fi

if [ -d "organizations/ordererOrganizations/coffee-export.com/msp" ]; then
    echo -e "${GREEN}✅ Orderer crypto verified${NC}"
else
    echo -e "${RED}❌ Orderer crypto missing${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 7: Starting Docker containers...${NC}"
COMPOSE_FILES="-f ${PWD}/docker/docker-compose.yaml"
IMAGE_TAG=latest docker-compose ${COMPOSE_FILES} up -d

# Wait for containers to start
sleep 5

echo ""
echo -e "${YELLOW}Step 8: Checking container status...${NC}"
docker ps -a | grep -E "(peer0|orderer|cli)"

# Check if containers are running (not exited)
RUNNING_COUNT=$(docker ps | grep -c "peer0.commercialbank" || echo "0")
if [ "$RUNNING_COUNT" -gt 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Containers are running successfully!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "1. Create channel: ${YELLOW}cd $PROJECT_ROOT/network && ./network.sh createChannel${NC}"
    echo -e "2. Deploy chaincode: ${YELLOW}./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go${NC}"
    echo -e "3. Or use the full startup: ${YELLOW}cd $PROJECT_ROOT && ./start-system.sh --skip-deps${NC}"
else
    echo ""
    echo -e "${RED}❌ Containers failed to start properly${NC}"
    echo ""
    echo -e "${YELLOW}Checking logs:${NC}"
    echo ""
    echo -e "${CYAN}Orderer logs:${NC}"
    docker logs orderer.coffee-export.com 2>&1 | tail -20
    echo ""
    echo -e "${CYAN}Peer logs:${NC}"
    docker logs peer0.commercialbank.coffee-export.com 2>&1 | tail -20
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║          Network Started Successfully! 🎉                  ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
