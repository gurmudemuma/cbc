#!/bin/bash
#
# Hyperledger Fabric Chaincode Deployment Script v1.9
# Expert-level deployment with proper error handling
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Chaincode Deployment v1.9${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CC_VERSION="1.9"
export CC_SEQUENCE="2"
export CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta"
export CC_RUNTIME_LANGUAGE="node"
export CC_SRC_LANGUAGE="javascript"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Set CLI environment for ECTA
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051

echo -e "${YELLOW}Step 1: Packaging chaincode...${NC}"
peer lifecycle chaincode package /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta-v${CC_VERSION}.tar.gz \
    --path ${CC_SRC_PATH} \
    --lang ${CC_RUNTIME_LANGUAGE} \
    --label ${CC_NAME}_${CC_VERSION}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Chaincode packaged successfully${NC}"
else
    echo -e "${RED}✗ Failed to package chaincode${NC}"
    exit 1
fi

# Function to install chaincode on a peer
install_chaincode() {
    local ORG=$1
    local PEER=$2
    local PORT=$3
    local MSP_ID=$4
    
    echo -e "${YELLOW}Installing on ${ORG} ${PEER}...${NC}"
    
    export CORE_PEER_LOCALMSPID="${MSP_ID}"
    export CORE_PEER_ADDRESS=${PEER}:${PORT}
    export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER}/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp
    
    peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta-v${CC_VERSION}.tar.gz
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Installed on ${PEER}${NC}"
    else
        echo -e "${RED}✗ Failed to install on ${PEER}${NC}"
    fi
}

echo -e "${YELLOW}Step 2: Installing chaincode on all peers...${NC}"

# Install on ECTA peers
install_chaincode "ecta" "peer0.ecta.example.com" "7051" "ECTAMSP"
install_chaincode "ecta" "peer1.ecta.example.com" "8051" "ECTAMSP"

# Install on other organization peers
install_chaincode "bank" "peer0.bank.example.com" "9051" "BankMSP"
install_chaincode "nbe" "peer0.nbe.example.com" "10051" "NBEMSP"
install_chaincode "customs" "peer0.customs.example.com" "11051" "CustomsMSP"
install_chaincode "shipping" "peer0.shipping.example.com" "12051" "ShippingMSP"

echo -e "${YELLOW}Step 3: Querying installed chaincode...${NC}"
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

peer lifecycle chaincode queryinstalled >&log.txt
cat log.txt
export PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
echo -e "${GREEN}Package ID: ${PACKAGE_ID}${NC}"

# Function to approve chaincode for an organization
approve_chaincode() {
    local ORG=$1
    local PEER=$2
    local PORT=$3
    local MSP_ID=$4
    
    echo -e "${YELLOW}Approving for ${ORG}...${NC}"
    
    export CORE_PEER_LOCALMSPID="${MSP_ID}"
    export CORE_PEER_ADDRESS=${PEER}:${PORT}
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
        --sequence ${CC_SEQUENCE}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Approved for ${ORG}${NC}"
    else
        echo -e "${RED}✗ Failed to approve for ${ORG}${NC}"
    fi
}

echo -e "${YELLOW}Step 4: Approving chaincode for all organizations...${NC}"

approve_chaincode "ecta" "peer0.ecta.example.com" "7051" "ECTAMSP"
approve_chaincode "bank" "peer0.bank.example.com" "9051" "BankMSP"
approve_chaincode "nbe" "peer0.nbe.example.com" "10051" "NBEMSP"
approve_chaincode "customs" "peer0.customs.example.com" "11051" "CustomsMSP"
approve_chaincode "shipping" "peer0.shipping.example.com" "12051" "ShippingMSP"

echo -e "${YELLOW}Step 5: Checking commit readiness...${NC}"
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --output json

echo -e "${YELLOW}Step 6: Committing chaincode definition...${NC}"
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
    echo -e "${GREEN}✓ Chaincode committed successfully${NC}"
else
    echo -e "${RED}✗ Failed to commit chaincode${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 7: Querying committed chaincode...${NC}"
peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Chaincode Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Chaincode: ${CC_NAME}${NC}"
echo -e "${GREEN}Version: ${CC_VERSION}${NC}"
echo -e "${GREEN}Channel: ${CHANNEL_NAME}${NC}"
echo -e "${GREEN}========================================${NC}"
