#!/bin/bash

# System Cleanup Script
# This script removes all containers, volumes, and networks from previous runs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Coffee Export System - Cleanup Script                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}⚠️  This will remove all containers, volumes, and networks${NC}"
echo -e "${YELLOW}from previous runs. Continue? (y/n)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Cleanup cancelled${NC}"
    exit 0
fi

# ============================================================================
# STOP ALL CONTAINERS
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Stopping All Containers${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Stopping all running containers...${NC}"
docker stop $(docker ps -q) 2>/dev/null || true
echo -e "${GREEN}✓ All containers stopped${NC}"

# ============================================================================
# REMOVE CONTAINERS
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Removing Containers${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════���═${NC}"

echo -e "\n${YELLOW}Removing all containers...${NC}"
docker rm $(docker ps -a -q) 2>/dev/null || true
echo -e "${GREEN}✓ All containers removed${NC}"

# ============================================================================
# REMOVE VOLUMES
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Removing Volumes${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Removing volumes...${NC}"
docker volume rm \
    postgres-data \
    ipfs-data \
    ipfs-staging \
    couchdb0 couchdb1 couchdb2 couchdb3 couchdb4 couchdb5 \
    orderer.coffee-export.com \
    peer0.commercialbank.coffee-export.com \
    peer0.nationalbank.coffee-export.com \
    peer0.ecta.coffee-export.com \
    peer0.shippingline.coffee-export.com \
    peer0.custom-authorities.coffee-export.com \
    commercialbank-wallet \
    national-bank-wallet \
    ecta-wallet \
    shipping-line-wallet \
    custom-authorities-wallet \
    redis-data \
    2>/dev/null || true
echo -e "${GREEN}✓ Volumes removed${NC}"

# ============================================================================
# REMOVE NETWORKS
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Removing Networks${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Removing networks...${NC}"
docker network rm coffee-export-network 2>/dev/null || true
echo -e "${GREEN}✓ Networks removed${NC}"

# ============================================================================
# REMOVE IMAGES (OPTIONAL)
# ============================================================================

echo -e "\n${YELLOW}Do you want to remove Docker images? (y/n)${NC}"
read -r image_response

if [[ "$image_response" =~ ^[Yy]$ ]]; then
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Removing Images${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    echo -e "\n${YELLOW}Removing images...${NC}"
    docker rmi coffee-export-ccaas:latest 2>/dev/null || true
    echo -e "${GREEN}✓ Images removed${NC}"
fi

# ============================================================================
# FINAL REPORT
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Cleanup Complete!                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ System cleaned up successfully${NC}"

echo -e "\n${YELLOW}Remaining resources:${NC}"
echo "  Containers: $(docker ps -a -q | wc -l)"
echo "  Volumes: $(docker volume ls -q | wc -l)"
echo "  Networks: $(docker network ls -q | wc -l)"
echo "  Images: $(docker images -q | wc -l)"

echo -e "\n${YELLOW}To start fresh, run:${NC}"
echo "  ./start-system.sh"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
