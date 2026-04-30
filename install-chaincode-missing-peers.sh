#!/bin/bash

# Install ECTA chaincode on missing peers
# Package ID from peer0.ecta: ecta_1.0:a86f9be6b333eeb6ce533cdc213f5f8d16f7b5e3a5db4af295bf589d2d9c4692

CHAINCODE_PACKAGE="/opt/gopath/src/github.com/hyperledger/fabric/peer/ecta.tar.gz"

echo "========================================="
echo "Installing ECTA Chaincode on Missing Peers"
echo "========================================="

# Install on peer0.nbe
echo ""
echo "Installing on peer0.nbe..."
docker exec \
  -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 \
  -e CORE_PEER_LOCALMSPID=NBEMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp \
  cli peer lifecycle chaincode install $CHAINCODE_PACKAGE

# Install on peer0.customs
echo ""
echo "Installing on peer0.customs..."
docker exec \
  -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 \
  -e CORE_PEER_LOCALMSPID=CustomsMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp \
  cli peer lifecycle chaincode install $CHAINCODE_PACKAGE

# Install on peer0.shipping
echo ""
echo "Installing on peer0.shipping..."
docker exec \
  -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 \
  -e CORE_PEER_LOCALMSPID=ShippingMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp \
  cli peer lifecycle chaincode install $CHAINCODE_PACKAGE

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Verifying installations..."

# Verify peer0.nbe
echo ""
echo "peer0.nbe installed chaincodes:"
docker exec \
  -e CORE_PEER_ADDRESS=peer0.nbe.example.com:10051 \
  -e CORE_PEER_LOCALMSPID=NBEMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp \
  cli peer lifecycle chaincode queryinstalled

# Verify peer0.customs
echo ""
echo "peer0.customs installed chaincodes:"
docker exec \
  -e CORE_PEER_ADDRESS=peer0.customs.example.com:11051 \
  -e CORE_PEER_LOCALMSPID=CustomsMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp \
  cli peer lifecycle chaincode queryinstalled

# Verify peer0.shipping
echo ""
echo "peer0.shipping installed chaincodes:"
docker exec \
  -e CORE_PEER_ADDRESS=peer0.shipping.example.com:12051 \
  -e CORE_PEER_LOCALMSPID=ShippingMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp \
  cli peer lifecycle chaincode queryinstalled

echo ""
echo "Done!"
