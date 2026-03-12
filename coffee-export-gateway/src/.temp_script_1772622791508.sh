#!/bin/sh
ARGS='{"Args":["GetUser","test_connection_user"]}'
peer chaincode query -C coffeechannel -n ecta -c "$ARGS" -o orderer1.orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem
