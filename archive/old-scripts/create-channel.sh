#!/bin/bash
# Create and join channel script

set -e

CHANNEL_NAME="coffeechannel"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo "========================================="
echo "Creating channel: $CHANNEL_NAME"
echo "========================================="

# Create channel
peer channel create \
  -o orderer1.orderer.example.com:7050 \
  -c $CHANNEL_NAME \
  -f /etc/hyperledger/configtx/channel.tx \
  --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHANNEL_NAME}.block \
  --tls \
  --cafile $ORDERER_CA

echo "Channel created successfully"

# Join ECTA peer0
echo "Joining peer0.ecta to channel..."
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051

peer channel join -b ${CHANNEL_NAME}.block

# Join ECTA peer1
echo "Joining peer1.ecta to channel..."
export CORE_PEER_ADDRESS=peer1.ecta.example.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer1.ecta.example.com/tls/ca.crt

peer channel join -b ${CHANNEL_NAME}.block

# Join Bank peer
echo "Joining peer0.bank to channel..."
export CORE_PEER_LOCALMSPID="BankMSP"
export CORE_PEER_ADDRESS=peer0.bank.example.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/users/Admin@bank.example.com/msp

peer channel join -b ${CHANNEL_NAME}.block

# Join NBE peer
echo "Joining peer0.nbe to channel..."
export CORE_PEER_LOCALMSPID="NBEMSP"
export CORE_PEER_ADDRESS=peer0.nbe.example.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/users/Admin@nbe.example.com/msp

peer channel join -b ${CHANNEL_NAME}.block

# Join Customs peer
echo "Joining peer0.customs to channel..."
export CORE_PEER_LOCALMSPID="CustomsMSP"
export CORE_PEER_ADDRESS=peer0.customs.example.com:11051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/users/Admin@customs.example.com/msp

peer channel join -b ${CHANNEL_NAME}.block

# Join Shipping peer
echo "Joining peer0.shipping to channel..."
export CORE_PEER_LOCALMSPID="ShippingMSP"
export CORE_PEER_ADDRESS=peer0.shipping.example.com:12051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/users/Admin@shipping.example.com/msp

peer channel join -b ${CHANNEL_NAME}.block

echo "========================================="
echo "All peers joined channel successfully!"
echo "========================================="
