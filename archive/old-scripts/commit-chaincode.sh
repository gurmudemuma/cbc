#!/bin/bash
# Commit chaincode to channel with proper endorsements

set -e

CHANNEL_NAME="coffeechannel"
CC_NAME="ecta"
CC_VERSION="1.0"
CC_SEQUENCE="1"
PACKAGE_ID="ecta_1.0:60327d797bc9a87828f63c2218022559a79c63c0925e8dddff8c1e034f2f205e"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem

echo "========================================="
echo "Committing Chaincode: $CC_NAME"
echo "========================================="

# Set to ECTA org for commit
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

echo "Committing chaincode with endorsements from all organizations..."
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
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
  --peerAddresses peer0.nbe.example.com:10051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
  --peerAddresses peer0.customs.example.com:11051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.example.com/peers/peer0.customs.example.com/tls/ca.crt \
  --peerAddresses peer0.shipping.example.com:12051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/shipping.example.com/peers/peer0.shipping.example.com/tls/ca.crt

echo "========================================="
echo "Chaincode committed successfully!"
echo "========================================="

# Verify commitment
echo "Verifying chaincode commitment..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CC_NAME

echo "Deployment complete!"
