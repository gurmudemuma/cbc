#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Deploying Chaincode v1.9 (Sequence 18)${NC}"

export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CC_VERSION="1.9"
export CC_SEQUENCE="18"
export PACKAGE_ID="ecta_1.9:7e927dcf7411283d562476cadcb8d033529c0ecabad300f561b0119d9f35b3b4"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Function to approve chaincode
approve_chaincode() {
    local ORG=$1
    local PEER=$2
    local PORT=$3
    local MSP_ID=$4
    
    echo -e "${YELLOW}Approving for ${ORG}...${NC}"
    
    export CORE_PEER_LOCALMSPID="${MSP_ID}"
    export CORE_PEER_ADDRESS=${PEER}:${PORT}
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER}/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp
    
    peer lifecycle chaincode approveformyorg \
        -o orderer1.orderer.example.com:7050 \
        --ordererTLSHostnameOverride orderer1.orderer.example.com \
        --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${CC_SEQUENCE} 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Approved for ${ORG}${NC}"
    else
        echo -e "${YELLOW}Note: ${ORG} approval may have failed or already exists${NC}"
    fi
}

echo -e "${YELLOW}Step 1: Approving for all organizations...${NC}"
approve_chaincode "ecta" "peer0.ecta.example.com" "7051" "ECTAMSP"
approve_chaincode "bank" "peer0.bank.example.com" "9051" "BankMSP"
approve_chaincode "nbe" "peer0.nbe.example.com" "10051" "NBEMSP"
approve_chaincode "customs" "peer0.customs.example.com" "11051" "CustomsMSP"
approve_chaincode "shipping" "peer0.shipping.example.com" "12051" "ShippingMSP"

echo -e "${YELLOW}Step 2: Checking commit readiness...${NC}"
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --output json

echo -e "${YELLOW}Step 3: Committing chaincode...${NC}"
peer lifecycle chaincode commit \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Chaincode v1.9 committed successfully!${NC}"
else
    echo -e "${YELLOW}Commit may have failed - checking status...${NC}"
fi

echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"
peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
