#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Updating chaincode to use ECTA-only endorsement policy${NC}"

export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CC_VERSION="1.9"
export CC_SEQUENCE="19"
export PACKAGE_ID="ecta_1.9:7e927dcf7411283d562476cadcb8d033529c0ecabad300f561b0119d9f35b3b4"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# ECTA-only policy
POLICY="OR('ECTAMSP.peer')"

echo -e "${YELLOW}Approving for ECTA with new policy...${NC}"
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

peer lifecycle chaincode approveformyorg \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${CC_SEQUENCE} \
    --signature-policy "$POLICY"

echo -e "${GREEN}✓ ECTA approved${NC}"

# Other orgs approve (without needing chaincode installed)
for ORG_DATA in "bank:peer0.bank.example.com:9051:BankMSP" "nbe:peer0.nbe.example.com:10051:NBEMSP" "customs:peer0.customs.example.com:11051:CustomsMSP" "shipping:peer0.shipping.example.com:12051:ShippingMSP"; do
    IFS=':' read -r ORG PEER PORT MSP <<< "$ORG_DATA"
    
    echo -e "${YELLOW}Approving for ${ORG}...${NC}"
    export CORE_PEER_LOCALMSPID="${MSP}"
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
        --sequence ${CC_SEQUENCE} \
        --signature-policy "$POLICY" || echo "Failed for ${ORG}"
    
    echo -e "${GREEN}✓ ${ORG} approved${NC}"
done

echo -e "${YELLOW}Committing...${NC}"
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

peer lifecycle chaincode commit \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --signature-policy "$POLICY" \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt

echo -e "${GREEN}✓ Committed!${NC}"
peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SUCCESS! Endorsement policy updated to ECTA-only${NC}"
echo -e "${GREEN}========================================${NC}"
