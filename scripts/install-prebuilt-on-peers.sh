#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Installing pre-built chaincode on Bank and NBE peers${NC}"

PACKAGE_FILE="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta-v1.9-complete.tar.gz"
CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Install on Bank peer
echo -e "${YELLOW}Installing on Bank peer...${NC}"
export CORE_PEER_LOCALMSPID="BankMSP"
export CORE_PEER_ADDRESS=peer0.bank.example.com:9051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp

peer lifecycle chaincode install ${PACKAGE_FILE}
echo -e "${GREEN}✓ Installed on Bank${NC}"

# Install on NBE peer
echo -e "${YELLOW}Installing on NBE peer...${NC}"
export CORE_PEER_LOCALMSPID="NBEMSP"
export CORE_PEER_ADDRESS=peer0.nbe.example.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp

peer lifecycle chaincode install ${PACKAGE_FILE}
echo -e "${GREEN}✓ Installed on NBE${NC}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}Chaincode now on 3/5 orgs (MAJORITY satisfied)${NC}"
echo -e "${GREEN}========================================${NC}"
