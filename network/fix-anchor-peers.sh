#!/bin/bash

# Fix Anchor Peer Configuration Issue
# This script regenerates missing anchor peer transaction files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Fixing Anchor Peer Configuration${NC}"
echo -e "${GREEN}========================================${NC}"

# Ensure configtx directory exists
if [ ! -d "configtx" ]; then
  echo -e "${RED}Error: configtx directory not found${NC}"
  exit 1
fi

# Set Fabric configuration path
export FABRIC_CFG_PATH="${SCRIPT_DIR}/configtx"

# Check if configtxgen is available
if ! command -v configtxgen &> /dev/null; then
  echo -e "${YELLOW}configtxgen not found in PATH, trying to find it...${NC}"
  if [ -f "${SCRIPT_DIR}/../bin/configtxgen" ]; then
    export PATH="${SCRIPT_DIR}/../bin:$PATH"
  elif [ -f "${SCRIPT_DIR}/../../bin/configtxgen" ]; then
    export PATH="${SCRIPT_DIR}/../../bin:$PATH"
  else
    echo -e "${RED}Error: configtxgen not found${NC}"
    exit 1
  fi
fi

# Organizations to configure
declare -A ORGS=(
  ["CommercialBankMSP"]="commercialbank"
  ["NationalBankMSP"]="nationalbank"
  ["ECTAMSP"]="ecta"
  ["ShippingLineMSP"]="shippingline"
  ["CustomAuthoritiesMSP"]="custom-authorities"
  ["ECXMSP"]="ecx"
)

CHANNEL_NAME="coffeechannel"

echo -e "${YELLOW}Generating anchor peer transaction files...${NC}"

for MSP in "${!ORGS[@]}"; do
  ORG="${ORGS[$MSP]}"
  ANCHOR_FILE="${MSP}anchors.tx"
  
  echo -e "${YELLOW}Processing ${MSP}...${NC}"
  
  # Generate anchor peer update transaction
  if configtxgen -profile CoffeeExportGenesis \
    -outputAnchorPeersUpdate "./${ANCHOR_FILE}" \
    -channelID "${CHANNEL_NAME}" \
    -asOrg "${MSP}" 2>&1 | tee /tmp/configtxgen.log; then
    
    if [ -f "${ANCHOR_FILE}" ]; then
      echo -e "${GREEN}✅ Generated ${ANCHOR_FILE}${NC}"
    else
      echo -e "${RED}❌ Failed to generate ${ANCHOR_FILE}${NC}"
      cat /tmp/configtxgen.log
    fi
  else
    echo -e "${RED}❌ Error generating ${ANCHOR_FILE}${NC}"
    cat /tmp/configtxgen.log
  fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Anchor Peer Files Generated${NC}"
echo -e "${GREEN}========================================${NC}"

# List generated files
echo -e "${YELLOW}Generated files:${NC}"
ls -lh *anchors.tx 2>/dev/null || echo "No anchor files found"

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Run: ./network.sh up createChannel"
echo "2. Or run: ./create-channel-docker.sh"
echo ""
