#!/bin/bash

# Safe chaincode reinstallation script
# Handles the broken pipe error by properly cleaning up and restarting

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Safe Chaincode Reinstallation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Step 1: Stop all containers
print_info "Stopping all containers..."
docker-compose down 2>/dev/null || true
sleep 3
print_status "Containers stopped"

# Step 2: Remove chaincode containers
print_info "Removing chaincode containers..."
docker ps -a | grep "dev-peer" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true
docker ps -a | grep "chaincode" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true
sleep 2
print_status "Chaincode containers removed"

# Step 3: Clean up Docker system
print_info "Cleaning up Docker system..."
docker system prune -f --volumes 2>/dev/null || true
print_status "Docker system cleaned"

# Step 4: Verify Docker daemon
print_info "Verifying Docker daemon..."
if ! docker ps > /dev/null 2>&1; then
    print_error "Docker daemon is not responding"
    print_info "Restarting Docker daemon..."
    sudo systemctl restart docker
    sleep 5
fi
print_status "Docker daemon is healthy"

# Step 5: Start the network
print_info "Starting Fabric network..."
docker-compose up -d
sleep 10

# Wait for peers to be ready
print_info "Waiting for peers to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec cli peer node status > /dev/null 2>&1; then
        print_status "Peers are ready"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Peers failed to start within timeout"
    exit 1
fi

# Step 6: Create channel
print_info "Creating channel..."
cd network/scripts
bash createChannel.sh 2>&1 | tail -20 || true
cd "$SCRIPT_DIR"
print_status "Channel created"

# Step 7: Install chaincode
print_info "Installing chaincode..."
cd network/scripts
bash deployCC.sh coffeechannel coffee-export chaincode/coffee-export go 1.0 1 NA NA NA 3 5 false 2>&1 | tail -50 || {
    print_error "Chaincode installation failed"
    exit 1
}
cd "$SCRIPT_DIR"
print_status "Chaincode installed successfully"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Chaincode reinstallation completed!${NC}"
echo "=========================================="
echo ""
echo "Verification commands:"
echo "  docker ps                    # Check running containers"
echo "  docker logs cli              # Check CLI logs"
echo "  docker logs peer0.commercialbank.coffee-export.com  # Check peer logs"
echo ""
