#!/bin/bash

# Docker-based anchor peer setup for all organizations
# This script runs entirely within the Docker CLI container to avoid local binary issues

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
CHANNEL_NAME=${1:-"coffeechannel"}

echo "=========================================="
echo "Setting up anchor peers using Docker CLI"
echo "=========================================="

# Run the entire anchor peer setup inside the Docker CLI container
docker exec cli bash << 'DOCKER_SCRIPT'
set -e

export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
source /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/envVar.sh

CHANNEL_NAME="coffeechannel"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Function to set up anchor peer for an organization
setup_anchor_peer() {
  local ORG=$1
  local ORGMSP=$2
  local HOST=$3
  local PORT=$4
  
  echo ""
  echo "========== Setting up anchor peer for $ORGMSP =========="
  
  # Set globals
  setGlobals $ORG
  
  # Fetch config block
  echo "Fetching config block..."
  peer channel fetch config config_block.pb \
    -o orderer.coffee-export.com:7050 \
    --ordererTLSHostnameOverride orderer.coffee-export.com \
    -c $CHANNEL_NAME \
    --tls --cafile $ORDERER_CA
  
  # Decode to JSON
  echo "Decoding config block..."
  configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json
  jq .data.data[0].payload.data.config config_block.json > ${ORGMSP}config.json
  
  # Check if anchor peer already exists
  if jq -e ".channel_group.groups.Application.groups.${ORGMSP}.values.AnchorPeers" ${ORGMSP}config.json >/dev/null 2>&1; then
    echo "✅ Anchor peer already configured for $ORGMSP, skipping"
    return 0
  fi
  
  echo "Creating anchor peer configuration..."
  
  # Create modified config with anchor peer
  jq ".channel_group.groups.Application.groups.${ORGMSP}.values += {\"AnchorPeers\":{\"mod_policy\": \"Admins\",\"value\":{\"anchor_peers\": [{\"host\": \"${HOST}\",\"port\": ${PORT}}]},\"version\": 0}}" ${ORGMSP}config.json > ${ORGMSP}modified_config.json
  
  # Encode configs
  echo "Encoding configurations..."
  configtxlator proto_encode --input ${ORGMSP}config.json --type common.Config --output original_config.pb
  configtxlator proto_encode --input ${ORGMSP}modified_config.json --type common.Config --output modified_config.pb
  
  # Compute update
  echo "Computing config update..."
  configtxlator compute_update --channel_id $CHANNEL_NAME --original original_config.pb --updated modified_config.pb --output config_update.pb
  
  # Decode update
  configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json
  
  # Create envelope
  jq --arg channel "$CHANNEL_NAME" '{payload: {header: {channel_header: {channel_id: $channel, type: 2}}, data: {config_update: .}}}' config_update.json > config_update_in_envelope.json
  
  # Encode envelope
  configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output ${ORGMSP}anchors.tx
  
  # Sign the transaction
  echo "Signing anchor peer transaction..."
  setGlobals $ORG
  peer channel signconfigtx -f ${ORGMSP}anchors.tx
  
  # Submit the update
  echo "Submitting anchor peer update..."
  setGlobals $ORG
  peer channel update -o orderer.coffee-export.com:7050 \
    --ordererTLSHostnameOverride orderer.coffee-export.com \
    -c $CHANNEL_NAME \
    -f ${ORGMSP}anchors.tx \
    --tls --cafile $ORDERER_CA
  
  echo "✅ Anchor peer set for $ORGMSP"
}

# Set up anchor peers for all organizations
setup_anchor_peer 1 "CommercialBankMSP" "peer0.commercialbank.coffee-export.com" 7051
setup_anchor_peer 2 "NationalBankMSP" "peer0.nationalbank.coffee-export.com" 8051
setup_anchor_peer 3 "ECTAMSP" "peer0.ecta.coffee-export.com" 9051
setup_anchor_peer 5 "CustomAuthoritiesMSP" "peer0.custom-authorities.coffee-export.com" 11051

echo ""
echo "=========================================="
echo "✅ All anchor peers configured successfully"
echo "=========================================="

DOCKER_SCRIPT

exit $?
