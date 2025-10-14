#!/bin/bash

# Script to enroll admin users for all organizations
# This creates the admin identities in the wallet for each API

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================="
echo "Enrolling Admin Users for All Organizations"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to enroll admin for an organization
enroll_admin() {
    local org_name=$1
    local org_domain=$2
    local msp_id=$3
    local api_path=$4
    
    echo -e "${YELLOW}Enrolling admin for ${org_name}...${NC}"
    
    # Create wallet directory if it doesn't exist
    mkdir -p "$api_path/wallet"
    
    # Path to admin credentials
    local cred_path="$PROJECT_ROOT/network/organizations/peerOrganizations/${org_domain}/users/Admin@${org_domain}/msp"
    
    if [ ! -d "$cred_path" ]; then
        echo "Error: Admin credentials not found at $cred_path"
        return 1
    fi
    
    # Create a Node.js script to enroll the admin
    local temp_script="/tmp/enroll-admin-$(echo ${org_name} | tr ' ' '-').js"
    cat > "$temp_script" << 'ENROLLSCRIPT'
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const credPath = process.argv[2];
        const walletPath = process.argv[3];
        const mspId = process.argv[4];
        
        // Load credentials
        const signcertsPath = path.join(credPath, 'signcerts');
        const certFiles = fs.readdirSync(signcertsPath);
        const certFile = certFiles.find(file => file.endsWith('.pem'));
        
        if (!certFile) {
            throw new Error('Certificate file not found');
        }
        
        const certificate = fs.readFileSync(path.join(signcertsPath, certFile), 'utf8');
        const keystorePath = path.join(credPath, 'keystore');
        const keyFiles = fs.readdirSync(keystorePath);
        const privateKey = fs.readFileSync(path.join(keystorePath, keyFiles[0]), 'utf8');
        
        // Create wallet
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        // Create identity
        const identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: mspId,
            type: 'X.509',
        };
        
        await wallet.put('admin', identity);
        console.log('Successfully enrolled admin user');
    } catch (error) {
        console.error('Failed to enroll admin:', error);
        process.exit(1);
    }
}

main();
ENROLLSCRIPT
    
    # Run the enrollment script with proper node_modules path
    cd "$PROJECT_ROOT/api"
    NODE_PATH="$PROJECT_ROOT/api/node_modules" node "$temp_script" "$cred_path" "$api_path/wallet" "$msp_id"
    rm "$temp_script"
    
    echo -e "${GREEN}✅ Admin enrolled for ${org_name}${NC}"
    echo ""
}

# Enroll admins for all organizations
enroll_admin "Exporter Bank" "exporterbank.coffee-export.com" "ExporterBankMSP" "$PROJECT_ROOT/api/exporter-bank"
enroll_admin "National Bank" "nationalbank.coffee-export.com" "NationalBankMSP" "$PROJECT_ROOT/api/national-bank"
enroll_admin "NCAT" "ncat.coffee-export.com" "NCATMSP" "$PROJECT_ROOT/api/ncat"
enroll_admin "Shipping Line" "shippingline.coffee-export.com" "ShippingLineMSP" "$PROJECT_ROOT/api/shipping-line"

echo "=========================================="
echo -e "${GREEN}✅ All admin users enrolled successfully!${NC}"
echo "=========================================="
