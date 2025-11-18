#!/bin/bash

# Complete ECTA crypto regeneration script
# This script completely regenerates ECTA crypto material from scratch

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT/network"

echo "=========================================="
echo "Complete ECTA Crypto Regeneration"
echo "=========================================="
echo ""

# Step 1: Stop network
echo "Step 1: Stopping network..."
./network.sh down 2>/dev/null || true
sleep 5
echo "✅ Network stopped"
echo ""

# Step 2: Remove all ECTA-related directories
echo "Step 2: Removing ECTA directories..."
sudo rm -rf organizations/peerOrganizations/ecta.coffee-export.com 2>/dev/null || rm -rf organizations/peerOrganizations/ecta.coffee-export.com
sudo rm -rf organizations/ordererOrganizations/ecta.coffee-export.com 2>/dev/null || rm -rf organizations/ordererOrganizations/ecta.coffee-export.com
echo "✅ ECTA directories removed"
echo ""

# Step 3: Fix parent directory permissions
echo "Step 3: Fixing parent directory permissions..."
sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations 2>/dev/null || true
sudo chown -R $(whoami):$(whoami) organizations/ordererOrganizations 2>/dev/null || true
chmod -R u+w organizations/peerOrganizations 2>/dev/null || true
chmod -R u+w organizations/ordererOrganizations 2>/dev/null || true
echo "✅ Permissions fixed"
echo ""

# Step 4: Find cryptogen
echo "Step 4: Finding cryptogen..."
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

echo "✅ Using cryptogen: $CRYPTOGEN_CMD"
echo ""

# Step 5: Generate ECTA crypto material
echo "Step 5: Generating ECTA crypto material..."
echo "  Running: $CRYPTOGEN_CMD generate --config=./organizations/cryptogen/crypto-config-ncat.yaml --output=organizations"

if ! $CRYPTOGEN_CMD generate --config=./organizations/cryptogen/crypto-config-ncat.yaml --output="organizations" 2>&1; then
    echo "❌ ECTA crypto generation failed"
    exit 1
fi

echo "✅ ECTA crypto material generated"
echo ""

# Step 6: Verify ECTA crypto was created
echo "Step 6: Verifying ECTA crypto material..."

if [ ! -d "organizations/peerOrganizations/ecta.coffee-export.com" ]; then
    echo "❌ ECTA peer organization directory not created"
    exit 1
fi

if [ ! -d "organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/msp" ]; then
    echo "❌ ECTA peer MSP directory not created"
    exit 1
fi

if [ ! -d "organizations/peerOrganizations/ecta.coffee-export.com/msp/cacerts" ]; then
    echo "❌ ECTA CA certs directory not created"
    exit 1
fi

echo "✅ ECTA crypto material verified"
echo ""

# Step 7: Fix permissions on generated files
echo "Step 7: Fixing permissions on generated files..."
sudo chown -R $(whoami):$(whoami) organizations/peerOrganizations/ecta.coffee-export.com 2>/dev/null || true
chmod -R u+w organizations/peerOrganizations/ecta.coffee-export.com
echo "✅ Permissions fixed"
echo ""

# Step 8: Regenerate connection profiles
echo "Step 8: Regenerating connection profiles..."
if [ -f "./organizations/ccp-generate.sh" ]; then
    chmod +x ./organizations/ccp-generate.sh
    ./organizations/ccp-generate.sh 2>&1 | grep -v "cannot open" || true
    echo "✅ Connection profiles regenerated"
else
    echo "⚠️  ccp-generate.sh not found"
fi
echo ""

# Step 9: Verify files exist
echo "Step 9: Final verification..."
echo "  Checking ECTA peer MSP..."
ls -la organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com/msp/ | head -5

echo "  Checking ECTA CA certs..."
ls -la organizations/peerOrganizations/ecta.coffee-export.com/msp/cacerts/ | head -5

echo "✅ All ECTA crypto material verified"
echo ""

echo "=========================================="
echo "✅ ECTA Crypto Regeneration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start network: ./network.sh up"
echo "2. Create channel: ./network.sh createChannel"
echo "3. Deploy chaincode: ./network.sh deployCC"
echo ""
