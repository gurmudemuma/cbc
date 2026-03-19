#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Installing Chaincode on All Peers${NC}"

PACKAGE_FILE="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta-v1.9-complete.tar.gz"
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Function to install chaincode on a peer
install_on_peer() {
    local ORG=$1
    local PEER=$2
    local PORT=$3
    local MSP_ID=$4
    
    echo -e "${YELLOW}Installing on ${ORG} (${PEER}:${PORT})...${NC}"
    
    export CORE_PEER_LOCALMSPID="${MSP_ID}"
    export CORE_PEER_ADDRESS=${PEER}:${PORT}
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/peers/${PEER}/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp
    
    peer lifecycle chaincode install ${PACKAGE_FILE} 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Installed on ${ORG}${NC}"
    else
        echo -e "${YELLOW}Note: Installation on ${ORG} may have failed or already exists${NC}"
    fi
}

echo -e "${YELLOW}Installing chaincode on all peers...${NC}"
install_on_peer "ecta" "peer0.ecta.example.com" "7051" "ECTAMSP"
install_on_peer "ecta" "peer1.ecta.example.com" "8051" "ECTAMSP"
install_on_peer "bank" "peer0.bank.example.com" "9051" "BankMSP"
install_on_peer "nbe" "peer0.nbe.example.com" "10051" "NBEMSP"
install_on_peer "customs" "peer0.customs.example.com" "11051" "CustomsMSP"
install_on_peer "shipping" "peer0.shipping.example.com" "12051" "ShippingMSP"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}Chaincode installed on all 6 peers${NC}"
echo -e "${GREEN}========================================${NC}"
