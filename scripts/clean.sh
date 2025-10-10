#!/bin/bash

# Clean script - removes all generated artifacts and Docker containers
# Use this to reset the network to a clean state

set -e

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "=========================================="
echo "Cleaning Coffee Blockchain Consortium"
echo "=========================================="
echo "Project root: $PROJECT_ROOT"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Stop and remove Docker containers
echo "🧹 Stopping and removing Docker containers..."
if [ -d "network" ]; then
    cd network
    ./network.sh down 2>/dev/null || true
    cd "$PROJECT_ROOT"
else
    echo "⚠️  Network directory not found at: $PROJECT_ROOT/network"
    echo "⚠️  Skipping network shutdown"
fi

# Remove generated crypto material
echo ""
echo "🧹 Removing generated crypto material..."
rm -rf network/organizations/peerOrganizations
rm -rf network/organizations/ordererOrganizations
rm -rf network/organizations/fabric-ca

# Remove channel artifacts
echo ""
echo "🧹 Removing channel artifacts..."
rm -rf network/channel-artifacts
rm -rf network/system-genesis-block

# Remove chaincode packages
echo ""
echo "🧹 Removing chaincode packages..."
rm -f network/*.tar.gz
rm -f network/log.txt

# Remove API build artifacts
echo ""
echo "🧹 Removing API build artifacts..."
rm -rf api/exporter-bank/dist
rm -rf api/national-bank/dist
rm -rf api/ncat/dist
rm -rf api/shipping-line/dist

# Remove node_modules (optional - uncomment if needed)
# echo ""
# echo "🧹 Removing node_modules..."
# rm -rf api/exporter-bank/node_modules
# rm -rf api/national-bank/node_modules
# rm -rf api/ncat/node_modules
# rm -rf api/shipping-line/node_modules

# Remove Docker volumes
echo ""
echo "🧹 Removing Docker volumes..."
docker volume prune -f 2>/dev/null || true

# Remove unused Docker networks
echo ""
echo "🧹 Removing unused Docker networks..."
docker network prune -f 2>/dev/null || true

echo ""
echo "=========================================="
echo "✅ Cleanup completed!"
echo "=========================================="
echo ""
echo "The network has been reset to a clean state."
echo "Run './scripts/setup-env.sh' to set up the environment again."
echo ""
