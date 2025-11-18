#!/bin/bash

# Continue deployment after timeout
# This script continues from where start-system.sh left off

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║     Continuing Deployment - User Management Chaincode      ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if coffee-export is deployed
echo -e "${BLUE}Checking coffee-export chaincode...${NC}"
COFFEE_CHECK=$(docker exec peer0.commercialbank.coffee-export.com peer lifecycle chaincode querycommitted -C coffeechannel 2>/dev/null | grep -c "coffee-export" 2>/dev/null || echo "0")
COFFEE_CHECK=$(echo "$COFFEE_CHECK" | tr -d '\n\r' | tr -d ' ')

if [ "$COFFEE_CHECK" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✅ coffee-export chaincode is deployed${NC}"
else
    echo -e "${RED}❌ coffee-export chaincode not found${NC}"
    echo -e "${YELLOW}Please run: ./start-system.sh --clean${NC}"
    exit 1
fi

# Deploy user-management chaincode
echo -e "${BLUE}Deploying user-management chaincode...${NC}"
cd "$PROJECT_ROOT/network"

# Try deployment with retry
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo -e "${YELLOW}Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES...${NC}"
    
    if ./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go 2>&1 | tee /tmp/deploy.log; then
        echo -e "${GREEN}✅ user-management chaincode deployed successfully${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}Deployment failed, waiting 10 seconds before retry...${NC}"
            sleep 10
        else
            echo -e "${RED}❌ Failed to deploy after $MAX_RETRIES attempts${NC}"
            echo -e "${YELLOW}Check logs: tail -f /tmp/deploy.log${NC}"
            exit 1
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ Chaincode deployment complete!${NC}"
echo ""

# Verify both chaincodes
echo -e "${BLUE}Verifying deployed chaincodes...${NC}"
docker exec peer0.commercialbank.coffee-export.com peer lifecycle chaincode querycommitted -C coffeechannel

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║              Deployment Completed Successfully! 🎉          ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Next: Start the APIs and Frontend${NC}"
echo -e "${CYAN}Run: cd $PROJECT_ROOT && ./start-system.sh --skip-deps${NC}"
echo ""
