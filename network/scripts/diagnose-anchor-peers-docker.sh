#!/bin/bash

# Diagnose Anchor Peer Configuration Issues (Docker-based)
# This script uses Docker CLI to avoid configtxlator segfault

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
echo -e "${BLUE}Anchor Peer Diagnostic Report (Docker)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Organizations
declare -a ORGS=("1" "2" "3" "4" "5")
declare -a NAMES=("CommercialBankMSP" "NationalBankMSP" "ECTAMSP" "ShippingLineMSP" "CustomAuthoritiesMSP")
declare -a HOSTS=("peer0.commercialbank.coffee-export.com" "peer0.nationalbank.coffee-export.com" "peer0.ecta.coffee-export.com" "peer0.shippingline.coffee-export.com" "peer0.custom-authorities.coffee-export.com")
declare -a PORTS=("7051" "8051" "9051" "10051" "11051")

echo -e "${YELLOW}Step 1: Checking Peer Status${NC}"
echo "========================================"

PEERS_RUNNING=0
PEERS_TOTAL=0

for i in "${!ORGS[@]}"; do
  ORG=${ORGS[$i]}
  ORGMSP=${NAMES[$i]}
  HOST=${HOSTS[$i]}
  PORT=${PORTS[$i]}
  
  echo ""
  echo -e "${BLUE}$ORGMSP:${NC}"
  echo "  Host: $HOST"
  echo "  Port: $PORT"
  
  # Check if peer is running
  if docker ps | grep -q "$HOST"; then
    echo -e "  ${GREEN}✅ Peer is running${NC}"
    PEERS_RUNNING=$((PEERS_RUNNING + 1))
    
    # Check peer status
    if docker exec $HOST peer node status >/dev/null 2>&1; then
      echo -e "  ${GREEN}✅ Peer is healthy${NC}"
    else
      echo -e "  ${YELLOW}⚠️  Peer status check failed${NC}"
    fi
  else
    echo -e "  ${RED}❌ Peer is NOT running${NC}"
  fi
  
  PEERS_TOTAL=$((PEERS_TOTAL + 1))
done

echo ""
echo -e "${YELLOW}Step 2: Checking Channel Membership${NC}"
echo "========================================"

# Check if CLI container is running
if ! docker ps | grep -q "cli"; then
  echo -e "${RED}❌ CLI container is not running${NC}"
  echo "Please start the network first: docker-compose up -d"
  exit 1
fi

echo -e "${GREEN}✅ CLI container is running${NC}"

echo ""
echo -e "${YELLOW}Step 3: Fetching Channel Configuration (via Docker)${NC}"
echo "========================================"

# Use Docker CLI to fetch config
if ! docker exec cli bash -c "
  export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
  source /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/envVar.sh
  setGlobals 1
  peer channel fetch config config_block.pb \
    -o orderer.coffee-export.com:7050 \
    --ordererTLSHostnameOverride orderer.coffee-export.com \
    -c $CHANNEL_NAME \
    --tls --cafile \$ORDERER_CA 2>/dev/null
" >/dev/null 2>&1; then
  echo -e "${RED}❌ Failed to fetch channel configuration${NC}"
  echo "Troubleshooting:"
  echo "1. Check if orderer is running: docker ps | grep orderer"
  echo "2. Check orderer logs: docker logs orderer.coffee-export.com"
  echo "3. Check if channel exists: docker exec cli peer channel list"
  exit 1
fi

echo -e "${GREEN}✅ Channel configuration fetched${NC}"

# Decode config using Docker
if ! docker exec cli bash -c "
  configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json 2>/dev/null
" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  configtxlator decode failed, trying alternative method${NC}"
  
  # Alternative: Just check if peers are in channel
  echo ""
  echo -e "${YELLOW}Step 4: Checking Channel Membership (Alternative)${NC}"
  echo "========================================"
  
  for i in "${!ORGS[@]}"; do
    ORG=${ORGS[$i]}
    ORGMSP=${NAMES[$i]}
    
    echo ""
    echo -e "${BLUE}$ORGMSP:${NC}"
    
    # Try to join channel (will fail if already joined, but that's OK)
    if docker exec cli bash -c "
      export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
      source /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/envVar.sh
      setGlobals $ORG
      peer channel getinfo -c $CHANNEL_NAME --tls --cafile \$ORDERER_CA 2>/dev/null
    " >/dev/null 2>&1; then
      echo -e "  ${GREEN}✅ Peer is member of channel${NC}"
    else
      echo -e "  ${YELLOW}⚠️  Could not verify channel membership${NC}"
    fi
  done
  
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Diagnostic Report Complete (Limited)${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  echo "Summary:"
  echo "  Peers Running: $PEERS_RUNNING / $PEERS_TOTAL"
  echo ""
  echo "Note: Full anchor peer configuration check requires configtxlator"
  echo "To fix configtxlator segfault:"
  echo "  1. Rebuild Fabric binaries: docker-compose build"
  echo "  2. Or use: ./scripts/recover-anchor-peers-docker.sh"
  exit 0
fi

# Extract config from block
docker exec cli bash -c "
  jq .data.data[0].payload.data.config config_block.json >channel_config.json
" >/dev/null 2>&1

echo ""
echo -e "${YELLOW}Step 4: Checking Anchor Peer Configuration${NC}"
echo "========================================"

ANCHOR_PEERS_SET=0
ANCHOR_PEERS_MISSING=0

for i in "${!ORGS[@]}"; do
  ORG=${ORGS[$i]}
  ORGMSP=${NAMES[$i]}
  
  echo ""
  echo -e "${BLUE}Organization: $ORGMSP${NC}"
  
  # Check if organization exists in channel
  if ! docker exec cli bash -c "
    jq -e '.channel_group.groups.Application.groups.'${ORGMSP} channel_config.json >/dev/null 2>&1
  " >/dev/null 2>&1; then
    echo -e "  ${RED}❌ Organization NOT in channel${NC}"
    ANCHOR_PEERS_MISSING=$((ANCHOR_PEERS_MISSING + 1))
    continue
  fi
  
  # Check if AnchorPeers are set
  if docker exec cli bash -c "
    jq -e '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers' channel_config.json >/dev/null 2>&1
  " >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Anchor Peers Configured${NC}"
    
    # Get version
    VERSION=$(docker exec cli bash -c "
      jq '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers.version' channel_config.json
    " 2>/dev/null)
    echo "     Version: $VERSION"
    
    # Get anchor peer details
    docker exec cli bash -c "
      jq -r '.channel_group.groups.Application.groups.'${ORGMSP}'.values.AnchorPeers.value.anchor_peers[] | \"       - \(.host):\(.port)\"' channel_config.json
    " 2>/dev/null
    
    ANCHOR_PEERS_SET=$((ANCHOR_PEERS_SET + 1))
  else
    echo -e "  ${YELLOW}⚠️  Anchor Peers NOT Configured${NC}"
    ANCHOR_PEERS_MISSING=$((ANCHOR_PEERS_MISSING + 1))
  fi
done

echo ""
echo -e "${YELLOW}Step 5: Summary${NC}"
echo "========================================"
echo "Peers Running: $PEERS_RUNNING / $PEERS_TOTAL"
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
echo -e "${YELLOW}Step 6: Recommendations${NC}"
echo "========================================"

if [ $ANCHOR_PEERS_MISSING -gt 0 ]; then
  echo "To set missing anchor peers, run:"
  echo ""
  echo "  ./scripts/recover-anchor-peers-docker.sh coffeechannel"
  echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Diagnostic Report Complete${NC}"
echo -e "${BLUE}========================================${NC}"

# Cleanup
docker exec cli bash -c "rm -f config_block.pb config_block.json channel_config.json" 2>/dev/null

exit 0
