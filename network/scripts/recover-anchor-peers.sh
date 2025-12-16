#!/bin/bash

# Recover Anchor Peer Configuration
# This script safely recovers from anchor peer configuration errors

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
echo -e "${BLUE}Anchor Peer Recovery Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Organizations
declare -a ORGS=("1" "2" "3" "4" "5")
declare -a NAMES=("CommercialBankMSP" "NationalBankMSP" "ECTAMSP" "ShippingLineMSP" "CustomAuthoritiesMSP")

echo -e "${YELLOW}Step 1: Diagnosing Current State${NC}"
echo "========================================"

# Run diagnostic
if ! ${SCRIPT_DIR}/diagnose-anchor-peers.sh $CHANNEL_NAME; then
  echo -e "${RED}❌ Diagnostic failed${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Cleaning Up Old Anchor Peer Files${NC}"
echo "========================================"

# Clean up old files
cd ${SCRIPT_DIR}/../channel-artifacts

for name in "${NAMES[@]}"; do
  if [ -f "${name}config.json" ]; then
    rm -f "${name}config.json"
    echo "  Removed ${name}config.json"
  fi
  if [ -f "${name}modified_config.json" ]; then
    rm -f "${name}modified_config.json"
    echo "  Removed ${name}modified_config.json"
  fi
  if [ -f "${name}anchors.tx" ]; then
    rm -f "${name}anchors.tx"
    echo "  Removed ${name}anchors.tx"
  fi
done

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo -e "${YELLOW}Step 3: Setting Anchor Peers${NC}"
echo "========================================"

FAILED_ORGS=()
SUCCESS_COUNT=0

for org in "${ORGS[@]}"; do
  echo ""
  echo -e "${BLUE}Setting anchor peer for Org $org...${NC}"
  
  if ${SCRIPT_DIR}/setAnchorPeer.sh $org $CHANNEL_NAME 2>&1 | tee anchor_peer_$org.log; then
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
      cat anchor_peer_$org.log
    fi
  fi
done

echo ""
echo -e "${YELLOW}Step 4: Verification${NC}"
echo "========================================"

# Run diagnostic again
if ${SCRIPT_DIR}/diagnose-anchor-peers.sh $CHANNEL_NAME; then
  echo -e "${GREEN}✅ Verification complete${NC}"
else
  echo -e "${RED}❌ Verification failed${NC}"
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
  exit 0
else
  echo -e "${RED}❌ Failed to recover anchor peers for: ${FAILED_ORGS[@]}${NC}"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Check if peers are running: docker-compose ps"
  echo "2. Check peer logs: docker logs peer0.ecta.coffee-export.com"
  echo "3. Check orderer logs: docker logs orderer.coffee-export.com"
  echo "4. Verify network connectivity: docker network inspect coffee-export-network"
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Recovery Incomplete${NC}"
  echo -e "${BLUE}========================================${NC}"
  exit 1
fi
