#!/bin/bash

source scripts/envVar.sh

CHANNEL_NAME="coffeechannel"
CC_NAME="user-management"
CC_VERSION="1.0"
CC_SEQUENCE="1"

# Get the package ID
setGlobals 1
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled 2>&1 | grep user-management_1.0 | sed -n 's/^Package ID: //; s/, Label:.*$//; p;' | head -n 1)

if [ -z "$PACKAGE_ID" ]; then
    echo "ERROR: Could not find package ID for user-management"
    exit 1
fi

echo "Found Package ID: $PACKAGE_ID"

# Approve for all organizations
echo "Approving for commercialbank..."
setGlobals 1
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo "Approving for NationalBank..."
setGlobals 2
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo "Approving for ECTA..."
setGlobals 3
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo "Approving for ShippingLine..."
setGlobals 4
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

# Commit the chaincode
echo "Committing chaincode definition..."
setGlobals 1
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles "${PEER0_commercialbank_CA}" --peerAddresses localhost:9051 --tlsRootCertFiles "${PEER0_NATIONALBANK_CA}" --peerAddresses localhost:11051 --tlsRootCertFiles "${PEER0_ECTA_CA}" --peerAddresses localhost:13051 --tlsRootCertFiles "${PEER0_SHIPPINGLINE_CA}" --version ${CC_VERSION} --sequence ${CC_SEQUENCE}

echo "Verifying commit..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}

echo "SUCCESS: user-management chaincode is now committed!"
