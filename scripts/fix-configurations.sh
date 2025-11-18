#!/bin/bash

# Configuration Fix Script
# Fixes identified configuration issues in the Coffee Export Consortium Blockchain

set -e

echo "🔧 Coffee Export Consortium Blockchain - Configuration Fix Script"
echo "=================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the CBC root directory"
    exit 1
fi

echo "Starting configuration fixes..."
echo ""

# Fix 1: Update Vite config port
echo "Fix 1: Updating Vite configuration port..."
if [ -f "frontend/vite.config.js" ]; then
    # Backup original file
    cp frontend/vite.config.js frontend/vite.config.js.backup
    
    # Update port from 3000 to 5173
    sed -i 's/port: 3000/port: 5173/' frontend/vite.config.js
    
    print_success "Updated frontend/vite.config.js port to 5173"
    print_info "Backup saved as frontend/vite.config.js.backup"
else
    print_warning "frontend/vite.config.js not found"
fi
echo ""

# Fix 2: Generate unique JWT secrets for production
echo "Fix 2: Generating unique JWT secrets..."
echo ""
print_info "Generating unique JWT secrets for each API..."

# Function to generate a random secret
generate_secret() {
    openssl rand -base64 32
}

# Create production env files with unique secrets
for api in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
    if [ -f "api/$api/.env.example" ]; then
        SECRET=$(generate_secret)
        
        # Create .env.production file
        cat > "api/$api/.env.production.example" << EOF
# Production Environment Variables
# IMPORTANT: Copy this to .env.production and update values

PORT=$(grep "^PORT=" "api/$api/.env.example" | cut -d'=' -f2)
NODE_ENV=production
JWT_SECRET=$SECRET
JWT_EXPIRES_IN=24h

# Fabric Network Configuration
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME=coffee-export
MSP_ID=$(grep "^MSP_ID=" "api/$api/.env.example" | cut -d'=' -f2)
ORG_NAME=$(grep "^ORG_NAME=" "api/$api/.env.example" | cut -d'=' -f2)

# Production Settings
LOG_LEVEL=info
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
EOF
        
        print_success "Generated unique JWT secret for $api"
        print_info "Created api/$api/.env.production.example"
    else
        print_warning "api/$api/.env.example not found"
    fi
done
echo ""

# Fix 3: Remove user-management contract references
echo "Fix 3: Fixing user-management contract references..."
for api in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
    GATEWAY_FILE="api/$api/src/fabric/gateway.ts"
    
    if [ -f "$GATEWAY_FILE" ]; then
        # Backup original file
        cp "$GATEWAY_FILE" "$GATEWAY_FILE.backup"
        
        # Remove user-management contract references
        # This is a simple fix - in production, you might want to handle this differently
        sed -i '/userContract/d' "$GATEWAY_FILE"
        sed -i '/user-management/d' "$GATEWAY_FILE"
        
        print_success "Removed user-management references from $api gateway"
        print_info "Backup saved as $GATEWAY_FILE.backup"
    else
        print_warning "$GATEWAY_FILE not found"
    fi
done
echo ""

# Fix 4: Make asLocalhost configurable
echo "Fix 4: Making asLocalhost configurable..."
for api in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
    GATEWAY_FILE="api/$api/src/fabric/gateway.ts"
    
    if [ -f "$GATEWAY_FILE" ]; then
        # Update asLocalhost to be environment-dependent
        sed -i "s/asLocalhost: true/asLocalhost: process.env.NODE_ENV !== 'production'/" "$GATEWAY_FILE"
        
        print_success "Made asLocalhost configurable in $api gateway"
    fi
done
echo ""

# Fix 5: Create connection profile generation script
echo "Fix 5: Creating connection profile generation script..."
cat > "network/scripts/generate-connection-profiles.sh" << 'EOF'
#!/bin/bash

# Generate connection profiles for all organizations

set -e

echo "Generating connection profiles..."

# Function to generate connection profile
generate_profile() {
    local ORG=$1
    local ORG_LOWER=$2
    local PORT=$3
    
    cat > "../organizations/peerOrganizations/${ORG_LOWER}.coffee-export.com/connection-${ORG_LOWER}.json" << PROFILE
{
  "name": "${ORG}-network",
  "version": "1.0.0",
  "client": {
    "organization": "${ORG}",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        }
      }
    }
  },
  "organizations": {
    "${ORG}": {
      "mspid": "${ORG}MSP",
      "peers": [
        "peer0.${ORG_LOWER}.coffee-export.com"
      ],
      "certificateAuthorities": [
        "ca.${ORG_LOWER}.coffee-export.com"
      ]
    }
  },
  "peers": {
    "peer0.${ORG_LOWER}.coffee-export.com": {
      "url": "grpcs://localhost:${PORT}",
      "tlsCACerts": {
        "pem": "$(cat ../organizations/peerOrganizations/${ORG_LOWER}.coffee-export.com/peers/peer0.${ORG_LOWER}.coffee-export.com/tls/ca.crt | sed 's/$/\\n/' | tr -d '\n')"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.${ORG_LOWER}.coffee-export.com",
        "hostnameOverride": "peer0.${ORG_LOWER}.coffee-export.com"
      }
    }
  }
}
PROFILE
    
    echo "Generated connection profile for ${ORG}"
}

