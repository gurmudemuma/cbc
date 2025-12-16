#!/bin/bash

# Sequential chaincode installation to avoid broken pipe errors
# This script installs chaincode on each peer one at a time with delays

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Sequential Chaincode Installation"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Configuration
CHANNEL_NAME="coffeechannel"
CC_NAME="${1:-coffee-export}"
CC_SRC_PATH="chaincode/${CC_NAME}"
CC_VERSION="1.0"
CC_SEQUENCE="1"
INSTALL_DELAY=180  # Increased delay to 180 seconds between installations

# Step 1: Package chaincode
print_info "Packaging chaincode..."
cd network

# Check if package already exists
if [ -f "scripts/${CC_NAME}.tar.gz" ]; then
    print_info "Chaincode package already exists"
else
    docker exec -e GOFLAGS=-mod=readonly cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_SRC_PATH} --lang golang --label ${CC_NAME}_${CC_VERSION}"
    print_status "Chaincode packaged"
fi

# Step 2: Install chaincode on each peer sequentially
print_info "Installing chaincode on peers sequentially..."

# Function to install chaincode on a peer
install_on_peer() {
    local org=$1
    local org_name=$2
    
    print_info "Installing on peer0.${org_name} (org ${org})..."
    
    # Check if already installed
    if docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && . ./scripts/envVar.sh && setGlobalsCLI ${org} && peer lifecycle chaincode queryinstalled 2>/dev/null | grep -q '${CC_NAME}_${CC_VERSION}'"; then
        print_info "Chaincode already installed on peer0.${org_name}"
        return 0
    fi
    
    # Install with retry logic
    local max_retries=5
    local retry_count=0
    local success=false
    
    while [ $retry_count -lt $max_retries ] && [ "$success" = false ]; do
        if [ $retry_count -gt 0 ]; then
            print_info "Retrying installation on peer0.${org_name} (attempt $((retry_count + 1))/$max_retries)..."
            sleep 120
        fi
        
        if docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && . ./scripts/envVar.sh && setGlobalsCLI ${org} && peer lifecycle chaincode install ${CC_NAME}.tar.gz" 2>&1; then
            print_status "Successfully installed on peer0.${org_name}"
            success=true
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                print_info "Installation failed on peer0.${org_name}, will retry after delay..."
            fi
        fi
    done
    
    if [ "$success" = false ]; then
        print_error "Failed to install on peer0.${org_name} after $max_retries attempts"
        # Try one more time with Docker restart
        print_info "Restarting Docker to clear broken pipe error..."
        sudo systemctl restart docker
        sleep 60
        
        # Try one final installation
        if docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && . ./scripts/envVar.sh && setGlobalsCLI ${org} && peer lifecycle chaincode install ${CC_NAME}.tar.gz" 2>&1; then
            print_status "Successfully installed on peer0.${org_name} after Docker restart"
            return 0
        else
            return 1
        fi
    fi
    
    return 0
}

# Install on each organization with delays
print_info "Installing on commercialbank (org 1)..."
install_on_peer 1 "commercialbank"

print_info "Waiting ${INSTALL_DELAY} seconds before next installation..."
sleep ${INSTALL_DELAY}

print_info "Installing on nationalbank (org 2)..."
install_on_peer 2 "nationalbank"

print_info "Waiting ${INSTALL_DELAY} seconds before next installation..."
sleep ${INSTALL_DELAY}

print_info "Installing on ecta (org 3)..."
install_on_peer 3 "ecta"

print_info "Waiting ${INSTALL_DELAY} seconds before next installation..."
sleep ${INSTALL_DELAY}

print_info "Installing on shippingline (org 4)..."
install_on_peer 4 "shippingline"

print_info "Waiting ${INSTALL_DELAY} seconds before next installation..."
sleep ${INSTALL_DELAY}

print_info "Installing on custom-authorities (org 5)..."
install_on_peer 5 "custom-authorities"

# Step 3: Verify installations
print_info "Verifying installations..."
echo "Installed chaincodes on peer:"
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && . ./scripts/envVar.sh && setGlobalsCLI 1 && peer lifecycle chaincode queryinstalled"

print_info "Sequential installation completed!"
echo "=========================================="
echo "✓ Sequential installation completed!"
echo "=========================================="

echo ""
echo "Next steps:"
echo "  1. Approve chaincode on each org"
echo "  2. Commit chaincode definition"
echo "  3. Invoke chaincode"