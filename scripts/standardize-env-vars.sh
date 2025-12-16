#!/bin/bash

# Standardize environment variables across all API services
# This script ensures consistent environment variable naming and values across all services

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================="
echo "Standardizing Environment Variables"
echo "=========================================="

# Define standard values that should be consistent across all services
STANDARD_JWT_SECRET="cbc-shared-jwt-secret-change-in-production-min-64-chars-for-security"
STANDARD_IPFS_HOST="localhost"
STANDARD_IPFS_PORT="5001"
STANDARD_IPFS_PROTOCOL="http"
STANDARD_CHANNEL_NAME="coffeechannel"
STANDARD_CHAINCODE_EXPORT="coffee-export"
STANDARD_CHAINCODE_USER="user-management"
STANDARD_CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
STANDARD_LOG_LEVEL="info"
STANDARD_MAX_FILE_SIZE="10"

# Service-specific configurations
declare -A SERVICE_CONFIGS
SERVICE_CONFIGS["commercial-bank"]="3001,CommercialBankMSP,peer0.commercialbank.coffee-export.com:7051,commercial-bank"
SERVICE_CONFIGS["national-bank"]="3002,NationalBankMSP,peer0.nationalbank.coffee-export.com:8051,national-bank"
SERVICE_CONFIGS["ecta"]="3003,ECTAMSP,peer0.ecta.coffee-export.com:9051,ecta"
SERVICE_CONFIGS["shipping-line"]="3004,ShippingLineMSP,peer0.shippingline.coffee-export.com:10051,shipping-line"
SERVICE_CONFIGS["custom-authorities"]="3005,CustomAuthoritiesMSP,peer0.custom-authorities.coffee-export.com:11051,custom-authorities"

standardize_env_vars() {
    local API_DIR=$1
    local ENV_FILE="$API_DIR/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo "⚠️  $ENV_FILE not found, skipping..."
        return
    fi
    
    echo "Standardizing $ENV_FILE..."
    
    # Backup original file
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%s)"
    
    # Update standard variables
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$STANDARD_JWT_SECRET|" "$ENV_FILE"
    sed -i "s|^IPFS_HOST=.*|IPFS_HOST=$STANDARD_IPFS_HOST|" "$ENV_FILE"
    sed -i "s|^IPFS_PORT=.*|IPFS_PORT=$STANDARD_IPFS_PORT|" "$ENV_FILE"
    sed -i "s|^IPFS_PROTOCOL=.*|IPFS_PROTOCOL=$STANDARD_IPFS_PROTOCOL|" "$ENV_FILE"
    sed -i "s|^CHANNEL_NAME=.*|CHANNEL_NAME=$STANDARD_CHANNEL_NAME|" "$ENV_FILE"
    sed -i "s|^CHAINCODE_NAME_EXPORT=.*|CHAINCODE_NAME_EXPORT=$STANDARD_CHAINCODE_EXPORT|" "$ENV_FILE"
    sed -i "s|^CHAINCODE_NAME_USER=.*|CHAINCODE_NAME_USER=$STANDARD_CHAINCODE_USER|" "$ENV_FILE"
    sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$STANDARD_CORS_ORIGIN|" "$ENV_FILE"
    sed -i "s|^LOG_LEVEL=.*|LOG_LEVEL=$STANDARD_LOG_LEVEL|" "$ENV_FILE"
    sed -i "s|^MAX_FILE_SIZE_MB=.*|MAX_FILE_SIZE_MB=$STANDARD_MAX_FILE_SIZE|" "$ENV_FILE"
    
    # Extract service name from directory path
    local SERVICE_NAME=$(basename "$API_DIR")
    
    # Apply service-specific configurations
    if [[ -n "${SERVICE_CONFIGS[$SERVICE_NAME]}" ]]; then
        IFS=',' read -r PORT MSP_ID PEER_ENDPOINT ORG_ID <<< "${SERVICE_CONFIGS[$SERVICE_NAME]}"
        
        sed -i "s|^PORT=.*|PORT=$PORT|" "$ENV_FILE"
        sed -i "s|^MSP_ID=.*|MSP_ID=$MSP_ID|" "$ENV_FILE"
        sed -i "s|^PEER_ENDPOINT=.*|PEER_ENDPOINT=$PEER_ENDPOINT|" "$ENV_FILE"
        sed -i "s|^ORGANIZATION_ID=.*|ORGANIZATION_ID=$ORG_ID|" "$ENV_FILE"
        sed -i "s|^ORGANIZATION_NAME=.*|ORGANIZATION_NAME=$ORG_ID|" "$ENV_FILE"
    fi
    
    # Ensure required variables exist (add if missing)
    local REQUIRED_VARS=(
        "NODE_ENV=development"
        "JWT_EXPIRES_IN=24h"
        "JWT_REFRESH_EXPIRES_IN=7d"
        "RATE_LIMIT_WINDOW_MS=900000"
        "RATE_LIMIT_MAX_REQUESTS=100"
        "WEBSOCKET_ENABLED=true"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var%%=*}=" "$ENV_FILE"; then
            echo "$var" >> "$ENV_FILE"
            echo "  Added: $var"
        fi
    done
    
    echo "✅ Standardized $ENV_FILE"
}

# Standardize .env files for all API services
for service in commercial-bank national-bank ecta shipping-line custom-authorities; do
    if [ -d "$PROJECT_ROOT/api/$service" ]; then
        standardize_env_vars "$PROJECT_ROOT/api/$service"
    fi
done

echo ""
echo "=========================================="
echo "✅ Environment variables standardized across all services!"
echo "=========================================="