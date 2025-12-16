#!/bin/bash

# Diagnose Anchor Peer Configuration Issues
# This script checks the current state of anchor peers in the channel

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export PATH=${SCRIPT_DIR}/../../bin:$PATH
export FABRIC_CFG_PATH=${SCRIPT_DIR}/../../config
source ${SCRIPT_DIR}/envVar.sh

CHANNEL_NAME=${1:-"coffeechannel"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Anchor Peer Diagnostic Report${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Organizations
declare -a ORGS=("1" "2" "3" "4" "5")
declare -a NAMES=("CommercialBankMSP" "NationalBankMSP" "ECTAMSP" "ShippingLineMSP" "CustomAuthoritiesMSP")
declare -a HOSTS=("peer0.commercialbank.coffee-export.com" "peer0.nationalbank.coffee-export.com" "peer0.ecta.coffee-export.com" "peer0.shippingline.coffee-export.com" "peer0.custom-authorities.coffee-export.com")
declare -a PORTS=("7051" "8051" "9051" "10051" "11051")

echo -e "${YELLOW}Step 1: Fetching Channel Configuration${NC}"
echo "========================================"

# Use first org to fetch config
setGlobals 1

if ! peer channel fetch config config_block.pb \
  -o orderer.coffee-export.com:7050 \
  --ordererTLSHostnameOverride orderer.coffee-export.com \
  -c $CHANNEL_NAME \
  --tls --cafile "$ORDERER_CA" 2>/dev/null; then
  echo -e "${RED}❌ Failed to fetch channel configuration${NC}"
  exit 1
fi

# Decode config
if ! configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json 2>/dev/null; then
  echo -e "${RED}❌ Failed to decode config block${NC}"
  exit 1
fi

jq .data.data[0].payload.data.config config_block.json >channel_config.json

echo -e "${GREEN}✅ Channel configuration fetched${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking Anchor Peer Configuration${NC}"
echo "========================================"

ANCHOR_PEERS_SET=0
ANCHOR_PEERS_MISSING=0

for i in "${!ORGS[@]}"; do
  ORG=${ORGS[$i]}
  ORGMSP=${NAMES[$i]}
  HOST=${HOSTS[$i]}
  PORT=${PORTS[$i]}
  
  echo ""
  echo -e "${BLUE}Organization: $ORGMSP${NC}"
  echo "  Host: $HOST"
  echo "  Port: $PORT"
  
  # Check if organization exists in channel
  if ! jq -e '.channel_group.groups.Application.groups.'${ORGMSP} channel_config.json >/dev/null 2>&1; then
    echo -e "  ${RED}❌ Organization NOT in channel${NC}"
    ANCHOR_PEERS_MISSING=$((ANCHOR_PEERS_MISSING + 1))
    continue
  fi
  
  # Check if AnchorPeers are set
  if jq -e '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers' channel_config.json >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Anchor Peers Configured${NC}"
    
    # Get version
    VERSION=$(jq '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers.version' channel_config.json)
    echo "     Version: $VERSION"
    
    # Get anchor peer details
    ANCHOR_HOSTS=$(jq -r '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers.value.anchor_peers[].host' channel_config.json)
    ANCHOR_PORTS=$(jq -r '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers.value.anchor_peers[].port' channel_config.json)
    
    echo "     Configured Anchor Peers:"
    while IFS= read -r host && IFS= read -r port <&3; do
      echo "       - $host:$port"
    done <<<"$ANCHOR_HOSTS" 3<<<"$ANCHOR_PORTS"
    
    ANCHOR_PEERS_SET=$((ANCHOR_PEERS_SET + 1))
  else
    echo -e "  ${YELLOW}⚠️  Anchor Peers NOT Configured${NC}"
    ANCHOR_PEERS_MISSING=$((ANCHOR_PEERS_MISSING + 1))
  fi
done

echo ""
echo -e "${YELLOW}Step 3: Checking Peer Status${NC}"
echo "========================================"

for i in "${!ORGS[@]}"; do
  ORG=${ORGS[$i]}
  ORGMSP=${NAMES[$i]}
  HOST=${HOSTS[$i]}
  
  echo ""
  echo -e "${BLUE}$ORGMSP:${NC}"
  
  # Check if peer is running
  if docker ps | grep -q "$HOST"; then
    echo -e "  ${GREEN}✅ Peer is running${NC}"
    
    # Check peer status
    if docker exec $HOST peer node status >/dev/null 2>&1; then
      echo -e "  ${GREEN}✅ Peer is healthy${NC}"
    else
      echo -e "  ${YELLOW}⚠️  Peer status check failed${NC}"
    fi
  else
    echo -e "  ${RED}❌ Peer is NOT running${NC}"
  fi
done

echo ""
echo -e "${YELLOW}Step 4: Summary${NC}"
echo "========================================"
echo "Anchor Peers Configured: $ANCHOR_PEERS_SET / 5"
echo "Anchor Peers Missing: $ANCHOR_PEERS_MISSING / 5"

if [ $ANCHOR_PEERS_MISSING -eq 0 ]; then
  echo -e "${GREEN}✅ All anchor peers are properly configured${NC}"
elif [ $ANCHOR_PEERS_MISSING -lt 3 ]; then
  echo -e "${YELLOW}⚠️  Some anchor peers are missing - consider running setAnchorPeer.sh${NC}"
else
  echo -e "${RED}❌ Most anchor peers are missing - channel may not be working properly${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Recommendations${NC}"
echo "========================================"

if [ $ANCHOR_PEERS_MISSING -gt 0 ]; then
  echo "To set missing anchor peers, run:"
  echo ""
  for i in "${!ORGS[@]}"; do
    ORG=${ORGS[$i]}
    ORGMSP=${NAMES[$i]}
    
    if ! jq -e '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers' channel_config.json >/dev/null 2>&1; then
      echo "  ./network/scripts/setAnchorPeer.sh $ORG $CHANNEL_NAME"
    fi
  done
  echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Diagnostic Report Complete${NC}"
echo -e "${BLUE}========================================${NC}"

# Cleanup
rm -f config_block.pb config_block.json channel_config.json

exit 0
