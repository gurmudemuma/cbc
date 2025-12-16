#!/bin/bash

# Recover Anchor Peer Configuration (Docker-based)
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
echo -e "${BLUE}Anchor Peer Recovery Script (Docker)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Organizations
declare -a ORGS=("1" "2" "3" "4" "5")
declare -a NAMES=("CommercialBankMSP" "NationalBankMSP" "ECTAMSP" "ShippingLineMSP" "CustomAuthoritiesMSP")
declare -a HOSTS=("peer0.commercialbank.coffee-export.com" "peer0.nationalbank.coffee-export.com" "peer0.ecta.coffee-export.com" "peer0.shippingline.coffee-export.com" "peer0.custom-authorities.coffee-export.com")

echo -e "${YELLOW}Step 1: Checking Prerequisites${NC}"
echo "========================================"

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if CLI container is running
if ! docker ps | grep -q "cli"; then
  echo -e "${RED}❌ CLI container is not running${NC}"
  echo "Please start the network first: docker-compose up -d"
  exit 1
fi

echo -e "${GREEN}✅ CLI container is running${NC}"

# Check if orderer is running
if ! docker ps | grep -q "orderer"; then
  echo -e "${RED}❌ Orderer is not running${NC}"
  echo "Please start the network first: docker-compose up -d"
  exit 1
fi

echo -e "${GREEN}✅ Orderer is running${NC}"

# Check if peers are running
PEERS_RUNNING=0
for host in "${HOSTS[@]}"; do
  if docker ps | grep -q "$host"; then
    PEERS_RUNNING=$((PEERS_RUNNING + 1))
  fi
done

echo "Peers Running: $PEERS_RUNNING / 5"

if [ $PEERS_RUNNING -lt 3 ]; then
  echo -e "${YELLOW}⚠️  Less than 3 peers are running${NC}"
  echo "Consider starting more peers before recovery"
fi

echo ""
echo -e "${YELLOW}Step 2: Diagnosing Current State${NC}"
echo "========================================"

# Run diagnostic
if ! ${SCRIPT_DIR}/diagnose-anchor-peers-docker.sh $CHANNEL_NAME; then
  echo -e "${RED}❌ Diagnostic failed${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Setting Anchor Peers${NC}"
echo "========================================"

FAILED_ORGS=()
SUCCESS_COUNT=0

for org in "${ORGS[@]}"; do
  echo ""
  echo -e "${BLUE}Setting anchor peer for Org $org...${NC}"
  
  # Run setAnchorPeer in Docker CLI
  if docker exec cli bash -c "
    export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
    source /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/envVar.sh
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer
    ./scripts/setAnchorPeer.sh $org $CHANNEL_NAME
  " 2>&1 | tee anchor_peer_$org.log; then
    echo -e "${GREEN}✅ Anchor peer set for Org $org${NC}"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    # Check if error is due to already being set
    if grep -q "AnchorPeers already set\|already configured" anchor_peer_$org.log; then
      echo -e "${GREEN}✅ Anchor peer already configured for Org $org${NC}"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    elif grep -q "version 0.*version 0" anchor_peer_$org.log; then
      echo -e "${YELLOW}⚠️  Anchor peer already at version 0 for Org $org (this is normal)${NC}"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo -e "${RED}❌ Failed to set anchor peer for Org $org${NC}"
      FAILED_ORGS+=($org)
      tail -20 anchor_peer_$org.log
    fi
  fi
done

echo ""
echo -e "${YELLOW}Step 4: Verification${NC}"
echo "========================================"

# Run diagnostic again
if ${SCRIPT_DIR}/diagnose-anchor-peers-docker.sh $CHANNEL_NAME; then
  echo -e "${GREEN}✅ Verification complete${NC}"
else
  echo -e "${YELLOW}⚠️  Verification had issues${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Summary${NC}"
echo "========================================"
echo "Successfully set: $SUCCESS_COUNT / 5"

if [ ${#FAILED_ORGS[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All anchor peers recovered successfully${NC}"
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Recovery Complete${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  # Cleanup
  rm -f anchor_peer_*.log
  
  exit 0
else
  echo -e "${RED}❌ Failed to recover anchor peers for: ${FAILED_ORGS[@]}${NC}"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Check if peers are running: docker-compose ps"
  echo "2. Check peer logs: docker logs peer0.ecta.coffee-export.com"
  echo "3. Check orderer logs: docker logs orderer.coffee-export.com"
  echo "4. Verify network connectivity: docker network inspect coffee-export-network"
  echo "5. Try restarting peers: docker-compose restart"
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Recovery Incomplete${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  exit 1
fi
