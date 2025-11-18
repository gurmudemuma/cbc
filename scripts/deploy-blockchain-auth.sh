#!/bin/bash

# Complete deployment script for blockchain-based authentication

set -e

echo "🚀 Deploying Blockchain-Based Authentication System"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Deploy user-management chaincode
echo -e "${YELLOW}Step 1: Deploying user-management chaincode...${NC}"
cd network

if [ ! -f "network.sh" ]; then
    echo -e "${RED}Error: network.sh not found. Are you in the correct directory?${NC}"
    exit 1
fi

echo "  - Building chaincode..."
cd ../chaincode/user-management
go mod tidy
cd ../../network

echo "  - Deploying to Fabric network..."
./network.sh deployCC \
  -ccn user-management \
  -ccp ../chaincode/user-management \
  -ccl go \
  -ccv 1.0 \
  -ccs 1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ User-management chaincode deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy chaincode${NC}"
    exit 1
fi

cd ..

echo ""

# Step 2: Update API services
echo -e "${YELLOW}Step 2: Updating API services...${NC}"

if [ ! -f "scripts/update-auth-blockchain.sh" ]; then
    echo -e "${RED}Error: update-auth-blockchain.sh not found${NC}"
    exit 1
fi

chmod +x scripts/update-auth-blockchain.sh
./scripts/update-auth-blockchain.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API services updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update API services${NC}"
    exit 1
fi

echo ""

# Step 3: Verify deployment
echo -e "${YELLOW}Step 3: Verifying deployment...${NC}"

echo "  - Checking chaincode installation..."
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n user-management \
  -c '{"function":"GetAllUsers","Args":[]}' \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chaincode is responding correctly${NC}"
else
    echo -e "${RED}❌ Chaincode verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Restart all API services:"
echo "   cd api/commercial-bank && npm run dev"
echo "   cd api/national-bank && npm run dev"
echo "   cd api/ncat && npm run dev"
echo "   cd api/shipping-line && npm run dev"
echo ""
echo "2. Test the authentication:"
echo "   # Register a user"
echo "   curl -X POST http://localhost:3001/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"testuser\",\"password\":\"Test123!\",\"email\":\"test@example.com\"}'"
echo ""
echo "   # Login from different service"
echo "   curl -X POST http://localhost:3002/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"testuser\",\"password\":\"Test123!\"}'"
echo ""
echo "3. Verify on blockchain:"
echo "   docker exec cli peer chaincode query \\"
echo "     -C coffeechannel \\"
echo "     -n user-management \\"
echo "     -c '{\"function\":\"GetUserByUsername\",\"Args\":[\"testuser\"]}'"
echo ""
echo -e "${GREEN}🎉 Blockchain-based authentication is ready!${NC}"
echo ""
