#!/bin/bash
# Test blockchain contract registration

echo "============================================================================"
echo "         TESTING BLOCKCHAIN CONTRACT REGISTRATION"
echo "============================================================================"
echo ""

# Simple query first to test blockchain
echo "[1/2] Testing blockchain with query..."
peer chaincode query \
  -C coffeechannel \
  -n ecta \
  -c '{"function":"GetAllUsers","Args":[]}'

if [ $? -eq 0 ]; then
  echo ""
  echo "[SUCCESS] Blockchain is operational!"
  echo ""
else
  echo ""
  echo "[WARNING] Query failed, but continuing with invoke..."
  echo ""
fi

echo "[2/2] Registering sales contract on blockchain..."
echo "Contract: ECTA-SC-20260504-56976"
echo "Exporter: Ethiopian Coffee Exports Ltd"
echo "Buyer: Tchibo GmbH"
echo ""

# Register the contract
peer chaincode invoke \
  -o orderer1.orderer.example.com:7050 \
  --ordererTLSHostnameOverride orderer1.orderer.example.com \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/ordererOrganizations/orderer.example.com/orderers/orderer1.orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem \
  -C coffeechannel \
  -n ecta \
  -c '{"function":"RegisterSalesContractWithReference","Args":["{\"draftId\":\"2ea664c5-5134-4b7a-90e6-58b52661394f\",\"exporterId\":\"USER_exporter1\",\"buyerId\":\"fb5ffcfc-0f17-4c8b-9983-f84489c2cff2\",\"buyerName\":\"Tchibo GmbH\",\"buyerCountry\":\"Germany\",\"coffeeType\":\"SPECIALTY\",\"originRegion\":\"Ethiopia\",\"quantity\":\"100.00\",\"unitPrice\":\"5.50\",\"totalValue\":\"550.00\",\"currency\":\"EUR\",\"qualityGrade\":\"Grade 1\",\"paymentMethod\":\"LC\",\"paymentTerms\":\"ADVANCE_PAYMENT\",\"incoterms\":\"FOB\",\"portOfLoading\":\"Djibouti Port\",\"portOfDischarge\":\"Hamburg Port\",\"deliveryDate\":\"2026-08-02T00:00:00.000Z\",\"governingLaw\":\"Ethiopian Law\",\"arbitrationRules\":\"ICC Rules\",\"arbitrationLocation\":\"Addis Ababa, Ethiopia\",\"ectaOfficer\":\"ecta1\"}"]}' \
  --peerAddresses peer0.ecta.example.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/ecta.example.com/peers/peer0.ecta.example.com/tls/ca.crt \
  --peerAddresses peer0.bank.example.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/bank.example.com/peers/peer0.bank.example.com/tls/ca.crt \
  --peerAddresses peer0.nbe.example.com:10051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/nbe.example.com/peers/peer0.nbe.example.com/tls/ca.crt \
  --waitForEvent

if [ $? -eq 0 ]; then
  echo ""
  echo "============================================================================"
  echo "[SUCCESS] Contract registered on blockchain!"
  echo "============================================================================"
  echo ""
else
  echo ""
  echo "[ERROR] Contract registration failed"
  exit 1
fi
