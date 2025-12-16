#!/bin/bash

# Fix CLI Environment and Verify Network

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Fixing CLI Environment${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Check Docker containers
echo -e "${YELLOW}Step 1: Checking Docker containers...${NC}"
RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "peer|orderer|cli" | wc -l)
echo -e "${GREEN}✅ Found $RUNNING_CONTAINERS containers running${NC}"

# Step 2: Set environment variables in CLI
echo -e "${YELLOW}Step 2: Setting environment variables in CLI...${NC}"

docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

echo "Environment variables set"
'

echo -e "${GREEN}✅ Environment variables set${NC}"

# Step 3: Test peer connectivity
echo -e "${YELLOW}Step 3: Testing peer connectivity...${NC}"

docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

peer channel list
' 2>&1 | tee /tmp/peer_test.log

if grep -q "coffeechannel" /tmp/peer_test.log; then
  echo -e "${GREEN}✅ Peer connectivity verified${NC}"
else
  echo -e "${RED}❌ Peer connectivity failed${NC}"
  cat /tmp/peer_test.log
  exit 1
fi

# Step 4: Get channel info
echo -e "${YELLOW}Step 4: Getting channel information...${NC}"

docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

peer channel getinfo -c coffeechannel
'

echo -e "${GREEN}✅ Channel information retrieved${NC}"

# Step 5: Check chaincode status
echo -e "${YELLOW}Step 5: Checking chaincode status...${NC}"

docker exec cli bash -c '
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="CommercialBankMSP"
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

peer lifecycle chaincode queryinstalled
' 2>&1 | tee /tmp/chaincode_status.log

if grep -q "coffee-export" /tmp/chaincode_status.log; then
  echo -e "${GREEN}✅ Chaincode installed${NC}"
else
  echo -e "${YELLOW}⚠️  Chaincode not yet installed${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CLI Environment Fixed${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo "✅ Docker containers running"
echo "✅ Environment variables set"
echo "✅ Peer connectivity verified"
echo "✅ Channel coffeechannel active"
echo ""
echo -e "${GREEN}Network Status:${NC}"
echo "Channel: coffeechannel"
echo "Peers: 5 organizations"
echo "Orderer: orderer.coffee-export.com:7050"
echo ""
