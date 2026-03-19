#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Syncing Qualifications to Blockchain (ECTA-only endorsement)${NC}"

export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Set ECTA peer context (for signing)
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

# Use a fixed timestamp for all updates to ensure determinism
FIXED_TIMESTAMP="2026-03-17T12:00:00.000Z"

# Exporter 1 - Fully Qualified
echo -e "${YELLOW}Syncing exporter1 (Fully Qualified)...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"UpdateExporterProfile","Args":["exporter1","{\"exporterId\":\"exporter1\",\"businessName\":\"Ethiopian Coffee Exports Ltd\",\"tin\":\"TIN0000000002\",\"preRegistrationStatus\":{\"profile\":{\"status\":\"ACTIVE\",\"approved\":true},\"laboratory\":{\"status\":\"ACTIVE\",\"certified\":true,\"certificationNumber\":\"CERT-LAB-1773744666301\"},\"taster\":{\"status\":\"ACTIVE\",\"verified\":true,\"certificateNumber\":\"PROF-CERT-1773744666404\"},\"competenceCertificate\":{\"status\":\"ACTIVE\",\"valid\":true,\"certificateNumber\":\"COMP-CERT-1773744666528\"},\"license\":{\"status\":\"ACTIVE\",\"valid\":true,\"licenseNumber\":\"EXP-LIC-1773744666607-qa56exl1n\"}},\"isQualified\":true,\"updatedAt\":\"'${FIXED_TIMESTAMP}'\"}"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3

# Exporter 2 - Fully Qualified
echo -e "${YELLOW}Syncing exporter2 (Fully Qualified)...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"UpdateExporterProfile","Args":["exporter2","{\"exporterId\":\"exporter2\",\"businessName\":\"Addis Coffee Trading PLC\",\"tin\":\"TIN0000000003\",\"preRegistrationStatus\":{\"profile\":{\"status\":\"ACTIVE\",\"approved\":true},\"laboratory\":{\"status\":\"ACTIVE\",\"certified\":true,\"certificationNumber\":\"CERT-LAB-1773744666693\"},\"taster\":{\"status\":\"ACTIVE\",\"verified\":true,\"certificateNumber\":\"PROF-CERT-1773744666730\"},\"competenceCertificate\":{\"status\":\"ACTIVE\",\"valid\":true,\"certificateNumber\":\"COMP-CERT-1773744666829\"},\"license\":{\"status\":\"ACTIVE\",\"valid\":true,\"licenseNumber\":\"EXP-LIC-1773744666873-9ewrz9uu2\"}},\"isQualified\":true,\"updatedAt\":\"'${FIXED_TIMESTAMP}'\"}"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3

# Exporter 3 - Not Qualified (pending approval)
echo -e "${YELLOW}Syncing exporter3 (Pending Approval)...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"UpdateExporterProfile","Args":["exporter3","{\"exporterId\":\"exporter3\",\"businessName\":\"Sidamo Coffee Traders\",\"tin\":\"TIN0000000004\",\"preRegistrationStatus\":{\"profile\":{\"status\":\"PENDING_APPROVAL\",\"approved\":false},\"laboratory\":{\"status\":\"MISSING\",\"certified\":false,\"certificationNumber\":null},\"taster\":{\"status\":\"MISSING\",\"verified\":false,\"certificateNumber\":null},\"competenceCertificate\":{\"status\":\"MISSING\",\"valid\":false,\"certificateNumber\":null},\"license\":{\"status\":\"MISSING\",\"valid\":false,\"licenseNumber\":null}},\"isQualified\":false,\"updatedAt\":\"'${FIXED_TIMESTAMP}'\"}"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Blockchain Sync Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
