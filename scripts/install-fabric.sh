#!/bin/bash

# Install Hyperledger Fabric binaries and Docker images
# This script downloads and installs the necessary Fabric tools

set -e

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

# Download Fabric binaries
echo "Downloading Fabric binaries..."
curl -sSL https://bit.ly/2ysbOFE | bash -s -- $FABRIC_VERSION $CA_VERSION -d -s

# Move binaries to bin directory
if [ -d "fabric-samples/bin" ]; then
    cp -r fabric-samples/bin/* bin/
    echo "✅ Binaries copied to bin/"
fi

# Add bin to PATH (for current session)
export PATH=$PWD/bin:$PATH

# Check if binaries are available
echo ""
echo "Verifying installation..."

if command -v peer &> /dev/null; then
    echo "✅ peer: $(peer version | grep Version | head -1)"
else
    echo "❌ peer binary not found"
fi

if command -v orderer &> /dev/null; then
    echo "✅ orderer: $(orderer version | grep Version | head -1)"
else
    echo "❌ orderer binary not found"
fi

if command -v configtxgen &> /dev/null; then
    echo "✅ configtxgen: $(configtxgen --version | head -1)"
else
    echo "❌ configtxgen binary not found"
fi

if command -v configtxlator &> /dev/null; then
    echo "✅ configtxlator available"
else
    echo "❌ configtxlator binary not found"
fi

if command -v cryptogen &> /dev/null; then
    echo "✅ cryptogen available"
else
    echo "❌ cryptogen binary not found"
fi

if command -v fabric-ca-client &> /dev/null; then
    echo "✅ fabric-ca-client available"
else
    echo "❌ fabric-ca-client binary not found"
fi

# Check Docker images
echo ""
echo "Checking Docker images..."
docker images | grep hyperledger/fabric

echo ""
echo "=========================================="
echo "✅ Fabric installation completed!"
echo "=========================================="
echo ""
echo "To use the binaries, add them to your PATH:"
echo "export PATH=\$PWD/bin:\$PATH"
echo ""
echo "Or add this line to your ~/.bashrc or ~/.zshrc:"
echo "export PATH=$PWD/bin:\$PATH"
echo ""
