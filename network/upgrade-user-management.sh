#!/bin/bash

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config

source scripts/envVar.sh

CHANNEL_NAME="coffeechannel"
CC_NAME="user-management"
CC_VERSION="1.0"
CC_SEQUENCE="2"
PACKAGE_ID="user-management_1.0:b513d7db1dc361950adc69115af4c0fcc9da2be741055537cabe900dc7218c7c"

# Approve for all organizations
echo "Approving for ExporterBank..."
setGlobals 1
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo "Approving for NationalBank..."
setGlobals 2
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo "Approving for NCAT..."
setGlobals 3
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo "Approving for ShippingLine..."
setGlobals 4
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

echo "Approving for CustomAuthorities..."
setGlobals 5
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

# Commit the chaincode
echo "Committing chaincode definition..."
parsePeerConnectionParameters 1 2 3 4 5
setGlobals 1
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.coffee-export.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CC_NAME} "${PEER_CONN_PARMS[@]}" --version ${CC_VERSION} --sequence ${CC_SEQUENCE}

echo "Verifying commit..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}

echo "SUCCESS: user-management chaincode is now committed!"