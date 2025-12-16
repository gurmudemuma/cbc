#!/bin/bash

# Install and deploy chaincode using CLI container
# This script must be run from the network directory

CHANNEL_NAME="coffeechannel"
CC_NAME="coffee-export"
CC_VERSION="1.0"
CC_SEQUENCE="1"

echo "=========================================="
echo "Installing Chaincode: $CC_NAME"
echo "=========================================="
echo ""

# Check if package exists
if [ ! -f "${CC_NAME}.tar.gz" ]; then
    echo "❌ Chaincode package ${CC_NAME}.tar.gz not found!"
    echo "Run: peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ../chaincode/${CC_NAME} --lang golang --label ${CC_NAME}_${CC_VERSION}"
    exit 1
fi

# Copy package to a location accessible by CLI container
echo "Preparing chaincode package..."
cp ${CC_NAME}.tar.gz channel-artifacts/
echo "✅ Package ready"
echo ""

# Install on all peers
echo "Step 1: Installing chaincode on all peers..."

# Install on CommercialBank peer
echo "Installing on CommercialBank peer..."
docker exec -e CORE_PEER_LOCALMSPID=CommercialBankMSP \
    -e CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp \
    cli peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

# Install on NationalBank peer
echo "Installing on NationalBank peer..."
docker exec -e CORE_PEER_LOCALMSPID=NationalBankMSP \
    -e CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp \
    cli peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

# Install on ECTA peer
echo "Installing on ECTA peer..."
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP \
    -e CORE_PEER_ADDRESS=peer0.ecta.coffee-export.com:9051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/users/Admin@ecta.coffee-export.com/msp \
    cli peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

# Install on ShippingLine peer
echo "Installing on ShippingLine peer..."
docker exec -e CORE_PEER_LOCALMSPID=ShippingLineMSP \
    -e CORE_PEER_ADDRESS=peer0.shippingline.coffee-export.com:10051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp \
    cli peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

# Install on CustomAuthorities peer
echo "Installing on CustomAuthorities peer..."
docker exec -e CORE_PEER_LOCALMSPID=CustomAuthoritiesMSP \
    -e CORE_PEER_ADDRESS=peer0.custom-authorities.coffee-export.com:11051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/users/Admin@custom-authorities.coffee-export.com/msp \
    cli peer lifecycle chaincode install channel-artifacts/${CC_NAME}.tar.gz

echo "✅ Chaincode installed on all peers"
echo ""

# Query installed chaincode to get package ID
echo "Step 2: Getting chaincode package ID..."
PACKAGE_ID=$(docker exec -e CORE_PEER_LOCALMSPID=CommercialBankMSP \
    -e CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp \
    cli peer lifecycle chaincode queryinstalled | grep ${CC_NAME}_${CC_VERSION} | sed 's/.*Package ID: \(.*\), Label.*/\1/')

echo "Package ID: $PACKAGE_ID"
echo ""

# Approve for all organizations
echo "Step 3: Approving chaincode for all organizations..."

# Approve for CommercialBank
echo "Approving for CommercialBank..."
docker exec -e CORE_PEER_LOCALMSPID=CommercialBankMSP \
    -e CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp \
    cli peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Approve for NationalBank
echo "Approving for NationalBank..."
docker exec -e CORE_PEER_LOCALMSPID=NationalBankMSP \
    -e CORE_PEER_ADDRESS=peer0.nationalbank.coffee-export.com:8051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp \
    cli peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Approve for ECTA
echo "Approving for ECTA..."
docker exec -e CORE_PEER_LOCALMSPID=ECTAMSP \
    -e CORE_PEER_ADDRESS=peer0.ecta.coffee-export.com:9051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/users/Admin@ecta.coffee-export.com/msp \
    cli peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Approve for ShippingLine
echo "Approving for ShippingLine..."
docker exec -e CORE_PEER_LOCALMSPID=ShippingLineMSP \
    -e CORE_PEER_ADDRESS=peer0.shippingline.coffee-export.com:10051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp \
    cli peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Approve for CustomAuthorities
echo "Approving for CustomAuthorities..."
docker exec -e CORE_PEER_LOCALMSPID=CustomAuthoritiesMSP \
    -e CORE_PEER_ADDRESS=peer0.custom-authorities.coffee-export.com:11051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/users/Admin@custom-authorities.coffee-export.com/msp \
    cli peer lifecycle chaincode approveformyorg -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $CC_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

echo "✅ Chaincode approved by all organizations"
echo ""

# Commit chaincode
echo "Step 4: Committing chaincode to channel..."
docker exec -e CORE_PEER_LOCALMSPID=CommercialBankMSP \
    -e CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp \
    cli peer lifecycle chaincode commit -o orderer.coffee-export.com:7050 --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --sequence $CC_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
    --peerAddresses peer0.commercialbank.coffee-export.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    --peerAddresses peer0.nationalbank.coffee-export.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
    --peerAddresses peer0.ecta.coffee-export.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
    --peerAddresses peer0.shippingline.coffee-export.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt \
    --peerAddresses peer0.custom-authorities.coffee-export.com:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt

echo ""
echo "=========================================="
echo "✅ Chaincode deployed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the API services"
echo "2. Start the frontend"
echo ""
