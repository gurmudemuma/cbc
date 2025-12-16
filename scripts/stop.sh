#!/bin/bash

# Complete System Shutdown Script
# This script stops all components of the coffee-export system in the correct order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Coffee Export System - Complete Shutdown Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# PHASE 1: STOP API & FRONTEND
# ============================================================================

echo -e "\n${BLUE}══════════════════════════════════════════════���════════════${NC}"
echo -e "${BLUE}PHASE 1: Stopping API Services & Frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Stopping API Services...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}✓ API services and frontend stopped${NC}"

# ============================================================================
# PHASE 2: STOP CCAAS
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: Stopping CCAAS Service${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Stopping CCAAS Service...${NC}"
docker-compose -f docker-compose-ccaas.yml down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}✓ CCAAS service stopped${NC}"

# ============================================================================
# PHASE 3: STOP FABRIC NETWORK
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: Stopping Hyperledger Fabric Network${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Stopping Fabric components...${NC}"
docker stop \
    cli \
    peer0.commercialbank.coffee-export.com \
    peer0.nationalbank.coffee-export.com \
    peer0.ecta.coffee-export.com \
    peer0.shippingline.coffee-export.com \
    peer0.custom-authorities.coffee-export.com \
    orderer.coffee-export.com \
    couchdb0 couchdb1 couchdb2 couchdb3 couchdb4 couchdb5 \
    2>/dev/null || true

echo -e "${GREEN}✓ Fabric network stopped${NC}"

# ============================================================================
# PHASE 4: STOP INFRASTRUCTURE
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 4: Stopping Infrastructure${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Stopping IPFS and PostgreSQL...${NC}"
docker stop ipfs postgres 2>/dev/null || true
echo -e "${GREEN}✓ Infrastructure stopped${NC}"

# ============================================================================
# CLEANUP OPTIONS
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Cleanup Options${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Do you want to remove Docker volumes? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
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
fi

# ============================================================================
# FINAL REPORT
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          System Shutdown Complete!                        ║${NC}"
echo -e "${BLUE}╚══════════════════��═════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ All components stopped successfully${NC}"

echo -e "\n${YELLOW}Remaining containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "No containers running"

echo -e "\n${YELLOW}To restart the system, run:${NC}"
echo "  ./start-system.sh"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
