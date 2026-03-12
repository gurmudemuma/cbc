#!/bin/bash
# Deploy chaincode to Fabric network

set -e

CHANNEL_NAME="coffeechannel"
CC_NAME="ecta"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/chaincode/ecta"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo "========================================="
echo "Deploying Chaincode: $CC_NAME"
echo "========================================="

# Package chaincode
echo "Step 1: Packaging chaincode..."
peer lifecycle chaincode package ${CC_NAME}.tar.gz \
  --path ${CC_PATH} \
  --lang node \
  --label ${CC_NAME}_${CC_VERSION}

echo "Chaincode packaged: ${CC_NAME}.tar.gz"

# Install on ECTA peer0
echo "Step 2: Installing on peer0.ecta..."
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Install on ECTA peer1
echo "Installing on peer1.ecta..."
export CORE_PEER_ADDRESS=peer1.ecta.example.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Install on Bank peer
echo "Installing on peer0.bank..."
export CORE_PEER_LOCALMSPID="BankMSP"
export CORE_PEER_ADDRESS=peer0.bank.example.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Install on NBE peer
echo "Installing on peer0.nbe..."
export CORE_PEER_LOCALMSPID="NBEMSP"
export CORE_PEER_ADDRESS=peer0.nbe.example.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Install on Customs peer
echo "Installing on peer0.customs..."
export CORE_PEER_LOCALMSPID="CustomsMSP"
export CORE_PEER_ADDRESS=peer0.customs.example.com:11051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp

peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Install on Shipping peer
echo "Installing on peer0.shipping..."
export CORE_PEER_LOCALMSPID="ShippingMSP"
export CORE_PEER_ADDRESS=peer0.shipping.example.com:12051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp

peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo "Chaincode installed on all peers"

# Get package ID
echo "Step 3: Getting package ID..."
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep ${CC_NAME}_${CC_VERSION} | awk '{print $3}' | sed 's/,$//')
echo "Package ID: $PACKAGE_ID"

# Approve for ECTA
echo "Step 4: Approving chaincode for organizations..."
echo "Approving for ECTA..."
peer lifecycle chaincode approveformyorg \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $CC_SEQUENCE \
  --tls \
  --cafile $ORDERER_CA

# Approve for Bank
echo "Approving for Bank..."
export CORE_PEER_LOCALMSPID="BankMSP"
export CORE_PEER_ADDRESS=peer0.bank.example.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp

peer lifecycle chaincode approveformyorg \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $CC_SEQUENCE \
  --tls \
  --cafile $ORDERER_CA

# Approve for NBE
echo "Approving for NBE..."
export CORE_PEER_LOCALMSPID="NBEMSP"
export CORE_PEER_ADDRESS=peer0.nbe.example.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp

peer lifecycle chaincode approveformyorg \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $CC_SEQUENCE \
  --tls \
  --cafile $ORDERER_CA

# Approve for Customs
echo "Approving for Customs..."
export CORE_PEER_LOCALMSPID="CustomsMSP"
export CORE_PEER_ADDRESS=peer0.customs.example.com:11051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp

peer lifecycle chaincode approveformyorg \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $CC_SEQUENCE \
  --tls \
  --cafile $ORDERER_CA

# Approve for Shipping
echo "Approving for Shipping..."
export CORE_PEER_LOCALMSPID="ShippingMSP"
export CORE_PEER_ADDRESS=peer0.shipping.example.com:12051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp

peer lifecycle chaincode approveformyorg \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $CC_SEQUENCE \
  --tls \
  --cafile $ORDERER_CA

# Check commit readiness
echo "Step 5: Checking commit readiness..."
peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --sequence $CC_SEQUENCE \
  --tls \
  --cafile $ORDERER_CA \
  --output json

# Commit chaincode
echo "Step 6: Committing chaincode to channel..."
peer lifecycle chaincode commit \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --sequence $CC_SEQUENCE \
  --tls \
  --cafile $ORDERER_CA \
  --peerAddresses peer0.ecta.example.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
  --peerAddresses peer0.bank.example.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt

echo "========================================="
echo "Chaincode deployed successfully!"
echo "========================================="

# Query committed chaincode
echo "Verifying deployment..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CC_NAME

echo "Deployment complete!"
