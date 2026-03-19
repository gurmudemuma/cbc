#!/bin/bash
# Join orderers to channel using Channel Participation API (Fabric 2.3+)

set -e

CHANNEL_NAME="coffeechannel"
CHANNEL_BLOCK="/opt/gopath/src/github.com/hyperledger/fabric/peer/${CHANNEL_NAME}.block"

echo "========================================="
echo "Joining orderers to channel: $CHANNEL_NAME"
echo "========================================="

# Join orderer1
echo "Joining orderer1..."
osnadmin channel join \
  --channelID $CHANNEL_NAME \
  --config-block $CHANNEL_BLOCK \
  -o orderer1.orderer.example.com:7053 \
  --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
  --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.crt \
  --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/tls/server.key

# Join orderer2
echo "Joining orderer2..."
osnadmin channel join \
  --channelID $CHANNEL_NAME \
  --config-block $CHANNEL_BLOCK \
  -o orderer2.orderer.example.com:8053 \
  --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
  --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.crt \
  --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer2.orderer.example.com/tls/server.key

# Join orderer3
echo "Joining orderer3..."
osnadmin channel join \
  --channelID $CHANNEL_NAME \
  --config-block $CHANNEL_BLOCK \
  -o orderer3.orderer.example.com:9053 \
  --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
  --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.crt \
  --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer3.orderer.example.com/tls/server.key

echo "========================================="
echo "All orderers joined channel successfully!"
echo "========================================="
