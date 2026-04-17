#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Redeploying v1.9 Sequence 13${NC}"

export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CC_VERSION="1.9"
export CC_SEQUENCE="13"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Approve for all orgs
for ORG in ECTAMSP BankMSP NBEMSP CustomsMSP ShippingMSP; do
    case $ORG in
        ECTAMSP)
            export CORE_PEER_LOCALMSPID="ECTAMSP"
            export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
            export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp
            ;;
        BankMSP)
            export CORE_PEER_LOCALMSPID="BankMSP"
            export CORE_PEER_ADDRESS=peer0.bank.example.com:9051
            export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp
            ;;
        NBEMSP)
            export CORE_PEER_LOCALMSPID="NBEMSP"
            export CORE_PEER_ADDRESS=peer0.nbe.example.com:10051
            export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp
            ;;
        CustomsMSP)
            export CORE_PEER_LOCALMSPID="CustomsMSP"
            export CORE_PEER_ADDRESS=peer0.customs.example.com:11051
            export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp
            ;;
        ShippingMSP)
            export CORE_PEER_LOCALMSPID="ShippingMSP"
            export CORE_PEER_ADDRESS=peer0.shipping.example.com:12051
            export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt
            export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp
            ;;
    esac
    
    echo -e "${YELLOW}Approving for ${ORG}...${NC}"
    peer lifecycle chaincode approveformyorg \
        -o orderer1.orderer.example.com:7050 \
        --ordererTLSHostnameOverride orderer1.orderer.example.com \
        --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
        -C ${CHANNEL_NAME} \
        -n ${CC_NAME} \
        -v ${CC_VERSION} \
        --package-id ecta_${CC_VERSION}:62399f3a4b8054bd3b637eb76b1b24caa08bff0c54bd28e5b7bce9befebb9c57 \
        --sequence ${CC_SEQUENCE} \
        --signature-policy "OR('ECTAMSP.peer')" \
        --tls \
        --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem 2>&1 | tail -2
done

# Commit
echo -e "${YELLOW}Committing chaincode...${NC}"
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${CRYPTO_PATH}/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

peer lifecycle chaincode commit \
    -o orderer1.orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer1.orderer.example.com \
    --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    -v ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --signature-policy "OR('ECTAMSP.peer')" \
    --tls \
    --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
    --peerAddresses peer0.ecta.example.com:7051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
    --peerAddresses peer0.bank.example.com:9051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
    --peerAddresses peer0.nbe.example.com:10051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
    --peerAddresses peer0.customs.example.com:11051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
    --peerAddresses peer0.shipping.example.com:12051 \
    --tlsRootCertFiles ${CRYPTO_PATH}/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt 2>&1 | tail -3

echo -e "${GREEN}v1.9 Sequence 13 Deployed!${NC}"
