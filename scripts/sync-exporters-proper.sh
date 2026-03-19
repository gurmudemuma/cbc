#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Syncing Exporter Qualifications (Proper Structure)${NC}"

export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

FIXED_TIMESTAMP="2026-03-17T12:00:00.000Z"

# Exporter 1 - Update with proper nested structure
echo -e "${YELLOW}Updating exporter1 preRegistrationStatus...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"UpdateExporterProfile","Args":["exporter1","{\"preRegistrationStatus\":{\"profile\":{\"status\":\"ACTIVE\",\"approved\":true,\"submittedAt\":\"'${FIXED_TIMESTAMP}'\"},\"laboratory\":{\"status\":\"ACTIVE\",\"certified\":true,\"certificationNumber\":\"CERT-LAB-1773744666301\"},\"taster\":{\"status\":\"ACTIVE\",\"verified\":true,\"certificateNumber\":\"PROF-CERT-1773744666404\"},\"competenceCertificate\":{\"status\":\"ACTIVE\",\"valid\":true,\"certificateNumber\":\"COMP-CERT-1773744666528\"},\"exportLicense\":{\"status\":\"ACTIVE\",\"valid\":true,\"licenseNumber\":\"EXP-LIC-1773744666607-qa56exl1n\"}},\"isQualified\":true,\"updatedAt\":\"'${FIXED_TIMESTAMP}'\"}"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -2

# Exporter 2
echo -e "${YELLOW}Updating exporter2 preRegistrationStatus...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"UpdateExporterProfile","Args":["exporter2","{\"preRegistrationStatus\":{\"profile\":{\"status\":\"ACTIVE\",\"approved\":true,\"submittedAt\":\"'${FIXED_TIMESTAMP}'\"},\"laboratory\":{\"status\":\"ACTIVE\",\"certified\":true,\"certificationNumber\":\"CERT-LAB-1773744666693\"},\"taster\":{\"status\":\"ACTIVE\",\"verified\":true,\"certificateNumber\":\"PROF-CERT-1773744666730\"},\"competenceCertificate\":{\"status\":\"ACTIVE\",\"valid\":true,\"certificateNumber\":\"COMP-CERT-1773744666829\"},\"exportLicense\":{\"status\":\"ACTIVE\",\"valid\":true,\"licenseNumber\":\"EXP-LIC-1773744666873-9ewrz9uu2\"}},\"isQualified\":true,\"updatedAt\":\"'${FIXED_TIMESTAMP}'\"}"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -2

# Exporter 3
echo -e "${YELLOW}Updating exporter3 preRegistrationStatus...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"UpdateExporterProfile","Args":["exporter3","{\"preRegistrationStatus\":{\"profile\":{\"status\":\"PENDING_APPROVAL\",\"approved\":false,\"submittedAt\":\"'${FIXED_TIMESTAMP}'\"},\"laboratory\":{\"status\":\"MISSING\",\"certified\":false},\"taster\":{\"status\":\"MISSING\",\"verified\":false},\"competenceCertificate\":{\"status\":\"MISSING\",\"valid\":false},\"exportLicense\":{\"status\":\"MISSING\",\"valid\":false}},\"isQualified\":false,\"updatedAt\":\"'${FIXED_TIMESTAMP}'\"}"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -2

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Sync Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
