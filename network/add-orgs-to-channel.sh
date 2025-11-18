#\!/bin/bash

# Add remaining organizations to the channel

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CHANNEL_NAME="coffeechannel"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

echo "=========================================="
echo "Adding Organizations to Channel"
echo "=========================================="

# Function to add organization to channel
add_org_to_channel() {
  local org_name=$1
  local org_lower=$2
  local msp_id=$3
  
  echo -e "${YELLOW}Adding ${org_name} to channel...${NC}"
  
  # Create config update for adding org
  export FABRIC_CFG_PATH=${PWD}/configtx
  
  # Generate org definition
  configtxgen -printOrg ${msp_id} > ./channel-artifacts/${org_lower}.json
  
  if [ \! -f "./channel-artifacts/${org_lower}.json" ]; then
    echo -e "${RED}Failed to generate org definition for ${msp_id}${NC}"
    return 1
  fi
  
  # Fetch current channel config
  docker exec \
    -e CORE_PEER_LOCALMSPID="CommercialBankMSP" \
    -e CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051 \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp \
    cli peer channel fetch config ./channel-artifacts/config_block.pb \
    -o orderer.coffee-export.com:7050 \
    -c $CHANNEL_NAME \
    --tls --cafile $ORDERER_CA
  
  # Convert to JSON
  docker exec cli configtxlator proto_decode \
    --input ./channel-artifacts/config_block.pb \
    --type common.Block | jq .data.data[0].payload.data.config > ./channel-artifacts/config.json
  
  # Add the org
  jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'${msp_id}'":.[1]}}}}}' \
    ./channel-artifacts/config.json ./channel-artifacts/${org_lower}.json > ./channel-artifacts/modified_config.json
  
  # Create config update
  docker exec cli configtxlator proto_encode \
    --input ./channel-artifacts/config.json \
    --type common.Config \
    --output ./channel-artifacts/config.pb
  
  docker exec cli configtxlator proto_encode \
    --input ./channel-artifacts/modified_config.json \
    --type common.Config \
    --output ./channel-artifacts/modified_config.pb
  
  docker exec cli configtxlator compute_update \
    --channel_id $CHANNEL_NAME \
    --original ./channel-artifacts/config.pb \
    --updated ./channel-artifacts/modified_config.pb \
    --output ./channel-artifacts/${org_lower}_update.pb
  
  docker exec cli configtxlator proto_decode \
    --input ./channel-artifacts/${org_lower}_update.pb \
    --type common.ConfigUpdate | jq . > ./channel-artifacts/${org_lower}_update.json
  
  echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_NAME'", "type":2}},"data":{"config_update":'$(cat ./channel-artifacts/${org_lower}_update.json)'}}}' | jq . > ./channel-artifacts/${org_lower}_update_in_envelope.json
  
  docker exec cli configtxlator proto_encode \
    --input ./channel-artifacts/${org_lower}_update_in_envelope.json \
    --type common.Envelope \
    --output ./channel-artifacts/${org_lower}_update_in_envelope.pb
  
  # Submit update
  docker exec \
    -e CORE_PEER_LOCALMSPID="CommercialBankMSP" \
    -e CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051 \
    -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp \
    cli peer channel update \
    -f ./channel-artifacts/${org_lower}_update_in_envelope.pb \
    -c $CHANNEL_NAME \
    -o orderer.coffee-export.com:7050 \
    --tls --cafile $ORDERER_CA
  
  echo -e "${GREEN}✅ ${org_name} added to channel${NC}"
}

# Add each organization
add_org_to_channel "National Bank" "nationalbank" "NationalBankMSP"
add_org_to_channel "ECTA" "ncat" "ECTAMSP"
add_org_to_channel "Shipping Line" "shippingline" "ShippingLineMSP"
add_org_to_channel "Custom Authorities" "customauthorities" "CustomAuthoritiesMSP"

echo -e "${GREEN}=========================================="
echo "✅ All organizations added\!"
echo "==========================================

${NC}"
