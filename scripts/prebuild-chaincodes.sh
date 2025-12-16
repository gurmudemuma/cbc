#!/bin/bash

# Pre-build chaincode Docker images to avoid runtime build failures
# This prevents "broken pipe" errors during peer chaincode installation

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHAINCODE_DIR="$PROJECT_ROOT/chaincode"

echo "=========================================="
echo "Pre-building Chaincode Docker Images"
echo "=========================================="
echo ""

# Build coffee-export chaincode
echo "Building coffee-export chaincode image..."
cd "$CHAINCODE_DIR/coffee-export"

if [ -f "Dockerfile.external" ]; then
    docker build -t hyperledger/fabric-ccenv:coffee-export-1.0 \
        -f Dockerfile.external \
        . 2>&1 | tail -20
    echo "✅ coffee-export chaincode image built successfully"
else
    echo "⚠️  Dockerfile.external not found for coffee-export"
fi

echo ""

# Build user-management chaincode
echo "Building user-management chaincode image..."
cd "$CHAINCODE_DIR/user-management"

if [ -f "Dockerfile.external" ]; then
    docker build -t hyperledger/fabric-ccenv:user-management-1.0 \
        -f Dockerfile.external \
        . 2>&1 | tail -20
    echo "✅ user-management chaincode image built successfully"
else
    echo "⚠️  Dockerfile.external not found for user-management"
fi

echo ""
echo "=========================================="
echo "✅ All chaincode images pre-built"
echo "=========================================="
