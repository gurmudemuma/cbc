#!/bin/bash
set -e

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=ECTAMSP
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

echo "Testing chaincode invocation..."

peer chaincode invoke \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
  -C coffeechannel \
  -n ecta \
  -c '{"function":"InitLedger","Args":[]}' \
  --peerAddresses peer0.ecta.example.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt

echo "Invoke completed!"
