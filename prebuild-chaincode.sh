#!/bin/bash

# Pre-build chaincode images to avoid Docker socket broken pipe errors
# This script builds Docker images for chaincode before deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Pre-building Chaincode Images"
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

# Build chaincode image function
build_chaincode_image() {
    local cc_name=$1
    local cc_path=$2
    local image_tag="hyperledger/fabric-$cc_name:latest"
    
    print_info "Building chaincode image for $cc_name..."
    
    # Check if chaincode directory exists
    if [ ! -d "$cc_path" ]; then
        print_error "Chaincode directory $cc_path does not exist"
        return 1
    fi
    
    # Create temporary Dockerfile for chaincode
    local temp_dir="/tmp/fabric-${cc_name}-build"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # Create Dockerfile
    cat > "$temp_dir/Dockerfile" << 'EOF'
FROM golang:1.19-alpine AS builder

WORKDIR /app
COPY . .

# Download dependencies
RUN go mod download

# Build the chaincode
RUN go build -o chaincode

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/chaincode .
CMD ["./chaincode"]
EOF
    
    # Copy chaincode files
    cp -r "$cc_path"/* "$temp_dir/"
    
    # Build Docker image
    cd "$temp_dir"
    if docker build -t "$image_tag" .; then
        print_status "Successfully built chaincode image: $image_tag"
        # Tag with version
        docker tag "$image_tag" "hyperledger/fabric-$cc_name:1.0"
        print_status "Tagged image as hyperledger/fabric-$cc_name:1.0"
    else
        print_error "Failed to build chaincode image for $cc_name"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    # Cleanup
    cd "$SCRIPT_DIR"
    rm -rf "$temp_dir"
    
    return 0
}

# Build coffee-export chaincode
if [ -d "chaincode/coffee-export" ]; then
    build_chaincode_image "coffee-export" "chaincode/coffee-export"
else
    print_info "Skipping coffee-export chaincode (directory not found)"
fi

# Build user-management chaincode
if [ -d "chaincode/user-management" ]; then
    build_chaincode_image "user-management" "chaincode/user-management"
else
    print_info "Skipping user-management chaincode (directory not found)"
fi

print_info "Pre-building completed!"
echo "=========================================="
echo "✓ Pre-building completed!"
echo "=========================================="