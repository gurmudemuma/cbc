#!/bin/bash

export CORE_PEER_LOCALMSPID=ECTAMSP
export CORE_PEER_ADDRESS=peer0.ecta.example.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/users/Admin@ecta.example.com/msp

echo "Querying exporter1..."
peer chaincode query -C coffeechannel -n ecta -c '{"function":"GetExporterProfile","Args":["exporter1"]}'

echo ""
echo "Querying exporter2..."
peer chaincode query -C coffeechannel -n ecta -c '{"function":"GetExporterProfile","Args":["exporter2"]}'

echo ""
echo "Querying exporter3..."
peer chaincode query -C coffeechannel -n ecta -c '{"function":"GetExporterProfile","Args":["exporter3"]}'
