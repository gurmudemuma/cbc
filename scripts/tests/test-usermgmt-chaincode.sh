#!/bin/bash

# Test user-management chaincode directly

echo "=========================================="
echo "Testing User-Management Chaincode"
echo "=========================================="
echo ""

# Set environment for commercialbank peer
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/network/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/network/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp

echo "1. Querying installed chaincodes..."
./bin/peer lifecycle chaincode queryinstalled

echo ""
echo "2. Querying committed chaincodes..."
./bin/peer lifecycle chaincode querycommitted -C coffeechannel

echo ""
echo "3. Testing user query (should return user data or error if not found)..."
./bin/peer chaincode query -C coffeechannel -n user-management -c '{"function":"GetUser","Args":["exporter_admin"]}'

echo ""
echo "=========================================="
echo "✅ Test complete"
echo "=========================================="
