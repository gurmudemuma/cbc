#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Installing Chaincode on Missing Peers${NC}"

PACKAGE_FILE="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta-v1.9-complete.tar.gz"
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Function to check and install chaincode on a peer
check_and_install() {
    local ORG=$1
    local PEER=$2
    local PORT=$3
    local MSP_ID=$4
    
    echo -e "${YELLOW}Checking ${ORG} (${PEER}:${PORT})...${NC}"
    
    export CORE_PEER_LOCALMSPID="${MSP_ID}"
    export CORE_PEER_ADDRESS=${PEER}:${PORT}
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER}/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp
    
    # Check if already installed
    if peer lifecycle chaincode queryinstalled 2>&1 | grep -q "ecta_1.9_complete"; then
        echo -e "${GREEN}✓ Already installed on ${ORG}${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Installing on ${ORG}...${NC}"
    peer lifecycle chaincode install ${PACKAGE_FILE} 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Installed on ${ORG}${NC}"
    else
        echo -e "${RED}✗ Failed to install on ${ORG}${NC}"
    fi
}

echo -e "${YELLOW}Checking all peers...${NC}"
check_and_install "ecta" "peer0.ecta.example.com" "7051" "ECTAMSP"
check_and_install "ecta" "peer1.ecta.example.com" "8051" "ECTAMSP"
check_and_install "bank" "peer0.bank.example.com" "9051" "BankMSP"
check_and_install "nbe" "peer0.nbe.example.com" "10051" "NBEMSP"
check_and_install "customs" "peer0.customs.example.com" "11051" "CustomsMSP"
check_and_install "shipping" "peer0.shipping.example.com" "12051" "ShippingMSP"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Check Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
