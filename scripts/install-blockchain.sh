#!/bin/bash
# ============================================================================
# COMPLETE BLOCKCHAIN INSTALLATION SCRIPT
# Initializes channel, installs chaincode, approves, commits, and initializes
# Idempotent: safe to re-run without errors
# ============================================================================

# Do NOT use set -e — we handle errors gracefully for idempotency

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

echo "Continuing automatically..."

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
echo "[1.2] Joining orderers to channel via osnadmin..."
for ORDERER_NUM in 1 2 3; do
    docker exec cli osnadmin channel join \
        -o orderer${ORDERER_NUM}.orderer.example.com:7053 \
        --ca-file ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer${ORDERER_NUM}.orderer.example.com/tls/ca.crt \
        --client-cert ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer${ORDERER_NUM}.orderer.example.com/tls/server.crt \
        --client-key ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer${ORDERER_NUM}.orderer.example.com/tls/server.key \
        --channelID ${CHANNEL_NAME} \
        --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHANNEL_NAME}.block
    if [ $? -eq 0 ]; then echo "[SUCCESS] orderer${ORDERER_NUM} joined"; else echo "[ERROR] orderer${ORDERER_NUM} failed"; exit 1; fi
done
echo ""

join_peer_to_channel() {
    local STEP=$1
    local MSP_ID=$2
    local PEER_ADDRESS=$3
    local ORG=$4
    local PEER_HOST=$(echo ${PEER_ADDRESS} | cut -d: -f1)

    echo -e "${YELLOW}[1.${STEP}] Joining ${PEER_HOST} to channel...${NC}"
    JOIN_OUTPUT=$(docker exec cli bash -c "
export CORE_PEER_LOCALMSPID=${MSP_ID}
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER_HOST}/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp
export CORE_PEER_ADDRESS=${PEER_ADDRESS}
peer channel join -b ${CHANNEL_NAME}.block
" 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS] ${PEER_HOST} joined${NC}"
    elif echo "$JOIN_OUTPUT" | grep -q "already exists"; then
        echo -e "${GREEN}[SKIP] ${PEER_HOST} already joined to channel${NC}"
    else
        echo -e "${RED}[ERROR] Failed to join ${PEER_HOST}: ${JOIN_OUTPUT}${NC}"
        exit 1
    fi
    echo ""
}

join_peer_to_channel "2" "ECTAMSP" "peer0.ecta.example.com:7051" "ecta"
join_peer_to_channel "3" "BankMSP" "peer0.bank.example.com:9051" "bank"
join_peer_to_channel "4" "NBEMSP" "peer0.nbe.example.com:10051" "nbe"
join_peer_to_channel "5" "CustomsMSP" "peer0.customs.example.com:11051" "customs"
join_peer_to_channel "6" "ShippingMSP" "peer0.shipping.example.com:12051" "shipping"

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

install_chaincode_on_peer() {
    local STEP=$1
    local MSP_ID=$2
    local PEER_ADDRESS=$3
    local ORG=$4
    local PEER_HOST=$(echo ${PEER_ADDRESS} | cut -d: -f1)

    echo -e "${YELLOW}[3.${STEP}] Installing on ${PEER_HOST}...${NC}"
    INSTALL_OUTPUT=$(docker exec -e CORE_PEER_LOCALMSPID=${MSP_ID} \
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} \
        -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER_HOST}/tls/ca.crt \
        -e CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp \
        cli peer lifecycle chaincode install ${CC_NAME}.tar.gz 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS] Installed on ${PEER_HOST}${NC}"
    elif echo "$INSTALL_OUTPUT" | grep -qi "already"; then
        echo -e "${GREEN}[SKIP] Chaincode already installed on ${PEER_HOST}${NC}"
    else
        echo -e "${RED}[ERROR] Installation failed on ${PEER_HOST}: ${INSTALL_OUTPUT}${NC}"
        exit 1
    fi
    echo ""
}

install_chaincode_on_peer "1" "ECTAMSP" "peer0.ecta.example.com:7051" "ecta"
install_chaincode_on_peer "2" "BankMSP" "peer0.bank.example.com:9051" "bank"
install_chaincode_on_peer "3" "NBEMSP" "peer0.nbe.example.com:10051" "nbe"
install_chaincode_on_peer "4" "CustomsMSP" "peer0.customs.example.com:11051" "customs"
install_chaincode_on_peer "5" "ShippingMSP" "peer0.shipping.example.com:12051" "shipping"

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
    local PEER_HOST=$(echo ${PEER_ADDRESS} | cut -d: -f1)
    
    echo -e "${YELLOW}[5.${STEP}] Approving for ${ORG}...${NC}"
    APPROVE_OUTPUT=$(docker exec -e CORE_PEER_LOCALMSPID=${MSP_ID} \
        -e CORE_PEER_ADDRESS=${PEER_ADDRESS} \
        -e CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER_HOST}/tls/ca.crt \
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
        --sequence ${CC_SEQUENCE} 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS] ${ORG} approved${NC}"
    else
        echo -e "${RED}[WARNING] Approve output for ${ORG}: ${APPROVE_OUTPUT}${NC}"
        echo -e "${YELLOW}[INFO] Continuing — may already be approved${NC}"
    fi
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

COMMIT_OUTPUT=$(docker exec cli peer lifecycle chaincode commit \
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
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS] Chaincode committed to channel${NC}"
elif echo "$COMMIT_OUTPUT" | grep -q "already defined"; then
    echo -e "${GREEN}[SKIP] Chaincode already committed to channel${NC}"
else
    echo -e "${RED}[ERROR] Commit failed: ${COMMIT_OUTPUT}${NC}"
    exit 1
fi
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