# Generate profiles for all organizations
generate_profile "Banker" "banker" "7051"
generate_profile "NBRegulatory" "nbregulatory" "8051"
generate_profile "Exporter" "exporter" "6051"
generate_profile "ECTA" "ncat" "9051"
generate_profile "ShippingLine" "shippingline" "10051"

echo "Connection profiles generated successfully!"
EOF

chmod +x "network/scripts/generate-connection-profiles.sh"
print_success "Created connection profile generation script"
print_info "Run: cd network/scripts && ./generate-connection-profiles.sh"
echo ""

# Fix 6: Create configuration validation script
echo "Fix 6: Creating configuration validation script..."
cat > "scripts/validate-config.sh" << 'EOF'
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
check_port 7051 "Peer0 Banker"
check_port 8051 "Peer0 NBRegulatory"
check_port 6051 "Peer0 Exporter"
check_port 9051 "Peer0 ECTA"
check_port 10051 "Peer0 ShippingLine"
check_port 3001 "commercialbank API"
check_port 3002 "National Bank API"
check_port 3006 "Exporter API"
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
for api in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
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
EOF

chmod +x "scripts/validate-config.sh"
print_success "Created configuration validation script"
print_info "Run: ./scripts/validate-config.sh"
echo ""

# Fix 7: Update documentation
echo "Fix 7: Creating updated quick reference..."
cat > "CONFIGURATION_QUICK_FIX.md" << 'EOF'
# Configuration Quick Fix Guide

## Issues Fixed

### 1. ✅ Frontend Port Configuration
- **Changed**: vite.config.js port from 3000 to 5173
- **Reason**: Align with Vite default and actual runtime port
- **Action**: No action needed, already fixed

### 2. ✅ Unique JWT Secrets
- **Created**: .env.production.example files for each API
- **Contains**: Unique JWT secrets for production
- **Action**: Copy .env.production.example to .env.production before deploying

### 3. ✅ User Management Contract
- **Removed**: References to non-existent user-management contract
- **Reason**: Contract not implemented
- **Action**: No action needed, already fixed

### 4. ✅ Environment-Specific Discovery
- **Changed**: asLocalhost now uses NODE_ENV
- **Reason**: Support both development and production
- **Action**: Set NODE_ENV=production in production

### 5. ✅ Connection Profile Generation
- **Created**: generate-connection-profiles.sh script
- **Location**: network/scripts/
- **Action**: Run after network setup

### 6. ✅ Configuration Validation
- **Created**: validate-config.sh script
- **Location**: scripts/
- **Action**: Run before starting system

## How to Use

### For Development
```bash
# No changes needed, continue as before
npm run network:up
npm run channel:create
npm run chaincode:deploy
```

### For Production
```bash
# 1. Copy production env files
for api in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
  cp api/$api/.env.production.example api/$api/.env.production
done

# 2. Update production values in .env.production files
# Edit each file and update:
# - JWT_SECRET (already unique)
# - Any production-specific settings

# 3. Validate configuration
./scripts/validate-config.sh

# 4. Generate connection profiles
cd network/scripts
./generate-connection-profiles.sh
cd ../..

# 5. Start system with production env
NODE_ENV=production npm run network:up
```

## Rollback

If you need to rollback changes:

```bash
# Restore original files from backups
mv frontend/vite.config.js.backup frontend/vite.config.js
mv api/commercial-bank/src/fabric/gateway.ts.backup api/commercial-bank/src/fabric/gateway.ts
# ... repeat for other APIs
```

## Verification

After fixes, verify:

```bash
# 1. Check frontend port
grep "port:" frontend/vite.config.js
# Should show: port: 5173

# 2. Check JWT secrets are unique
for api in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
  echo "=== $api ==="
  grep "JWT_SECRET=" api/$api/.env.production.example
done
# Each should show different secret

# 3. Validate configuration
./scripts/validate-config.sh
# Should pass with 0 errors
```
EOF

print_success "Created CONFIGURATION_QUICK_FIX.md"
echo ""

# Summary
echo "=================================================================="
echo "✅ Configuration fixes completed successfully!"
echo ""
echo "Summary of changes:"
echo "  1. ✅ Updated Vite port to 5173"
echo "  2. ✅ Generated unique JWT secrets for production"
echo "  3. ✅ Removed user-management contract references"
echo "  4. ✅ Made asLocalhost environment-dependent"
echo "  5. ✅ Created connection profile generation script"
echo "  6. ✅ Created configuration validation script"
echo "  7. ✅ Created quick fix documentation"
echo ""
echo "Next steps:"
echo "  1. Review changes in backup files (*.backup)"
echo "  2. Run: ./scripts/validate-config.sh"
echo "  3. For production: Copy .env.production.example to .env.production"
echo "  4. Read: CONFIGURATION_QUICK_FIX.md for details"
echo ""
echo "All original files have been backed up with .backup extension"
echo "=================================================================="
