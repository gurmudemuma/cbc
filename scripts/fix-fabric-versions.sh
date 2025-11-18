#!/bin/bash

# Fix Fabric version mismatch between local binaries and Docker images
# This ensures binaries and images are on the same version

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Fabric Version Mismatch Fix                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detect current versions
echo -e "${YELLOW}Detecting current versions...${NC}"

# Check local binary version
if command -v peer &> /dev/null; then
    LOCAL_VERSION=$(peer version 2>&1 | sed -ne 's/.*Version: //p' | head -1)
    echo -e "  Local binaries: ${GREEN}$LOCAL_VERSION${NC}"
else
    echo -e "  ${RED}✗ peer binary not found${NC}"
    LOCAL_VERSION=""
fi

# Check Docker image version
if docker images | grep -q hyperledger/fabric-tools; then
    DOCKER_VERSION=$(docker run --rm hyperledger/fabric-tools:latest peer version 2>&1 | sed -ne 's/.*Version: //p' | head -1)
    echo -e "  Docker images:  ${GREEN}$DOCKER_VERSION${NC}"
else
    echo -e "  ${YELLOW}⚠ No Docker images found${NC}"
    DOCKER_VERSION=""
fi

echo ""

# Check if versions match
if [ -n "$LOCAL_VERSION" ] && [ -n "$DOCKER_VERSION" ]; then
    if [ "$LOCAL_VERSION" == "$DOCKER_VERSION" ]; then
        echo -e "${GREEN}✅ Versions match! No action needed.${NC}"
        exit 0
    else
        echo -e "${RED}✗ Version mismatch detected!${NC}"
        echo -e "  Local:  $LOCAL_VERSION"
        echo -e "  Docker: $DOCKER_VERSION"
        echo ""
    fi
fi

# Ask user for preferred approach
echo -e "${YELLOW}Choose a fix option:${NC}"
echo ""
if [ -n "$LOCAL_VERSION" ]; then
    echo "1. Update Docker images to match local binaries (v$LOCAL_VERSION) [RECOMMENDED]"
else
    echo "1. Update Docker images to match local binaries (not available - peer binary not found)"
fi

if [ -n "$DOCKER_VERSION" ]; then
    echo "2. Update local binaries to match Docker images (v$DOCKER_VERSION)"
else
    echo "2. Update local binaries to match Docker images (not available - no Docker images found)"
fi

echo "3. Update both to latest stable version (v2.5.14)"
echo "4. Cancel"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        # Update Docker images to match binaries
        if [ -z "$LOCAL_VERSION" ]; then
            echo ""
            echo -e "${RED}Error: Cannot update Docker images - peer binary not found${NC}"
            echo -e "${YELLOW}Please choose option 2 or 3 instead${NC}"
            exit 1
        fi
        
        TARGET_VERSION="$LOCAL_VERSION"
        echo ""
        echo -e "${BLUE}Option 1: Updating Docker images to $TARGET_VERSION${NC}"
        echo ""
        
        # Pull specific version images
        echo -e "${YELLOW}Pulling Hyperledger Fabric Docker images v$TARGET_VERSION...${NC}"
        
        docker pull hyperledger/fabric-peer:$TARGET_VERSION
        docker pull hyperledger/fabric-orderer:$TARGET_VERSION
        docker pull hyperledger/fabric-ccenv:$TARGET_VERSION
        docker pull hyperledger/fabric-tools:$TARGET_VERSION
        docker pull hyperledger/fabric-baseos:$TARGET_VERSION
        docker pull hyperledger/fabric-ca:1.5.7
        
        # Tag as latest for convenience
        docker tag hyperledger/fabric-tools:$TARGET_VERSION hyperledger/fabric-tools:latest
        
        echo ""
        echo -e "${GREEN}✅ Docker images updated to $TARGET_VERSION${NC}"
        ;;
        
    2)
        # Update binaries to match Docker images
        if [ -z "$DOCKER_VERSION" ]; then
            echo ""
            echo -e "${RED}Error: Cannot update binaries - no Docker images found${NC}"
            echo -e "${YELLOW}Please choose option 1 or 3 instead${NC}"
            exit 1
        fi
        
        TARGET_VERSION="$DOCKER_VERSION"
        echo ""
        echo -e "${BLUE}Option 2: Updating binaries to $TARGET_VERSION${NC}"
        echo ""
        
        # Download binaries
        echo -e "${YELLOW}Downloading Fabric binaries v$TARGET_VERSION...${NC}"
        cd "$PROJECT_ROOT"
        
        # Backup existing binaries
        if [ -d "bin" ]; then
            echo "Backing up existing binaries..."
            mv bin bin.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        # Download new binaries
        curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary $TARGET_VERSION 1.5.7
        
        echo ""
        echo -e "${GREEN}✅ Binaries updated to $TARGET_VERSION${NC}"
        ;;
        
    3)
        # Update both to latest stable
        TARGET_VERSION="2.5.14"
        echo ""
        echo -e "${BLUE}Option 3: Updating both to latest stable ($TARGET_VERSION)${NC}"
        echo ""
        
        # Update binaries
        echo -e "${YELLOW}Step 1: Updating binaries to $TARGET_VERSION...${NC}"
        cd "$PROJECT_ROOT"
        
        if [ -d "bin" ]; then
            echo "Backing up existing binaries..."
            mv bin bin.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary $TARGET_VERSION 1.5.7
        
        # Update Docker images
        echo ""
        echo -e "${YELLOW}Step 2: Updating Docker images to $TARGET_VERSION...${NC}"
        
        docker pull hyperledger/fabric-peer:$TARGET_VERSION
        docker pull hyperledger/fabric-orderer:$TARGET_VERSION
        docker pull hyperledger/fabric-ccenv:$TARGET_VERSION
        docker pull hyperledger/fabric-tools:$TARGET_VERSION
        docker pull hyperledger/fabric-baseos:$TARGET_VERSION
        docker pull hyperledger/fabric-ca:1.5.7
        
        docker tag hyperledger/fabric-tools:$TARGET_VERSION hyperledger/fabric-tools:latest
        
        echo ""
        echo -e "${GREEN}✅ Both binaries and Docker images updated to $TARGET_VERSION${NC}"
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}Cancelled. No changes made.${NC}"
        exit 0
        ;;
        
    *)
        echo ""
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Update docker-compose.yml to use correct version
echo ""
echo -e "${YELLOW}Updating docker-compose.yml to use version $TARGET_VERSION...${NC}"

