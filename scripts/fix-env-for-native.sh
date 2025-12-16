#!/bin/bash

# Fix API .env files for native (non-Docker) execution
# This script updates Docker-specific values to work with native Node.js processes

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================="
echo "Fixing API .env Files for Native Execution"
echo "=========================================="

fix_env_for_native() {
    local ENV_FILE=$1
    
    if [ ! -f "$ENV_FILE" ]; then
        echo "⚠️  $ENV_FILE not found, skipping..."
        return
    fi
    
    echo "Updating $ENV_FILE..."
    
    # Change IPFS_HOST from 'ipfs' to 'localhost'
    sed -i 's/^IPFS_HOST=ipfs$/IPFS_HOST=localhost/' "$ENV_FILE"
    
    # Change NODE_ENV to development for native execution
    sed -i 's/^NODE_ENV=production$/NODE_ENV=development/' "$ENV_FILE"
    
    echo "✅ Updated $ENV_FILE"
}

# Fix .env files for all API services
fix_env_for_native "$PROJECT_ROOT/api/commercial-bank/.env"
fix_env_for_native "$PROJECT_ROOT/api/national-bank/.env"
fix_env_for_native "$PROJECT_ROOT/api/ecta/.env"
fix_env_for_native "$PROJECT_ROOT/api/shipping-line/.env"
fix_env_for_native "$PROJECT_ROOT/api/custom-authorities/.env"

echo ""
echo "=========================================="
echo "✅ All .env files updated for native execution!"
echo "=========================================="
echo ""
echo "Changes made:"
echo "  - IPFS_HOST: ipfs → localhost"
echo "  - NODE_ENV: production → development"
echo ""
