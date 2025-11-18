#!/bin/bash

# Fix ECTA crypto material generation issues
# This script regenerates ECTA crypto material with proper permissions

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT/network"

echo "=========================================="
echo "Fixing ECTA Crypto Material"
echo "=========================================="
echo ""

# Step 1: Remove existing ECTA directories
echo "Step 1: Removing existing ECTA directories..."
if [ -d "organizations/peerOrganizations/ecta.coffee-export.com" ]; then
    echo "  Removing organizations/peerOrganizations/ecta.coffee-export.com..."
    sudo rm -rf organizations/peerOrganizations/ecta.coffee-export.com 2>/dev/null || rm -rf organizations/peerOrganizations/ecta.coffee-export.com
fi

if [ -d "organizations/ordererOrganizations/ecta.coffee-export.com" ]; then
    echo "  Removing organizations/ordererOrganizations/ecta.coffee-export.com..."
    sudo rm -rf organizations/ordererOrganizations/ecta.coffee-export.com 2>/dev/null || rm -rf organizations/ordererOrganizations/ecta.coffee-export.com
fi

echo "✅ Old ECTA directories removed"
echo ""

# Step 2: Ensure parent directories exist with correct permissions
echo "Step 2: Ensuring parent directories exist with correct permissions..."
mkdir -p organizations/peerOrganizations
mkdir -p organizations/ordererOrganizations

# Fix permissions if needed
if [ "$(stat -c '%U' organizations/peerOrganizations 2>/dev/null)" = "root" ]; then
    echo "  Fixing peerOrganizations ownership..."
    sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations
fi

if [ "$(stat -c '%U' organizations/ordererOrganizations 2>/dev/null)" = "root" ]; then
    echo "  Fixing ordererOrganizations ownership..."
    sudo chown -R $(whoami):$(whoami) organizations/ordererOrganizations
fi

echo "✅ Parent directories ready"
echo ""

# Step 3: Generate ECTA crypto material
echo "Step 3: Generating ECTA crypto material..."

# Find cryptogen
CRYPTOGEN_CMD=""
if command -v cryptogen.exe &> /dev/null; then
    CRYPTOGEN_CMD="cryptogen.exe"
elif command -v cryptogen &> /dev/null; then
    CRYPTOGEN_CMD="cryptogen"
else
    if [ -x "${PROJECT_ROOT}/bin/cryptogen.exe" ]; then
        CRYPTOGEN_CMD="${PROJECT_ROOT}/bin/cryptogen.exe"
    elif [ -x "${PROJECT_ROOT}/bin/cryptogen" ]; then
        CRYPTOGEN_CMD="${PROJECT_ROOT}/bin/cryptogen"
    fi
fi

if [ -z "$CRYPTOGEN_CMD" ]; then
    echo "❌ cryptogen tool not found"
    exit 1
fi

echo "  Using cryptogen: $CRYPTOGEN_CMD"

# Generate ECTA crypto material
$CRYPTOGEN_CMD generate --config=./organizations/cryptogen/crypto-config-ncat.yaml --output="organizations"

# Verify generation
if [ ! -d "organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/msp" ]; then
    echo "❌ ECTA crypto material generation failed"
    exit 1
fi

echo "✅ ECTA crypto material generated"
echo ""

# Step 4: Fix permissions on generated files
echo "Step 4: Fixing permissions on generated files..."
if [ "$(stat -c '%U' organizations/peerOrganizations/ecta.coffee-export.com 2>/dev/null)" = "root" ]; then
    echo "  Fixing ECTA directory ownership..."
    sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations/ecta.coffee-export.com
fi

echo "✅ Permissions fixed"
echo ""

# Step 5: Regenerate connection profiles
echo "Step 5: Regenerating connection profiles..."
if [ -f "./organizations/ccp-generate.sh" ]; then
    ./organizations/ccp-generate.sh 2>&1 | grep -v "cannot open" || true
    echo "✅ Connection profiles regenerated"
else
    echo "⚠️  ccp-generate.sh not found, skipping connection profile generation"
fi

echo ""
echo "=========================================="
echo "✅ ECTA crypto material fixed!"
echo "=========================================="
echo ""
echo "You can now run: ./network.sh createChannel"
echo ""