if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    # Create backup
    cp "$PROJECT_ROOT/docker-compose.yml" "$PROJECT_ROOT/docker-compose.yml.backup"
    
    # Update image tags
    sed -i "s|hyperledger/fabric-peer:.*|hyperledger/fabric-peer:$TARGET_VERSION|g" "$PROJECT_ROOT/docker-compose.yml"
    sed -i "s|hyperledger/fabric-orderer:.*|hyperledger/fabric-orderer:$TARGET_VERSION|g" "$PROJECT_ROOT/docker-compose.yml"
    sed -i "s|hyperledger/fabric-tools:.*|hyperledger/fabric-tools:$TARGET_VERSION|g" "$PROJECT_ROOT/docker-compose.yml"
    
    echo -e "${GREEN}✅ docker-compose.yml updated${NC}"
fi

# Update network docker-compose if exists
if [ -f "$PROJECT_ROOT/network/docker/docker-compose.yaml" ]; then
    cp "$PROJECT_ROOT/network/docker/docker-compose.yaml" "$PROJECT_ROOT/network/docker/docker-compose.yaml.backup"
    
    sed -i "s|hyperledger/fabric-peer:.*|hyperledger/fabric-peer:$TARGET_VERSION|g" "$PROJECT_ROOT/network/docker/docker-compose.yaml"
    sed -i "s|hyperledger/fabric-orderer:.*|hyperledger/fabric-orderer:$TARGET_VERSION|g" "$PROJECT_ROOT/network/docker/docker-compose.yaml"
    sed -i "s|hyperledger/fabric-tools:.*|hyperledger/fabric-tools:$TARGET_VERSION|g" "$PROJECT_ROOT/network/docker/docker-compose.yaml"
    
    echo -e "${GREEN}✅ network/docker/docker-compose.yaml updated${NC}"
fi

# Verify fix
echo ""
echo -e "${BLUE}Verifying fix...${NC}"

NEW_LOCAL_VERSION=$(peer version 2>&1 | sed -ne 's/.*Version: //p' | head -1)
NEW_DOCKER_VERSION=$(docker run --rm hyperledger/fabric-tools:$TARGET_VERSION peer version 2>&1 | sed -ne 's/.*Version: //p' | head -1)

echo -e "  Local binaries: ${GREEN}$NEW_LOCAL_VERSION${NC}"
echo -e "  Docker images:  ${GREEN}$NEW_DOCKER_VERSION${NC}"

if [ "$NEW_LOCAL_VERSION" == "$NEW_DOCKER_VERSION" ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ Version mismatch fixed successfully!                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Restart your network: ./start-system.sh --clean"
    echo "2. Verify no more warnings appear"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Versions still don't match. Manual intervention may be needed.${NC}"
    exit 1
fi
