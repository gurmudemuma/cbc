#!/bin/bash

# Verification script to check if all critical files are present

echo "=========================================="
echo "Coffee Blockchain Consortium - Setup Verification"
echo "=========================================="
echo ""

MISSING_FILES=0
TOTAL_CHECKS=0

check_file() {
    local file=$1
    local description=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        echo "✅ $description"
        return 0
    else
        echo "❌ $description - MISSING: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
        return 1
    fi
}

check_executable() {
    local file=$1
    local description=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ] && [ -x "$file" ]; then
        echo "✅ $description (executable)"
        return 0
    elif [ -f "$file" ]; then
        echo "⚠️  $description (exists but not executable)"
        return 1
    else
        echo "❌ $description - MISSING: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
        return 1
    fi
}

echo "Checking Network Scripts..."
echo "----------------------------"
check_executable "network/scripts/envVar.sh" "Environment variables script"
check_executable "network/scripts/deployCC.sh" "Deploy chaincode script"
check_executable "network/scripts/setAnchorPeer.sh" "Set anchor peer script"
check_executable "network/scripts/ccp-generate.sh" "Connection profile generator"
check_executable "network/scripts/create-channel.sh" "Create channel script"
check_executable "network/scripts/generate-certs.sh" "Generate certificates script"

echo ""
echo "Checking Cryptogen Configurations..."
echo "-------------------------------------"
check_file "network/organizations/cryptogen/crypto-config-exporterbank.yaml" "ExporterBank crypto config"
check_file "network/organizations/cryptogen/crypto-config-nationalbank.yaml" "NationalBank crypto config"
check_file "network/organizations/cryptogen/crypto-config-ncat.yaml" "NCAT crypto config"
check_file "network/organizations/cryptogen/crypto-config-shippingline.yaml" "ShippingLine crypto config"
check_file "network/organizations/cryptogen/crypto-config-orderer.yaml" "Orderer crypto config"

echo ""
echo "Checking Connection Profile Templates..."
echo "-----------------------------------------"
check_file "network/organizations/ccp-template.json" "JSON connection profile template"
check_file "network/organizations/ccp-template.yaml" "YAML connection profile template"

echo ""
echo "Checking Setup Scripts..."
echo "-------------------------"
check_executable "scripts/setup-env.sh" "Environment setup script"
check_executable "scripts/install-fabric.sh" "Fabric installation script"
check_executable "scripts/clean.sh" "Cleanup script"
check_executable "scripts/verify-setup.sh" "Verification script"

echo ""
echo "Checking Network Configuration..."
echo "---------------------------------"
check_file "network/configtx/configtx.yaml" "Configtx configuration"
check_file "network/docker/docker-compose.yaml" "Docker Compose configuration"
check_executable "network/network.sh" "Network management script"

echo ""
echo "Checking Shared API Package File..."
echo "-----------------------------"
check_file "api/package.json" "Shared API package.json"

echo ""
echo "Checking for @types/uuid in shared package.json..."
echo "--------------------------------------------------"

check_types_uuid() {
    local file=$1
    if grep -q '"@types/uuid"' "$file"; then
        echo "✅ @types/uuid present in shared package.json"
        return 0
    else
        echo "❌ @types/uuid missing in shared package.json"
        MISSING_FILES=$((MISSING_FILES + 1))
        return 1
    fi
}

check_types_uuid "api/package.json"

echo ""
echo "Checking Chaincode..."
echo "---------------------"
check_file "chaincode/coffee-export/main.go" "Chaincode main file"
check_file "chaincode/coffee-export/contract.go" "Chaincode contract file"
check_file "chaincode/coffee-export/go.mod" "Chaincode go.mod"

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo "Total checks: $TOTAL_CHECKS"
echo "Passed: $((TOTAL_CHECKS - MISSING_FILES))"
echo "Failed: $MISSING_FILES"
echo ""

if [ $MISSING_FILES -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo ""
    echo "Your setup is complete. You can now:"
    echo "1. Run './scripts/setup-env.sh' to install dependencies"
    echo "2. Run 'cd network && ./network.sh up' to start the network"
    echo ""
    exit 0
else
    echo "❌ SOME CHECKS FAILED!"
    echo ""
    echo "Please review the missing files above and ensure all"
    echo "required components are in place."
    echo ""
    exit 1
fi
