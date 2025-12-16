#!/bin/bash

# Simple Docker-based anchor peer fix
# This script sets up anchor peers using configtxlator inside Docker

CHANNEL_NAME=${1:-"coffeechannel"}

echo "=========================================="
echo "Setting up anchor peers using Docker CLI"
echo "=========================================="

# Create a temporary script file
TEMP_SCRIPT="/tmp/anchor-setup-$$.sh"

cat > "$TEMP_SCRIPT" << 'EOF'
#!/bin/bash
set -e

export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
source /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/envVar.sh

CHANNEL_NAME="coffeechannel"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem

# Function to set up anchor peer
setup_anchor() {
  local ORG=$1
  local ORGMSP=$2
  local HOST=$3
  local PORT=$4
  
  echo ""
  echo "Setting up $ORGMSP..."
  
  setGlobals $ORG
  
  # Fetch config
  peer channel fetch config config_block.pb \
    -o orderer.coffee-export.com:7050 \
    --ordererTLSHostnameOverride orderer.coffee-export.com \
    -c $CHANNEL_NAME \
    --tls --cafile $ORDERER_CA 2>/dev/null
  
  # Decode
  configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json 2>/dev/null
  jq .data.data[0].payload.data.config config_block.json > ${ORGMSP}config.json
  
  # Check if already set
  if jq -e ".channel_group.groups.Application.groups.${ORGMSP}.values.AnchorPeers" ${ORGMSP}config.json >/dev/null 2>&1; then
    echo "✅ $ORGMSP already configured"
    return 0
  fi
  
  # Create modified config
  jq ".channel_group.groups.Application.groups.${ORGMSP}.values += {\"AnchorPeers\":{\"mod_policy\": \"Admins\",\"value\":{\"anchor_peers\": [{\"host\": \"${HOST}\",\"port\": ${PORT}}]},\"version\": 0}}" ${ORGMSP}config.json > ${ORGMSP}modified_config.json
  
  # Encode
  configtxlator proto_encode --input ${ORGMSP}config.json --type common.Config --output original_config.pb 2>/dev/null
  configtxlator proto_encode --input ${ORGMSP}modified_config.json --type common.Config --output modified_config.pb 2>/dev/null
  
  # Compute update
  configtxlator compute_update --channel_id $CHANNEL_NAME --original original_config.pb --updated modified_config.pb --output config_update.pb 2>/dev/null
  
  # Decode update
  configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json 2>/dev/null
  
  # Create envelope
  jq --arg channel "$CHANNEL_NAME" '{payload: {header: {channel_header: {channel_id: $channel, type: 2}}, data: {config_update: .}}}' config_update.json > config_update_in_envelope.json
  
  # Encode envelope
  configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output ${ORGMSP}anchors.tx 2>/dev/null
  
  # Sign
  setGlobals $ORG
  peer channel signconfigtx -f ${ORGMSP}anchors.tx 2>/dev/null
  
  # Update
  setGlobals $ORG
  peer channel update -o orderer.coffee-export.com:7050 \
    --ordererTLSHostnameOverride orderer.coffee-export.com \
    -c $CHANNEL_NAME \
    -f ${ORGMSP}anchors.tx \
    --tls --cafile $ORDERER_CA 2>/dev/null
  
  echo "✅ $ORGMSP configured"
}

# Setup all organizations
setup_anchor 1 "CommercialBankMSP" "peer0.commercialbank.coffee-export.com" 7051
setup_anchor 2 "NationalBankMSP" "peer0.nationalbank.coffee-export.com" 8051
setup_anchor 3 "ECTAMSP" "peer0.ecta.coffee-export.com" 9051
setup_anchor 5 "CustomAuthoritiesMSP" "peer0.custom-authorities.coffee-export.com" 11051

echo ""
echo "✅ All anchor peers configured"
EOF

# Copy script to Docker and execute
docker cp "$TEMP_SCRIPT" cli:/tmp/anchor-setup.sh
docker exec cli bash /tmp/anchor-setup.sh

# Cleanup
rm -f "$TEMP_SCRIPT"

echo "=========================================="
echo "✅ Anchor peer setup complete"
echo "=========================================="
