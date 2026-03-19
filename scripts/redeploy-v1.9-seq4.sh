#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Redeploying v1.9 Sequence 4${NC}"

export CHANNEL_NAME="coffeechannel"
export CC_NAME="ecta"
export CC_VERSION="1.9"
export CC_SEQUENCE="4"
export CRYPTO_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config"

# Package
peer lifecycle chaincode package ${CC_NAME}.tar.gz \
    --path /opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta \
    --lang node \
    --label ${CC_NAME}_${CC_VERSION}

PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep ${CC_NAME}_${CC_VERSION} | awk '{print $3}' | sed 's/,//')

# Approve all orgs
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
    
    peer lifecycle chaincode approveformyorg \
        -o orderer1.orderer.example.com:7050 \
        --ordererTLSHostnameOverride orderer1.orderer.example.com \
        --tls --cafile ${CRYPTO_PATH}/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
        -C ${CHANNEL_NAME} \
        -n ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${CC_SEQUENCE}
done

# Commit
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

echo -e "${GREEN}v1.9 Sequence 4 Deployed!${NC}"
