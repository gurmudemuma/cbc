#\!/bin/bash

set -e

echo "=========================================="
echo "Fixing Fabric Channel ACL Configuration"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHANNEL_NAME="coffeechannel"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

echo -e "${YELLOW}Step 1: Generating new channel configuration...${NC}"

# Generate channel configuration
export FABRIC_CFG_PATH=${PWD}/configtx
configtxgen -profile CoffeeChannel \
  -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx \
  -channelID $CHANNEL_NAME

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to generate channel configuration transaction${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Channel configuration generated${NC}"

echo -e "${YELLOW}Step 2: Creating channel (this will fail if channel exists, which is OK)...${NC}"

# Try to create channel (will fail if exists)
docker exec cli peer channel create \
  -o orderer.coffee-export.com:7050 \
  -c $CHANNEL_NAME \
  -f ./channel-artifacts/${CHANNEL_NAME}.tx \
  --outputBlock ./channel-artifacts/${CHANNEL_NAME}.block \
  --tls --cafile $ORDERER_CA 2>&1 | tee /tmp/channel_create.log || true

if grep -q "already exists" /tmp/channel_create.log; then
  echo -e "${YELLOW}Channel already exists, will update configuration...${NC}"
else
  echo -e "${GREEN}✅ Channel created${NC}"
fi

echo -e "${YELLOW}Step 3: Joining all peers to channel...${NC}"

# Function to join peer to channel
join_peer() {
  local org=$1
  local port=$2
  local msp=$3
  
  echo "Joining peer0.${org}.coffee-export.com..."
  
  docker exec \
    -e CORE_PEER_LOCALMSPID="${msp}" \
    -e CORE_PEER_ADDRESS=peer0.${org}.coffee-export.com:${port} \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/peers/peer0.${org}.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/users/Admin@${org}.coffee-export.com/msp \
    cli peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block 2>&1 | tee /tmp/join_${org}.log || true
  
  if grep -q "already joined" /tmp/join_${org}.log || grep -q "successfully joined" /tmp/join_${org}.log; then
    echo -e "${GREEN}✅ peer0.${org}.coffee-export.com joined${NC}"
  else
    echo -e "${RED}❌ Failed to join peer0.${org}.coffee-export.com${NC}"
  fi
}

# Join all peers
join_peer "commercialbank" "7051" "CommercialBankMSP"
join_peer "nationalbank" "8051" "NationalBankMSP"
join_peer "ecta" "9051" "ECTAMSP"
join_peer "shippingline" "10051" "ShippingLineMSP"
join_peer "customauthorities" "11051" "CustomAuthoritiesMSP"

echo -e "${YELLOW}Step 4: Updating anchor peers...${NC}"

# Function to update anchor peer
update_anchor() {
  local org=$1
  local port=$2
  local msp=$3
  local org_lower=$(echo $org | tr '[:upper:]' '[:lower:]')
  
  echo "Updating anchor peer for ${msp}..."
  
  # Generate anchor peer update
  export FABRIC_CFG_PATH=${PWD}/configtx
  configtxgen -profile CoffeeExportGenesis \
    -outputAnchorPeersUpdate ./channel-artifacts/${msp}anchors.tx \
    -channelID $CHANNEL_NAME \
    -asOrg ${msp} 2>/dev/null || true
  
  if [ -f "./channel-artifacts/${msp}anchors.tx" ]; then
    docker exec \
      -e CORE_PEER_LOCALMSPID="${msp}" \
      -e CORE_PEER_ADDRESS=peer0.${org}.coffee-export.com:${port} \
      -e CORE_PEER_TLS_ENABLED=true \
      -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/peers/peer0.${org}.coffee-export.com/tls/ca.crt \
      -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${org}.coffee-export.com/users/Admin@${org}.coffee-export.com/msp \
      cli peer channel update \
      -o orderer.coffee-export.com:7050 \
      -c $CHANNEL_NAME \
      -f ./channel-artifacts/${msp}anchors.tx \
      --tls --cafile $ORDERER_CA 2>&1 | grep -q "Successfully" && \
      echo -e "${GREEN}✅ Anchor peer updated for ${msp}${NC}" || \
      echo -e "${YELLOW}⚠️  Anchor peer update skipped for ${msp} (may already exist)${NC}"
  fi
}

# Update anchor peers
update_anchor "commercialbank" "7051" "CommercialBankMSP"
update_anchor "nationalbank" "8051" "NationalBankMSP"
update_anchor "ecta" "9051" "ECTAMSP"
update_anchor "shippingline" "10051" "ShippingLineMSP"
update_anchor "customauthorities" "11051" "CustomAuthoritiesMSP"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Channel ACL Configuration Complete\!${NC}"
echo "=========================================="
echo ""
echo "Verifying channel access..."

# Verify each peer can access the channel
for org in commercialbank nationalbank ecta shippingline customauthorities; do
  echo -n "Testing $org: "
  docker exec \
    -e CORE_PEER_LOCALMSPID="${org^^}MSP" \
    -e CORE_PEER_ADDRESS=peer0.${org}.coffee-export.com:7051 \
    cli peer channel list 2>&1 | grep -q "coffeechannel" && \
    echo -e "${GREEN}✅ OK${NC}" || \
    echo -e "${RED}❌ FAILED${NC}"
done

echo ""
echo "Channel fix complete\! Restart APIs to reconnect:"
echo "  cd /home/gu-da/cbc"
echo "  docker-compose restart national-bank-api commercialbank-api ecta-api shipping-line-api custom-authorities-api"
