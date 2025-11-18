#!/bin/bash

export FABRIC_CFG_PATH=/home/gu-da/CBC/config

source scripts/envVar.sh

CHANNEL_NAME="coffeechannel"
CC_NAME="user-management"
CC_VERSION="1.0"
CC_SEQUENCE="1"

# Install on all peers
echo "Installing chaincode on all peers..."

echo "Installing on peer0.commercialbank..."
setGlobals 1
peer lifecycle chaincode install ${CC_NAME}.tar.gz 2>&1 | grep -v "already successfully installed" || echo "Already installed or installed successfully"

echo "Installing on peer0.nationalbank..."
setGlobals 2
peer lifecycle chaincode install ${CC_NAME}.tar.gz 2>&1 | grep -v "already successfully installed" || echo "Already installed or installed successfully"

echo "Installing on peer0.ncat..."
setGlobals 3
peer lifecycle chaincode install ${CC_NAME}.tar.gz 2>&1 | grep -v "already successfully installed" || echo "Already installed or installed successfully"

echo "Installing on peer0.shippingline..."
setGlobals 4
peer lifecycle chaincode install ${CC_NAME}.tar.gz 2>&1 | grep -v "already successfully installed" || echo "Already installed or installed successfully"

# Get the package ID
echo "Querying package ID..."
setGlobals 1
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled 2>&1 | grep "user-management_1.0" | awk -F'Package ID: |, Label:' '{print $2}' | head -n 1)

if [ -z "$PACKAGE_ID" ]; then
    echo "ERROR: Could not find package ID for user-management"
    peer lifecycle chaincode queryinstalled
    exit 1
fi

echo "Found Package ID: $PACKAGE_ID"

# Approve for all organizations
echo ""
echo "Approving for commercialbank..."
setGlobals 1
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo ""
echo "Approving for NationalBank..."
setGlobals 2
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo ""
echo "Approving for ECTA..."
setGlobals 3
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo ""
echo "Approving for ShippingLine..."
setGlobals 4
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

# Commit the chaincode
echo ""
echo "Committing chaincode definition..."
parsePeerConnectionParameters 1 2 3 4
setGlobals 1
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} "${PEER_CONN_PARMS[@]}" --version ${CC_VERSION} --sequence ${CC_SEQUENCE}

echo ""
echo "Verifying commit..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}

echo ""
echo "SUCCESS: user-management chaincode is now committed!"
