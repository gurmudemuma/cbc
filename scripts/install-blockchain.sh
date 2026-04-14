#!/bin/bash
# ============================================================================
# COMPLETE BLOCKCHAIN INSTALLATION SCRIPT
# Initializes channel, installs chaincode, approves, commits, and initializes
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
echo -e "${BLUE}              COMPLETE BLOCKCHAIN INSTALLATION${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "This script will:"
echo "  1. Initialize blockchain channel"
echo "  2. Join all peers to the channel"
echo "  3. Package chaincode"
echo "  4. Install chaincode on all peers"
echo "  5. Approve chaincode for all organizations"
echo "  6. Commit chaincode to the channel"
echo "  7. Verify deployment"
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo ""

read -p "Press Enter to continue..."

# Configuration
CHANNEL_NAME="coffeechannel"
CC_NAME="ecta"
CC_VERSION="1.0"
CC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta"
CC_LANG="node"
CC_SEQUENCE=1
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# ============================================================================
# STEP 1: INITIALIZE BLOCKCHAIN CHANNEL
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 1: INITIALIZE BLOCKCHAIN CHANNEL${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo -e "${YELLOW}[1.1] Generating channel genesis block...${NC}"
docker exec cli bash -c "export FABRIC_CFG_PATH=/etc/hyperledger/configtx && configtxgen -profile CoffeeChannel -outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHANNEL_NAME}.block -channelID ${CHANNEL_NAME}"
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to generate channel block${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Channel genesis block created${NC}"
echo ""

echo -e "${YELLOW}[1.2] Joining peer0.ecta to channel...${NC}"
docker exec cli bash -c "
export CORE_PEER_LOCALMSPID=ECTAMSP
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
peer channel join -b ${CHANNEL_NAME}.block
"
echo -e "${GREEN}[SUCCESS] peer0.ecta joined${NC}"
echo ""

echo -e "${YELLOW}[1.3] Joining peer0.bank to channel...${NC}"
docker exec cli bash -c "
export CORE_PEER_LOCALMSPID=BankMSP
export CORE_PEER_ADDRESS=peer0.bank.example.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp
peer channel join -b ${CHANNEL_NAME}.block
"
echo -e "${GREEN}[SUCCESS] peer0.bank joined${NC}"
echo ""

echo -e "${YELLOW}[1.4] Joining peer0.nbe to channel...${NC}"
docker exec cli bash -c "
export CORE_PEER_LOCALMSPID=NBEMSP
export CORE_PEER_ADDRESS=peer0.nbe.example.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp
peer channel join -b ${CHANNEL_NAME}.block
"
echo -e "${GREEN}[SUCCESS] peer0.nbe joined${NC}"
echo ""

echo -e "${YELLOW}[1.5] Joining peer0.customs to channel...${NC}"
docker exec cli bash -c "
export CORE_PEER_LOCALMSPID=CustomsMSP
export CORE_PEER_ADDRESS=peer0.customs.example.com:11051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp
peer channel join -b ${CHANNEL_NAME}.block
"
echo -e "${GREEN}[SUCCESS] peer0.customs joined${NC}"
echo ""

echo -e "${YELLOW}[1.6] Joining peer0.shipping to channel...${NC}"
docker exec cli bash -c "
export CORE_PEER_LOCALMSPID=ShippingMSP
export CORE_PEER_ADDRESS=peer0.shipping.example.com:12051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp
peer channel join -b ${CHANNEL_NAME}.block
"
echo -e "${GREEN}[SUCCESS] peer0.shipping joined${NC}"
echo ""

echo -e "${YELLOW}[1.7] Verifying channel membership...${NC}"
docker exec cli peer channel list
echo ""
echo -e "${GREEN}[SUCCESS] All peers joined channel: ${CHANNEL_NAME}${NC}"
echo ""

# ============================================================================
# STEP 2: PACKAGE CHAINCODE
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 2: PACKAGE CHAINCODE${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

docker exec cli rm -f /opt/gopath/src/github.com/hyperledger/fabric/peer/*.tar.gz 2>/dev/null || true
docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_PATH} --lang ${CC_LANG} --label ${CC_NAME}_${CC_VERSION}
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Packaging failed${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Chaincode packaged: ${CC_NAME}.tar.gz${NC}"
echo ""

# ============================================================================
# STEP 3: INSTALL CHAINCODE ON ALL PEERS
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 3: INSTALL CHAINCODE ON ALL PEERS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo -e "${YELLOW}[3.1] Installing on peer0.ecta...${NC}"
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

echo -e "${YELLOW}[3.2] Installing on peer0.bank...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=BankMSP \
    -e CORE_PEER_ADDRESS=peer0.bank.example.com:9051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.bank${NC}"
echo ""

echo -e "${YELLOW}[3.3] Installing on peer0.nbe...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=NBEMSP \
    -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.nbe${NC}"
echo ""

echo -e "${YELLOW}[3.4] Installing on peer0.customs...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=CustomsMSP \
    -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.customs${NC}"
echo ""

echo -e "${YELLOW}[3.5] Installing on peer0.shipping...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=ShippingMSP \
    -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp \
    cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
echo -e "${GREEN}[SUCCESS] Installed on peer0.shipping${NC}"
echo ""

# ============================================================================
# STEP 4: GET PACKAGE ID
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 4: QUERY PACKAGE ID${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep "${CC_NAME}_${CC_VERSION}" | awk '{print $3}' | sed 's/,$//')
if [ -z "$PACKAGE_ID" ]; then
    echo -e "${RED}[ERROR] Failed to get package ID${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Package ID: ${PACKAGE_ID}${NC}"
echo ""

# ============================================================================
# STEP 5: APPROVE CHAINCODE FOR ALL ORGANIZATIONS
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 5: APPROVE CHAINCODE FOR ALL ORGANIZATIONS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

approve_for_org() {
    local ORG=$1
    local MSP_ID=$2
    local PEER_ADDRESS=$3
    local STEP=$4
    
    echo -e "${YELLOW}[5.${STEP}] Approving for ${ORG}...${NC}"
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
    echo -e "${GREEN}[SUCCESS] ${ORG} approved${NC}"
    echo ""
}

approve_for_org "ecta" "ECTAMSP" "peer0.ecta.example.com:7051" "1"
approve_for_org "bank" "BankMSP" "peer0.bank.example.com:9051" "2"
approve_for_org "nbe" "NBEMSP" "peer0.nbe.example.com:10051" "3"
approve_for_org "customs" "CustomsMSP" "peer0.customs.example.com:11051" "4"
approve_for_org "shipping" "ShippingMSP" "peer0.shipping.example.com:12051" "5"

# ============================================================================
# STEP 6: CHECK COMMIT READINESS
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 6: CHECK COMMIT READINESS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --output json
echo ""

# ============================================================================
# STEP 7: COMMIT CHAINCODE
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 7: COMMIT CHAINCODE TO CHANNEL${NC}"
echo -e "${BLUE}============================================================================${NC}"
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
    echo -e "${RED}[ERROR] Commit failed${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS] Chaincode committed to channel${NC}"
echo ""

# ============================================================================
# STEP 8: VERIFY DEPLOYMENT
# ============================================================================
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}STEP 8: VERIFY DEPLOYMENT${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

docker exec cli peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}
echo ""

# ============================================================================
# INSTALLATION COMPLETE
# ============================================================================
echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}              BLOCKCHAIN INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Channel: ${CHANNEL_NAME}"
echo "Chaincode: ${CC_NAME}"
echo "Version: ${CC_VERSION}"
echo "Sequence: ${CC_SEQUENCE}"
echo "Package ID: ${PACKAGE_ID}"
echo ""
echo "All 5 peers joined channel"
echo "Chaincode installed on all peers"
echo "Chaincode approved by all organizations"
echo "Chaincode committed to channel"
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}                 AVAILABLE BLOCKCHAIN FUNCTIONS (140+)${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "See deploy-chaincode.sh output for complete function list"
echo ""
echo "Next Steps:"
echo "  1. Test blockchain: node test-workflow-from-registration.js"
echo "  2. Start gateway: docker-compose -f docker-compose-hybrid.yml up -d gateway"
echo "  3. Check logs: docker logs coffee-gateway"
echo ""
echo -e "${GREEN}============================================================================${NC}"
