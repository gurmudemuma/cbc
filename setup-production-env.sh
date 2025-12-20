#!/bin/bash

################################################################################
# Production Environment Setup Script
# 
# This script configures all API services with production-grade secrets
# and proper environment variables for Docker deployment.
#
# Usage:
#   ./setup-production-env.sh
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Generate secure random strings
generate_secret() {
    # Generate 64-character base64 string (48 bytes = 64 chars in base64)
    openssl rand -base64 48
}

generate_encryption_key() {
    # Generate 64-character hex string (32 bytes = 64 chars in hex)
    openssl rand -hex 32
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header "Production Environment Setup"
print_info "Generating production-grade secrets..."
echo ""

# Generate secrets
JWT_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_encryption_key)

print_success "Generated JWT_SECRET"
print_success "Generated ENCRYPTION_KEY"
echo ""

# Services to configure
declare -A SERVICES=(
    [commercial-bank]="3001"
    [custom-authorities]="3002"
    [ecta]="3003"
    [exporter-portal]="3004"
    [national-bank]="3005"
    [ecx]="3006"
    [shipping-line]="3007"
)

print_header "Updating Environment Files"

for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    env_file="${SCRIPT_DIR}/api/${service}/.env"
    
    if [ ! -f "$env_file" ]; then
        print_warning "Skipping $service (.env not found)"
        continue
    fi
    
    print_info "Updating $service..."
    
    # Update NODE_ENV to production
    sed -i "s/NODE_ENV=development/NODE_ENV=production/g" "$env_file"
    
    # Update JWT_SECRET
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" "$env_file"
    
    # Update ENCRYPTION_KEY
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" "$env_file"
    
    # Update DATABASE settings for localhost (non-container)
    sed -i "s|DB_HOST=postgres|DB_HOST=localhost|g" "$env_file"
    sed -i "s|DB_HOST=127.0.0.1|DB_HOST=localhost|g" "$env_file"
    
    # Update IPFS settings for localhost (non-container)
    sed -i "s|IPFS_HOST=ipfs|IPFS_HOST=localhost|g" "$env_file"
    sed -i "s|IPFS_HOST=127.0.0.1|IPFS_HOST=localhost|g" "$env_file"
    
    # Update PORT
    sed -i "s/PORT=.*/PORT=$port/g" "$env_file"
    
    # Update CORS_ORIGIN for Docker
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:80,http://localhost:5173,http://localhost:3000|g" "$env_file"
    
    print_success "Updated $service"
done

echo ""
print_header "Configuration Summary"

print_info "JWT_SECRET: ${JWT_SECRET:0:20}..."
print_info "ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:20}..."
echo ""

print_info "Updated settings:"
echo "  - NODE_ENV: production"
echo "  - DB_HOST: localhost (non-container)"
echo "  - IPFS_HOST: localhost (non-container)"
echo "  - CORS_ORIGIN: Updated for localhost"
echo ""

print_header "Next Steps"

print_info "1. Verify environment files:"
echo "   grep 'JWT_SECRET' api/*/.env"
echo ""

print_info "2. Build services (if needed):"
echo "   npm run build"
echo ""

print_info "3. Start services:"
echo "   ./start-services.sh"
echo ""

print_success "Environment setup complete!"
