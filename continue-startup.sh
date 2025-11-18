#!/bin/bash

# Continue startup from chaincode deployment
# This script continues the system startup without cleaning

set -e

echo "=========================================="
echo "Continuing Coffee Blockchain System Startup"
echo "=========================================="

cd /home/gu-da/CBC

# Set environment variables
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/config/

echo ""
echo "[13/16] Deploying User Management Chaincode..."
echo "This may take 2-5 minutes..."

cd network
./scripts/deployCC.sh coffeechannel user-management ../chaincode/user-management golang 1.0 1

cd ..

echo ""
echo "[14/16] Enrolling Admin Users..."
./scripts/enroll-admins.sh

echo ""
echo "[15/16] Starting API Services..."
./scripts/start-apis.sh

echo ""
echo "[16/16] System Health Check..."
sleep 5
./scripts/check-health.sh

echo ""
echo "=========================================="
echo "✅ Coffee Blockchain System is Ready!"
echo "=========================================="
echo ""
echo "Services running:"
echo "  - Blockchain Network: ✅"
echo "  - Coffee Export Chaincode: ✅"
echo "  - User Management Chaincode: ✅"
echo "  - commercialbank API: http://localhost:3001"
echo "  - National Bank API: http://localhost:3002"
echo "  - ECTA API: http://localhost:3003"
echo "  - Shipping Line API: http://localhost:3004"
echo ""
echo "Next steps:"
echo "  1. Start the frontend: cd frontend && npm run dev"
echo "  2. Access the application at: http://localhost:5173"
echo ""
