#!/bin/bash
# ============================================================================
# STEP 2: INSTALL CHAINCODE ON ALL PEERS
# Installs the packaged chaincode on all 5 organization peers
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
echo -e "${BLUE}              STEP 2: INSTALL CHAINCODE ON ALL PEERS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Configuration
CC_NAME="ecta"
CC_VERSION="1.0"
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

echo "Configuration:"
echo "  Chaincode: ${CC_NAME}"
echo "  Version: ${CC_VERSION}"
echo "  Package: ${CC_NAME}.tar.gz"
echo ""
echo "Installing on 5 peers (ECTA, Bank, NBE, Customs, Shipping)..."
echo ""

read -p "Press Enter to continue..."

echo -e "${YELLOW}[1/5] Installing on peer0.ecta...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP \
    -e CORE_PEER_ADDRESS=peer0.ecta.example.com:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] ECTA installation failed${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Installed on peer0.ecta${NC}"
echo ""

echo -e "${YELLOW}[2/5] Installing on peer0.bank...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=BankMSP \
    -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.bank${NC}"
echo ""

echo -e "${YELLOW}[3/5] Installing on peer0.nbe...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP \
    -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.nbe${NC}"
echo ""

echo -e "${YELLOW}[4/5] Installing on peer0.customs...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP \
    -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.customs${NC}"
echo ""

echo -e "${YELLOW}[5/5] Installing on peer0.shipping...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP \
    -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.shipping${NC}"
echo ""

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Querying Package ID...${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep "${CC_NAME}_${CC_VERSION}" | awk '{print $3}' | sed 's/,$//')

if [ -z "$PACKAGE_ID" ]; then
    echo -e "${RED}[ERROR] Failed to get package ID${NC}"
    echo "Run: docker exec cli peer lifecycle chaincode queryinstalled"
    exit 1
fi

echo -e "${GREEN}[SUCCESS] Package ID: ${PACKAGE_ID}${NC}"
echo ""

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}[SUCCESS] Chaincode Installed on All Peers!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Package ID: ${PACKAGE_ID}"
echo "Installed on: 5 peers"
echo ""
echo "IMPORTANT: Save this Package ID for the next step!"
echo ""
echo "Next Step: Run 3-approve-chaincode.sh with this Package ID"
echo ""
echo -e "${GREEN}============================================================================${NC}"
