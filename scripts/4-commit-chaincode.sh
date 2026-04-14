#!/bin/bash
# ============================================================================
# STEP 4: COMMIT CHAINCODE TO CHANNEL
# Commits the approved chaincode definition to the blockchain channel
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
echo -e "${BLUE}              STEP 4: COMMIT CHAINCODE TO CHANNEL${NC}"
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

read -p "Press Enter to commit chaincode to channel..."

echo ""
echo -e "${YELLOW}[INFO] Committing chaincode definition...${NC}"
echo "This may take a few moments..."
echo ""

docker exec cli peer lifecycle chaincode commit \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls \
    --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR] Commit failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify all organizations approved: Run 3-approve-chaincode.sh"
    echo "  2. Check commit readiness: docker exec cli peer lifecycle chaincode checkcommitreadiness ..."
    echo "  3. Check orderer logs: docker logs orderer1.orderer.example.com"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}[SUCCESS] Chaincode committed to channel!${NC}"
echo ""

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Verifying Deployment...${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

docker exec cli peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}[SUCCESS] CHAINCODE DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Channel: ${CHANNEL_NAME}"
echo "Chaincode: ${CC_NAME}"
echo "Version: ${CC_VERSION}"
echo "Sequence: ${CC_SEQUENCE}"
echo ""
echo "The chaincode is now active and ready to use!"
echo ""
echo "Chaincode containers will start automatically on first invocation"
echo ""
echo "Next Steps:"
echo "  1. Test chaincode: node test-workflow-from-registration.js"
echo "  2. Check status: scripts/verify-chaincode-status.bat"
echo "  3. View containers: docker ps --filter name=dev-peer"
echo ""
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${BLUE}AVAILABLE BLOCKCHAIN FUNCTIONS: 140+${NC}"
echo ""
echo "Categories:"
echo "  • User Management (8)"
echo "  • Exporter Profile & Pre-Registration (11)"
echo "  • Export Workflow (7)"
echo "  • Sales Contract Registration (14)"
echo "  • Certificate Issuance (11)"
echo "  • Network Submission (9)"
echo "  • Document Issuance & Authentication (8) ⭐ NEW"
echo "  • ESW, Quality Certificates, GPS Plot, Customs, Shipping, Legal, and more..."
echo ""
echo "See scripts/README.md for complete function list"
echo ""
echo -e "${GREEN}============================================================================${NC}"
