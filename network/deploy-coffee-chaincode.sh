#!/bin/bash

# Script to deploy coffee-export chaincode after Docker daemon restart
# This uses a simpler approach with better error handling

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

echo "=========================================="
echo "Deploying Coffee Export Chaincode"
echo "=========================================="

# Set environment variables
export PATH=${SCRIPT_DIR}/../bin:$PATH
export FABRIC_CFG_PATH=${SCRIPT_DIR}/../config
export VERBOSE=false

# Wait for network to be ready
echo "Waiting for network to stabilize..."
sleep 20

echo ""
echo "Starting chaincode deployment..."
cd ${SCRIPT_DIR}/scripts

# Deploy the chaincode
bash deployCC.sh coffeechannel coffee-export ../chaincode/coffee-export golang 1.0

echo ""
echo "=========================================="
echo "✅ Deployment script completed!"
echo "=========================================="
