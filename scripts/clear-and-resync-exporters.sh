#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CLEARING OLD EXPORTER DATA${NC}"
echo -e "${GREEN}========================================${NC}\n"

export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Set ECTA peer context
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

# Query existing exporters to see what we have
echo -e "${YELLOW}Querying existing exporters...${NC}"
peer chaincode query \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"GetExporterProfile","Args":["exporter1"]}' 2>&1 | head -5 || echo "exporter1 not found"

# Delete exporter1
echo -e "${YELLOW}Deleting exporter1...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"DeleteState","Args":["exporter1"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3 || echo "Delete may have failed, continuing..."

echo -e "${YELLOW}Deleting exporter2...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"DeleteState","Args":["exporter2"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3 || echo "Delete may have failed, continuing..."

echo -e "${YELLOW}Deleting exporter3...${NC}"
peer chaincode invoke \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -c '{"function":"DeleteState","Args":["exporter3"]}' \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3 || echo "Delete may have failed, continuing..."

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}RESYNCING EXPORTER DATA${NC}"
echo -e "${GREEN}========================================${NC}\n"

FIXED_TIMESTAMP="2026-03-17T12:00:00.000Z"

# Resync exporter1
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
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3

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
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3

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
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
    --waitForEvent 2>&1 | tail -3

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}SYNC COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}\n"
