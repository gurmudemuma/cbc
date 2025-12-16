#!/bin/bash

# Immediate Anchor Peer Fix
# Fixes permission issues and regenerates missing files

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Immediate Anchor Peer Fix${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Fix permissions on existing files
echo -e "${YELLOW}Step 1: Fixing permissions on existing anchor peer files...${NC}"
chmod 644 *anchors.tx 2>/dev/null || true
ls -lh *anchors.tx 2>/dev/null | head -10

# Step 2: Verify configtxgen
echo -e "${YELLOW}Step 2: Verifying configtxgen availability...${NC}"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/configtx"
export PATH="${SCRIPT_DIR}/../bin:$PATH"

if ! command -v configtxgen &> /dev/null; then
  echo -e "${RED}Error: configtxgen not found${NC}"
  exit 1
fi
echo -e "${GREEN}✅ configtxgen found${NC}"

# Step 3: List current anchor peer files
echo -e "${YELLOW}Step 3: Current anchor peer files:${NC}"
ls -lh *anchors.tx 2>/dev/null || echo "No anchor files found"

# Step 4: Identify missing files
echo -e "${YELLOW}Step 4: Checking for missing anchor peer files...${NC}"

declare -A REQUIRED_FILES=(
  ["CommercialBankMSPanchors.tx"]="CommercialBankMSP"
  ["NationalBankMSPanchors.tx"]="NationalBankMSP"
  ["ECTAMSPanchors.tx"]="ECTAMSP"
  ["ShippingLineMSPanchors.tx"]="ShippingLineMSP"
  ["CustomAuthoritiesMSPanchors.tx"]="CustomAuthoritiesMSP"
  ["ECXMSPanchors.tx"]="ECXMSP"
)

MISSING_FILES=()
for FILE in "${!REQUIRED_FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    MISSING_FILES+=("$FILE")
    echo -e "${YELLOW}⚠️  Missing: $FILE${NC}"
  else
    echo -e "${GREEN}✅ Found: $FILE${NC}"
  fi
done

# Step 5: Generate missing files
if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo -e "${YELLOW}Step 5: Generating missing anchor peer files...${NC}"
  
  for FILE in "${MISSING_FILES[@]}"; do
    MSP="${REQUIRED_FILES[$FILE]}"
    echo -e "${YELLOW}Generating $FILE for $MSP...${NC}"
    
    if configtxgen -profile CoffeeExportGenesis \
      -outputAnchorPeersUpdate "./$FILE" \
      -channelID coffeechannel \
      -asOrg "$MSP" 2>&1; then
      echo -e "${GREEN}✅ Generated $FILE${NC}"
    else
      echo -e "${RED}❌ Failed to generate $FILE${NC}"
    fi
  done
else
  echo -e "${GREEN}✅ All anchor peer files present${NC}"
fi

# Step 6: Final verification
echo -e "${YELLOW}Step 6: Final verification...${NC}"
echo -e "${GREEN}All anchor peer files:${NC}"
ls -lh *anchors.tx 2>/dev/null

# Step 7: Copy to Docker if needed
echo -e "${YELLOW}Step 7: Checking Docker container...${NC}"
if docker ps | grep -q cli; then
  echo -e "${YELLOW}Copying anchor peer files to Docker container...${NC}"
  for FILE in *anchors.tx; do
    docker cp "$FILE" cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/ 2>/dev/null || true
  done
  echo -e "${GREEN}✅ Files copied to Docker${NC}"
else
  echo -e "${YELLOW}⚠️  Docker CLI container not running${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Anchor Peer Fix Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Run: cd /home/gu-da/cbc/network"
echo "2. Run: ./network.sh down"
echo "3. Run: ./network.sh up createChannel"
echo ""
