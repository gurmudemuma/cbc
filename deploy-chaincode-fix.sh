#!/bin/bash

# Script to properly deploy chaincode with correct environment setup
# This fixes the "Config File core Not Found" error

set -e

echo "=========================================="
echo "Deploying Chaincodes"
echo "=========================================="

# Set environment variables
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/config/

# Change to network directory
cd network

# Deploy the coffee-export chaincode
echo "Deploying coffee-export chaincode..."
./scripts/deployCC.sh coffeechannel coffee-export ../chaincode/coffee-export golang 1.0 1

echo ""
echo "=========================================="
echo "✅ Chaincode deployment completed!"
echo "=========================================="
