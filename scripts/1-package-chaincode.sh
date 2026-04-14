#!/bin/bash
# ============================================================================
# STEP 1: PACKAGE CHAINCODE
# Creates a chaincode package ready for installation
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}              STEP 1: PACKAGE CHAINCODE${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Configuration
CC_NAME="ecta"
CC_VERSION="1.0"
CC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta"
CC_LANG="node"

echo "Configuration:"
echo "  Chaincode Name: ${CC_NAME}"
echo "  Version: ${CC_VERSION}"
echo "  Language: ${CC_LANG}"
echo "  Source Path: ${CC_PATH}"
echo ""

read -p "Press Enter to continue..."

echo -e "${YELLOW}[INFO] Cleaning old packages...${NC}"
docker exec cli rm -f /opt/gopath/src/github.com/hyperledger/fabric/peer/*.tar.gz 2>/dev/null || true
echo ""

echo -e "${YELLOW}[INFO] Packaging chaincode...${NC}"
docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_PATH} --lang ${CC_LANG} --label ${CC_NAME}_${CC_VERSION}

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR] Packaging failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if chaincode source exists at: ${CC_PATH}"
    echo "  2. Verify Docker containers are running: docker ps"
    echo "  3. Check CLI container logs: docker logs cli"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}[SUCCESS] Chaincode Packaged Successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Package: ${CC_NAME}.tar.gz"
echo "Label: ${CC_NAME}_${CC_VERSION}"
echo "Location: CLI container at /opt/gopath/src/github.com/hyperledger/fabric/peer/"
echo ""
echo "Next Step: Run 2-install-chaincode.sh to install on all peers"
echo ""
echo -e "${GREEN}============================================================================${NC}"
