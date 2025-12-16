#!/bin/bash

# CCAAS Complete Deployment Script
# This script automates the complete deployment of coffee-export chaincode as a service
# Including building, starting, packaging, installing, and committing the chaincode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHAINCODE_NAME="coffee-export"
CHAINCODE_VERSION="1.0"
CHANNEL_NAME="coffeechannel"
PACKAGE_ID=""
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CCAAS Complete Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Build Chaincode Binary Locally
echo -e "\n${YELLOW}[1/8] Building Chaincode Binary...${NC}"
cd chaincode/${CHAINCODE_NAME}
if CGO_ENABLED=0 GOOS=linux go build -o chaincode .; then
    echo -e "${GREEN}✓ Chaincode binary built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build chaincode binary${NC}"
    exit 1
fi
cd - > /dev/null

# Step 2: Build CCAAS Docker Image
echo -e "\n${YELLOW}[2/8] Building CCAAS Docker Image...${NC}"
if docker build -t ${CHAINCODE_NAME}-ccaas:latest -f chaincode/${CHAINCODE_NAME}/Dockerfile ./chaincode/${CHAINCODE_NAME}; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker image${NC}"
    exit 1
fi

# Step 3: Start CCAAS Service
echo -e "\n${YELLOW}[3/8] Starting CCAAS Service...${NC}"
if docker-compose -f docker-compose-ccaas.yml up -d; then
    echo -e "${GREEN}✓ CCAAS service started${NC}"
    sleep 5
else
    echo -e "${RED}✗ Failed to start CCAAS service${NC}"
    exit 1
fi

# Step 4: Verify CCAAS Service
echo -e "\n${YELLOW}[4/8] Verifying CCAAS Service...${NC}"
if docker ps | grep -q ${CHAINCODE_NAME}-ccaas; then
    echo -e "${GREEN}✓ CCAAS service is running${NC}"
else
    echo -e "${RED}✗ CCAAS service is not running${NC}"
    docker logs ${CHAINCODE_NAME}-ccaas
    exit 1
fi

# Step 5: Package Chaincode
echo -e "\n${YELLOW}[5/8] Packaging Chaincode...${NC}"
cd chaincode/${CHAINCODE_NAME}
if tar czf /tmp/${CHAINCODE_NAME}-ccaas.tgz -C ccaas-package .; then
    echo -e "${GREEN}✓ Chaincode packaged successfully${NC}"
else
    echo -e "${RED}✗ Failed to package chaincode${NC}"
    exit 1
fi
cd - > /dev/null

# Step 6: Copy package to CLI container
echo -e "\n${YELLOW}[6/8] Copying Chaincode Package to CLI Container...${NC}"
if docker cp /tmp/${CHAINCODE_NAME}-ccaas.tgz cli:/tmp/; then
    echo -e "${GREEN}✓ Chaincode package copied to CLI container${NC}"
else
    echo -e "${RED}✗ Failed to copy chaincode package${NC}"
    exit 1
fi

# Step 7: Install Chaincode
echo -e "\n${YELLOW}[7/8] Installing Chaincode in Fabric Network...${NC}"

# Install chaincode
if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=commercialbankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode install /tmp/${CHAINCODE_NAME}-ccaas.tgz
"; then
    echo -e "${GREEN}✓ Chaincode installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install chaincode${NC}"
    exit 1
fi

# Get package ID
echo -e "\n${YELLOW}Getting Package ID...${NC}"
PACKAGE_ID=$(docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=commercialbankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME} | awk '{print \$3}' | sed 's/,//'
")

if [ -z "$PACKAGE_ID" ]; then
    echo -e "${RED}✗ Failed to get package ID${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Package ID: $PACKAGE_ID${NC}"

# Approve for organization
echo -e "\n${YELLOW}Approving Chaincode for Organization...${NC}"
if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=commercialbankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode approveformyorg \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${CHAINCODE_VERSION} \
  --package-id ${PACKAGE_ID} \
  --sequence 1 \
  --tls \
  --cafile ${ORDERER_CA}
"; then
    echo -e "${GREEN}✓ Chaincode approved for organization${NC}"
else
    echo -e "${RED}✗ Failed to approve chaincode${NC}"
    exit 1
fi

# Commit chaincode
echo -e "\n${YELLOW}Committing Chaincode to Channel...${NC}"
if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=commercialbankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode commit \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${CHAINCODE_VERSION} \
  --sequence 1 \
  --tls \
  --cafile ${ORDERER_CA}
"; then
    echo -e "${GREEN}✓ Chaincode committed to channel${NC}"
else
    echo -e "${RED}✗ Failed to commit chaincode${NC}"
    exit 1
fi

# Step 8: Verify Deployment
echo -e "\n${YELLOW}[8/8] Verifying Deployment...${NC}"

if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=commercialbankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME}
"; then
    echo -e "${GREEN}✓ Chaincode verified on channel${NC}"
else
    echo -e "${RED}✗ Failed to verify chaincode${NC}"
    exit 1
fi

# Final Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CCAAS Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ All steps completed successfully${NC}"
echo ""
echo -e "${YELLOW}Deployment Summary:${NC}"
echo "  1. ✓ Chaincode binary built"
echo "  2. ✓ Docker image created"
echo "  3. ✓ CCAAS service started"
echo "  4. ✓ CCAAS service verified"
echo "  5. ✓ Chaincode packaged"
echo "  6. ✓ Package copied to CLI"
echo "  7. ✓ Chaincode installed"
echo "  8. ✓ Chaincode approved and committed"
echo ""
echo -e "${YELLOW}Chaincode Details:${NC}"
echo "  Name: ${CHAINCODE_NAME}"
echo "  Version: ${CHAINCODE_VERSION}"
echo "  Channel: ${CHANNEL_NAME}"
echo "  Package ID: ${PACKAGE_ID}"
echo ""
echo -e "${YELLOW}Monitoring Commands:${NC}"
echo "  View CCAAS logs: docker logs -f ${CHAINCODE_NAME}-ccaas"
echo "  View peer logs: docker logs -f peer0.commercialbank.coffee-export.com"
echo "  Query chaincode: docker exec cli peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME}"
echo ""
echo -e "${YELLOW}Test Chaincode:${NC}"
echo "  docker exec cli peer chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -c '{\"function\":\"GetAllExports\",\"Args\":[]}' --tls --cafile ${ORDERER_CA}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Ready to use! CCAAS deployment successful.${NC}"
echo -e "${BLUE}========================================${NC}"
