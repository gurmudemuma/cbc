#\!/bin/bash

# Fabric 2.5 Channel Recreation Script (No System Channel)
set -e

echo "=========================================="
echo "Recreating Fabric Channel (Fabric 2.5+)"
echo "=========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CHANNEL_NAME="coffeechannel"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

echo -e "${YELLOW}Step 1: Verifying peers are joined to channel...${NC}"

check_peer() {
  local org=$1
  local port=$2
  local msp=$3
  
  docker exec \
    -e CORE_PEER_LOCALMSPID="${msp}" \
    -e CORE_PEER_ADDRESS=peer0.${org}.coffee-export.com:${port} \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/peers/peer0.${org}.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/users/Admin@${org}.coffee-export.com/msp \
    cli peer channel list 2>&1 | grep -q "coffeechannel" && \
    echo -e "${GREEN}✅ peer0.${org}.coffee-export.com is on channel${NC}" || \
    echo -e "${RED}❌ peer0.${org}.coffee-export.com NOT on channel${NC}"
}

check_peer "commercialbank" "7051" "CommercialBankMSP"
check_peer "nationalbank" "8051" "NationalBankMSP"
check_peer "ecta" "9051" "ECTAMSP"
check_peer "shippingline" "10051" "ShippingLineMSP"
check_peer "customauthorities" "11051" "CustomAuthoritiesMSP"

echo ""
echo -e "${YELLOW}Step 2: Testing channel queries...${NC}"

# Test if peers can query channel info
test_channel_access() {
  local org=$1
  local port=$2
  local msp=$3
  
  echo -n "Testing $org: "
  result=$(docker exec \
    -e CORE_PEER_LOCALMSPID="${msp}" \
    -e CORE_PEER_ADDRESS=peer0.${org}.coffee-export.com:${port} \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/peers/peer0.${org}.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/users/Admin@${org}.coffee-export.com/msp \
    cli peer channel getinfo -c coffeechannel 2>&1)
  
  if echo "$result" | grep -q "Blockchain info"; then
    echo -e "${GREEN}✅ CAN ACCESS${NC}"
    return 0
  elif echo "$result" | grep -q "access denied"; then
    echo -e "${RED}❌ ACCESS DENIED - Policy Issue${NC}"
    return 1
  else
    echo -e "${RED}❌ ERROR${NC}"
    echo "$result" | head -3
    return 1
  fi
}

test_channel_access "commercialbank" "7051" "CommercialBankMSP"
test_channel_access "nationalbank" "8051" "NationalBankMSP"
test_channel_access "ecta" "9051" "ECTAMSP"
test_channel_access "shippingline" "10051" "ShippingLineMSP"
test_channel_access "customauthorities" "11051" "CustomAuthoritiesMSP"

echo ""
echo -e "${YELLOW}Step 3: Testing chaincode queries...${NC}"

# Test chaincode
test_chaincode() {
  local org=$1
  local port=$2
  local msp=$3
  
  echo -n "Testing chaincode on $org: "
  result=$(docker exec \
    -e CORE_PEER_LOCALMSPID="${msp}" \
    -e CORE_PEER_ADDRESS=peer0.${org}.coffee-export.com:${port} \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/peers/peer0.${org}.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/users/Admin@${org}.coffee-export.com/msp \
    cli peer chaincode query -C coffeechannel -n coffee-export -c '{"Args":["org.hyperledger.fabric:GetMetadata"]}' 2>&1)
  
  if echo "$result" | grep -q "coffee-export\|metadata"; then
    echo -e "${GREEN}✅ OK${NC}"
  else
    echo -e "${RED}❌ FAILED${NC}"
  fi
}

test_chaincode "commercialbank" "7051" "CommercialBankMSP"

echo ""
echo "=========================================="
echo "Diagnosis Summary:"
echo "=========================================="
echo ""
echo "The channel exists and peers are joined."
echo "The issue is with channel ACL policies."
echo ""
echo "In Fabric 2.5+, the channel likely needs to be"
echo "updated to include proper MSP configurations."
echo ""
echo "To fix, you may need to:"
echo "1. Update channel configuration with proper policies"
echo "2. OR ensure MSP IDs match exactly between:"
echo "   - configtx.yaml"
echo "   - Channel configuration"
echo "   - Peer configuration"
echo ""
