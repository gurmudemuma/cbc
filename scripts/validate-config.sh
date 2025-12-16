#!/bin/bash

# Configuration Validation Script
# Validates all configurations before deployment

set -e

echo "🔍 Validating Coffee Export Consortium Blockchain Configuration"
echo "=============================================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check if port is in use
check_port() {
    local PORT=$1
    local SERVICE=$2
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Warning: Port $PORT ($SERVICE) is already in use"
        ((WARNINGS++))
    else
        echo "✅ Port $PORT ($SERVICE) is available"
    fi
}

# Check all ports
echo "Checking port availability..."
check_port 7050 "Orderer"
check_port 7051 "Peer0 CommercialBank"
check_port 8051 "Peer0 NationalBank"
check_port 9051 "Peer0 ECTA"
check_port 10051 "Peer0 ShippingLine"
check_port 3001 "Commercial Bank API"
check_port 3002 "National Bank API"
check_port 3003 "ECTA API"
check_port 3004 "Shipping Line API"
check_port 5173 "Frontend"
echo ""

# Check if Docker is running
echo "Checking Docker..."
if docker info >/dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
    ((ERRORS++))
fi
echo ""

# Check if required files exist
echo "Checking required files..."
FILES=(
    "network/configtx/configtx.yaml"
    "network/docker/docker-compose.yaml"
    "network/network.sh"
    "chaincode/coffee-export/contract.go"
    "chaincode/coffee-export/go.mod"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file not found"
        ((ERRORS++))
    fi
done
echo ""

# Check API .env files
echo "Checking API environment files..."
for api in commercial-bank national-bank ecta shipping-line custom-authorities; do
    if [ -f "api/$api/.env" ]; then
        echo "✅ api/$api/.env exists"
    else
        echo "⚠️  api/$api/.env not found (will use .env.example)"
        ((WARNINGS++))
    fi
done
echo ""

# Summary
echo "=============================================================="
echo "Validation Summary:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ Configuration validation passed!"
    exit 0
else
    echo "❌ Configuration validation failed with $ERRORS error(s)"
    exit 1
fi
