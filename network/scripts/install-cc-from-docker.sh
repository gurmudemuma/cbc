#!/bin/bash

# This script runs INSIDE the CLI container

CHANNEL_NAME="coffeechannel"
CC_NAME="coffee-export"
CC_VERSION="1.0"
CC_SEQUENCE="1"
WORKDIR="/opt/gopath/src/github.com/hyperledger/fabric/peer"

cd $WORKDIR

echo "=========================================="
echo "Installing Chaincode: $CC_NAME"
echo "=========================================="

# Set TLS enabled
export CORE_PEER_TLS_ENABLED=true

# Step 1: Install on all peers
echo "Step 1: Installing chaincode on all peers..."

# Install on commercialbank
echo "Installing on commercialbank peer..."
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

# Install on NationalBank
echo "Installing on NationalBank peer..."
export CORE_PEER_LOCALMSPID="NationalBankMSP"
export CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp
peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

# Install on ECTA
echo "Installing on ECTA peer..."
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.coffee-export.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/ecta.coffee-export.com/users/Admin@ecta.coffee-export.com/msp
peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

# Install on ShippingLine
echo "Installing on ShippingLine peer..."
export CORE_PEER_LOCALMSPID="ShippingLineMSP"
export CORE_PEER_ADDRESS=peer0.shippingline.coffee-export.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp
peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

echo "✅ Chaincode installed on all peers"
echo ""

# Step 2: Get package ID
echo "Step 2: Getting chaincode package ID..."
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp

PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep ${CC_NAME}_${CC_VERSION} | sed 's/.*Package ID: \(.*\), Label.*/\1/')
echo "Package ID: $PACKAGE_ID"
echo ""

# Step 3: Approve for all orgs
echo "Step 3: Approving chaincode for all organizations..."

# Approve for commercialbank
echo "Approving for commercialbank..."
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Approve for NationalBank
echo "Approving for NationalBank..."
export CORE_PEER_LOCALMSPID="NationalBankMSP"
export CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp
peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Approve for ECTA
echo "Approving for ECTA..."
export CORE_PEER_LOCALMSPID="ECTAMSP"
export CORE_PEER_ADDRESS=peer0.ecta.coffee-export.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/ecta.coffee-export.com/users/Admin@ecta.coffee-export.com/msp
peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Approve for ShippingLine
echo "Approving for ShippingLine..."
export CORE_PEER_LOCALMSPID="ShippingLineMSP"
export CORE_PEER_ADDRESS=peer0.shippingline.coffee-export.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp
peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

echo "✅ Chaincode approved by all organizations"
echo ""

# Step 4: Commit
echo "Step 4: Committing chaincode to channel..."
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp

peer lifecycle chaincode commit -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --sequence $CC_SEQUENCE --tls --cafile $WORKDIR/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
    --peerAddresses peer0.commercialbank.coffee-export.com:7051 --tlsRootCertFiles $WORKDIR/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    --peerAddresses peer0.nationalbank.coffee-export.com:8051 --tlsRootCertFiles $WORKDIR/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
    --peerAddresses peer0.ecta.coffee-export.com:9051 --tlsRootCertFiles $WORKDIR/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
    --peerAddresses peer0.shippingline.coffee-export.com:10051 --tlsRootCertFiles $WORKDIR/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt

echo ""
echo "=========================================="
echo "✅ Chaincode deployed successfully!"
echo "=========================================="
