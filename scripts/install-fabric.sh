#!/bin/bash

# Install Hyperledger Fabric binaries and Docker images
# This script downloads and installs the necessary Fabric tools

# Don't exit on error - we'll check manually
set +e

echo "=========================================="
echo "Installing Hyperledger Fabric"
echo "=========================================="

# Fabric version
FABRIC_VERSION=${1:-"2.5.4"}
CA_VERSION=${2:-"1.5.7"}

echo ""
echo "Fabric Version: $FABRIC_VERSION"
echo "CA Version: $CA_VERSION"
echo ""

# Create bin directory if it doesn't exist
mkdir -p bin

# Check if binaries already exist
if command -v peer &> /dev/null && command -v orderer &> /dev/null; then
    echo "⚠️  Fabric binaries already installed, skipping download..."
else
    # Download Fabric binaries
    echo "Downloading Fabric binaries..."
    
    # Capture download errors but don't exit
    if curl -sSL https://bit.ly/2ysbOFE | bash -s -- $FABRIC_VERSION $CA_VERSION -d -s 2>&1; then
        echo "✅ Download completed"
    else
        echo "⚠️  Download had errors, but checking if binaries are available..."
    fi
    
    # Move binaries to bin directory
    if [ -d "fabric-samples/bin" ]; then
        cp -r fabric-samples/bin/* bin/ 2>/dev/null || true
        echo "✅ Binaries copied to bin/"
    fi
fi

# Add bin to PATH (for current session)
export PATH=$PWD/bin:$PATH

# Verify binaries are actually working
echo ""
echo "Verifying installation..."
ERRORS=0

if command -v peer &> /dev/null; then
    echo "✅ peer: $(peer version 2>&1 | grep Version | head -1)"
else
    echo "❌ peer binary not found"
    ((ERRORS++))
fi

if command -v orderer &> /dev/null; then
    echo "✅ orderer: $(orderer version 2>&1 | grep Version | head -1)"
else
    echo "❌ orderer binary not found"
    ((ERRORS++))
fi

if command -v configtxgen &> /dev/null; then
    echo "✅ configtxgen: $(configtxgen --version 2>&1 | head -1)"
else
    echo "❌ configtxgen binary not found"
    ((ERRORS++))
fi

if command -v configtxlator &> /dev/null; then
    echo "✅ configtxlator available"
else
    echo "❌ configtxlator binary not found"
    ((ERRORS++))
fi

if command -v cryptogen &> /dev/null; then
    echo "✅ cryptogen available"
else
    echo "❌ cryptogen binary not found"
    ((ERRORS++))
fi

if command -v fabric-ca-client &> /dev/null; then
    echo "✅ fabric-ca-client available"
else
    echo "❌ fabric-ca-client binary not found"
    ((ERRORS++))
fi

# Check Docker images
echo ""
echo "Checking Docker images..."
if docker images | grep -q hyperledger/fabric; then
    echo "✅ Docker images found"
    docker images | grep hyperledger/fabric | head -5
else
    echo "⚠️  No Hyperledger Fabric Docker images found"
    echo "   You may need to pull them manually or they will be pulled on first use"
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ Fabric installation completed!"
    echo "=========================================="
    echo ""
    echo "To use the binaries, add them to your PATH:"
    echo "export PATH=\$PWD/bin:\$PATH"
    echo ""
    echo "Or add this line to your ~/.bashrc or ~/.zshrc:"
    echo "export PATH=$PWD/bin:\$PATH"
    exit 0
else
    echo "⚠️  Fabric installation completed with $ERRORS missing binaries"
    echo "=========================================="
    echo ""
    echo "Some binaries are missing. You may need to:"
    echo "1. Download binaries manually from:"
    echo "   https://github.com/hyperledger/fabric/releases/tag/v$FABRIC_VERSION"
    echo "2. Or try running this script again"
    exit 1
fi
echo ""
