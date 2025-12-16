#!/bin/bash

# Script to retry chaincode deployment after fixing Docker socket issues
# This script will attempt to deploy the coffee-export chaincode with better error handling

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
NETWORK_DIR="${SCRIPT_DIR}"

echo "=========================================="
echo "Retrying Coffee Export Chaincode Deployment"
echo "=========================================="

# Wait for peers to be fully ready
echo "Waiting for peers to be fully ready..."
sleep 10

# Check if peers are healthy
echo "Checking peer health..."
for peer in peer0.commercialbank.coffee-export.com peer0.nationalbank.coffee-export.com peer0.ecta.coffee-export.com peer0.ecx.coffee-export.com peer0.shippingline.coffee-export.com peer0.custom-authorities.coffee-export.com; do
  if docker ps | grep -q "$peer"; then
    echo "✅ $peer is running"
  else
    echo "❌ $peer is not running"
    exit 1
  fi
done

# Set environment variables
export PATH=${SCRIPT_DIR}/../bin:$PATH
export FABRIC_CFG_PATH=${SCRIPT_DIR}/../config
export VERBOSE=false

# Deploy chaincode using the existing script
echo ""
echo "Deploying coffee-export chaincode..."
cd ${SCRIPT_DIR}/scripts

# Run the deployment script
bash deployCC.sh coffeechannel coffee-export ../chaincode/coffee-export golang 1.0

echo ""
echo "=========================================="
echo "✅ Chaincode deployment completed!"
echo "=========================================="
