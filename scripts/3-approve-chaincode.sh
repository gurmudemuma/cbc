#!/bin/bash
# ============================================================================
# STEP 3: APPROVE CHAINCODE FOR ALL ORGANIZATIONS
# Approves the chaincode definition for all 5 organizations
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
echo -e "${BLUE}         STEP 3: APPROVE CHAINCODE FOR ALL ORGANIZATIONS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Configuration
CHANNEL_NAME="coffeechannel"
CC_NAME="ecta"
CC_VERSION="1.0"
CC_SEQUENCE=1
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

echo "Configuration:"
echo "  Channel: ${CHANNEL_NAME}"
echo "  Chaincode: ${CC_NAME}"
echo "  Version: ${CC_VERSION}"
echo "  Sequence: ${CC_SEQUENCE}"
echo ""

# Get Package ID
echo -e "${YELLOW}[INFO] Querying Package ID...${NC}"
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep "${CC_NAME}_${CC_VERSION}" | awk '{print $3}' | sed 's/,$//')

if [ -z "$PACKAGE_ID" ]; then
    echo -e "${RED}[ERROR] Package ID not found!${NC}"
    echo ""
    echo "Make sure you have run 2-install-chaincode.sh first"
    echo "Or manually provide the Package ID"
    echo ""
    read -p "Enter Package ID (or press Ctrl+C to exit): " PACKAGE_ID
    
    if [ -z "$PACKAGE_ID" ]; then
        echo -e "${RED}[ERROR] No Package ID provided${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}[SUCCESS] Package ID: ${PACKAGE_ID}${NC}"
echo ""

read -p "Press Enter to approve for all 5 organizations..."

approve_for_org() {
    local ORG=$1
    local MSP_ID=$2
    local PEER_ADDRESS=$3
    local STEP=$4
    
    echo ""
    echo -e "${YELLOW}[${STEP}/5] Approving for ${ORG}...${NC}"
    docker exec -e CORE_PEER_LOCALMSPID=${MSP_ID} \
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} \
        -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER_ADDRESS}/tls/ca.crt \
        -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp \
        cli peer lifecycle chaincode approveformyorg \
        -o orderer1.orderer.example.com:7050 \
        --ordererTLSHostnameOverride orderer1.orderer.example.com \
        --tls \
        --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${CC_SEQUENCE}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS] ${ORG} approved${NC}"
    else
        echo -e "${RED}[ERROR] ${ORG} approval failed${NC}"
        return 1
    fi
}

approve_for_org "ecta" "ECTAMSP" "peer0.ecta.example.com:7051" "1"
approve_for_org "bank" "BankMSP" "peer0.bank.example.com:9051" "2"
approve_for_org "nbe" "NBEMSP" "peer0.nbe.example.com:10051" "3"
approve_for_org "customs" "CustomsMSP" "peer0.customs.example.com:11051" "4"
approve_for_org "shipping" "ShippingMSP" "peer0.shipping.example.com:12051" "5"

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Checking Commit Readiness...${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --output json

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}[SUCCESS] Chaincode Approved by All Organizations!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Channel: ${CHANNEL_NAME}"
echo "Chaincode: ${CC_NAME}"
echo "Version: ${CC_VERSION}"
echo "Sequence: ${CC_SEQUENCE}"
echo "Package ID: ${PACKAGE_ID}"
echo ""
echo "All 5 organizations have approved the chaincode definition"
echo ""
echo "Next Step: Run 4-commit-chaincode.sh to commit to the channel"
echo ""
echo -e "${GREEN}============================================================================${NC}"
