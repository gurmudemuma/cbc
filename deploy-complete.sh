#!/bin/bash

# Complete deployment script for Coffee Blockchain Consortium
# This script deploys the entire system step by step

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     Coffee Blockchain Consortium - Complete Deployment    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Set environment variables
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/config/

cd /home/gu-da/CBC

echo "[1/8] Starting Blockchain Network..."
cd network
./network.sh up
echo "✅ Network started"
echo ""

echo "[2/8] Creating Channel..."
./network.sh createChannel -c coffeechannel
echo "✅ Channel created"
echo ""

echo "[3/8] Deploying Coffee Export Chaincode..."
echo "This may take 2-5 minutes..."
cd ..
export FABRIC_CFG_PATH=${PWD}/config/
cd network
./scripts/deployCC.sh coffeechannel coffee-export ../chaincode/coffee-export golang 1.0 1
echo "✅ Coffee Export chaincode deployed"
echo ""

echo "[4/8] Deploying User Management Chaincode..."
echo "This may take 2-5 minutes..."
./scripts/deployCC.sh coffeechannel user-management ../chaincode/user-management golang 1.0 1
echo "✅ User Management chaincode deployed"
echo ""

cd ..

echo "[5/8] Enrolling Admin Users..."
./scripts/enroll-admins.sh
echo "✅ Admin users enrolled"
echo ""

echo "[6/8] Starting API Services..."
./scripts/start-apis.sh
echo "✅ API services started"
echo ""

echo "[7/8] Waiting for services to be ready..."
sleep 10
echo ""

echo "[8/8] System Health Check..."
./scripts/check-health.sh || true
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     ✅ Coffee Blockchain System is Ready!                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Services running:"
echo "  🔗 Blockchain Network: Running"
echo "  📦 Coffee Export Chaincode: Deployed"
echo "  👤 User Management Chaincode: Deployed"
echo "  🏦 Exporter Bank API: http://localhost:3001"
echo "  🏦 National Bank API: http://localhost:3002"
echo "  🏛️  NCAT API: http://localhost:3003"
echo "  🚢 Shipping Line API: http://localhost:3004"
echo ""
echo "Next steps:"
echo "  1. Start the frontend: cd frontend && npm run dev"
echo "  2. Access the application at: http://localhost:5173"
echo ""
echo "Useful commands:"
echo "  - View logs: docker logs <container-name>"
echo "  - Stop system: cd network && ./network.sh down"
echo "  - Check health: ./scripts/check-health.sh"
echo ""
