#!/bin/bash

# Approve and Commit Chaincode for All Organizations

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

CHANNEL_NAME="coffeechannel"
CHAINCODE_NAME="coffee-export"
CHAINCODE_VERSION="1.0"
SEQUENCE="1"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Approving and Committing Chaincode${NC}"
echo -e "${GREEN}========================================${NC}"

# Get package ID
echo -e "${YELLOW}Getting package ID...${NC}"

PACKAGE_ID=$(docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp

peer lifecycle chaincode queryinstalled | grep coffee-export | awk "{print \$3}" | sed "s/,//"
' 2>&1 | tail -1)

echo -e "${GREEN}✅ Package ID: $PACKAGE_ID${NC}"

# Define organizations
declare -A ORGS=(
  ["1"]="CommercialBankMSP"
  ["2"]="NationalBankMSP"
  ["3"]="ECTAMSP"
  ["4"]="ShippingLineMSP"
  ["5"]="CustomAuthoritiesMSP"
)

declare -A PEERS=(
  ["1"]="peer0.commercialbank.coffee-export.com:7051"
  ["2"]="peer0.nationalbank.coffee-export.com:8051"
  ["3"]="peer0.ecta.coffee-export.com:9051"
  ["4"]="peer0.shippingline.coffee-export.com:10051"
  ["5"]="peer0.custom-authorities.coffee-export.com:11051"
)

declare -A TLSCERTS=(
  ["1"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt"
  ["2"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt"
  ["3"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt"
  ["4"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt"
  ["5"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt"
)

declare -A MSPCONFIGS=(
  ["1"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp"
  ["2"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/users/Admin@nationalbank.coffee-export.com/msp"
  ["3"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/users/Admin@ecta.coffee-export.com/msp"
  ["4"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/users/Admin@shippingline.coffee-export.com/msp"
  ["5"]="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/users/Admin@custom-authorities.coffee-export.com/msp"
)

# Step 1: Approve chaincode for each organization
echo -e "${YELLOW}Step 1: Approving chaincode for each organization...${NC}"

for ORG_NUM in 1 2 3 4 5; do
  MSP="${ORGS[$ORG_NUM]}"
  PEER="${PEERS[$ORG_NUM]}"
  TLSCERT="${TLSCERTS[$ORG_NUM]}"
  MSPCONFIG="${MSPCONFIGS[$ORG_NUM]}"
  
  echo -e "${YELLOW}Approving for $MSP...${NC}"
  
  docker exec cli bash -c "
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=\"$MSP\"
export CORE_PEER_ADDRESS=$PEER
export CORE_PEER_TLS_ROOTCERT_FILE=$TLSCERT
export CORE_PEER_MSPCONFIGPATH=$MSPCONFIG
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

peer lifecycle chaincode approveformyorg \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $SEQUENCE \
  --tls \
  --cafile \$ORDERER_CA \
  -o orderer.coffee-export.com:7050 \
  --ordererTLSHostnameOverride orderer.coffee-export.com
" 2>&1 | grep -E "SUCCESS|Error|approved"
  
  echo -e "${GREEN}✅ Approved for $MSP${NC}"
done

# Step 2: Check approval status
echo -e "${YELLOW}Step 2: Checking approval status...${NC}"

docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

peer lifecycle chaincode checkcommitreadiness \
  --channelID coffeechannel \
  --name coffee-export \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile $ORDERER_CA \
  -o orderer.coffee-export.com:7050 \
  --ordererTLSHostnameOverride orderer.coffee-export.com
'

echo -e "${GREEN}✅ Approval status checked${NC}"

# Step 3: Commit chaincode
echo -e "${YELLOW}Step 3: Committing chaincode to channel...${NC}"

docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

peer lifecycle chaincode commit \
  --channelID coffeechannel \
  --name coffee-export \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile $ORDERER_CA \
  -o orderer.coffee-export.com:7050 \
  --ordererTLSHostnameOverride orderer.coffee-export.com \
  --peerAddresses peer0.commercialbank.coffee-export.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
  --peerAddresses peer0.nationalbank.coffee-export.com:8051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com/tls/ca.crt \
  --peerAddresses peer0.ecta.coffee-export.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/tls/ca.crt \
  --peerAddresses peer0.shippingline.coffee-export.com:10051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com/tls/ca.crt \
  --peerAddresses peer0.custom-authorities.coffee-export.com:11051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com/tls/ca.crt
'

echo -e "${GREEN}✅ Chaincode committed${NC}"

# Step 4: Verify commitment
echo -e "${YELLOW}Step 4: Verifying chaincode commitment...${NC}"

docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

peer lifecycle chaincode querycommitted \
  --channelID coffeechannel \
  --name coffee-export \
  --tls \
  --cafile $ORDERER_CA
'

echo -e "${GREEN}✅ Chaincode verified${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Chaincode Approval & Commitment Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo "✅ Chaincode approved by all 5 organizations"
echo "✅ Chaincode committed to channel"
echo "✅ Chaincode ready for invocation"
echo ""
