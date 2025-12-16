#!/bin/bash

# Diagnostic and Fix Script for Coffee Export System
# This script identifies and fixes common startup issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Coffee Export System - Diagnostic & Fix Tool            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# DIAGNOSTIC CHECKS
# ============================================================================

echo -e "\n${BLUE}══════════════════════════════════════════════════��════════${NC}"
echo -e "${BLUE}RUNNING DIAGNOSTICS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Check Docker
echo -e "\n${YELLOW}[1/10] Checking Docker Installation...${NC}"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}✗ Docker not installed${NC}"
    exit 1
fi

# Check Docker Daemon
echo -e "\n${YELLOW}[2/10] Checking Docker Daemon...${NC}"
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
else
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo -e "${YELLOW}Attempting to start Docker...${NC}"
    sudo systemctl start docker 2>/dev/null || true
    sleep 2
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓ Docker daemon started${NC}"
    else
        echo -e "${RED}✗ Failed to start Docker daemon${NC}"
        exit 1
    fi
fi

# Check docker-compose
echo -e "\n${YELLOW}[3/10] Checking docker-compose...${NC}"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓ docker-compose installed: $COMPOSE_VERSION${NC}"
else
    echo -e "${RED}✗ docker-compose not installed${NC}"
    exit 1
fi

# Check Docker volumes
echo -e "\n${YELLOW}[4/10] Checking CouchDB Volumes...${NC}"
MISSING_VOLUMES=0
for i in {0..5}; do
    if docker volume inspect "couchdb${i}" &> /dev/null; then
        echo -e "${GREEN}✓ couchdb${i} volume exists${NC}"
    else
        echo -e "${RED}✗ couchdb${i} volume missing${NC}"
        MISSING_VOLUMES=$((MISSING_VOLUMES + 1))
    fi
done

if [ $MISSING_VOLUMES -gt 0 ]; then
    echo -e "\n${YELLOW}Creating missing CouchDB volumes...${NC}"
    for i in {0..5}; do
        if ! docker volume inspect "couchdb${i}" &> /dev/null; then
            docker volume create "couchdb${i}"
            echo -e "${GREEN}✓ Created couchdb${i} volume${NC}"
        fi
    done
fi

# Check docker-compose.yml
echo -e "\n${YELLOW}[5/10] Checking docker-compose.yml...${NC}"
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.yml found${NC}"
    
    # Check for CouchDB configuration
    if grep -q "couchdb0:" docker-compose.yml; then
        echo -e "${GREEN}✓ CouchDB services defined${NC}"
    else
        echo -e "${RED}✗ CouchDB services not defined${NC}"
    fi
    
    # Check for volume mounts
    if grep -q "couchdb0:/opt/couchdb/data" docker-compose.yml; then
        echo -e "${GREEN}✓ CouchDB volume mounts configured${NC}"
    else
        echo -e "${RED}✗ CouchDB volume mounts not configured${NC}"
    fi
else
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    exit 1
fi

# Check running containers
echo -e "\n${YELLOW}[6/10] Checking Running Containers...${NC}"
RUNNING=$(docker ps --format "{{.Names}}" | wc -l)
echo -e "${GREEN}✓ $RUNNING containers currently running${NC}"

# Check for stopped containers
echo -e "\n${YELLOW}[7/10] Checking Stopped Containers...${NC}"
STOPPED=$(docker ps -a --format "{{.Names}}" | wc -l)
TOTAL=$((RUNNING + STOPPED))
echo -e "${GREEN}✓ $STOPPED total containers (including stopped)${NC}"

# Check disk space
echo -e "\n${YELLOW}[8/10] Checking Disk Space...${NC}"
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}')
DISK_AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
echo -e "${GREEN}✓ Disk usage: $DISK_USAGE (Available: $DISK_AVAILABLE)${NC}"

# Check Docker socket
echo -e "\n${YELLOW}[9/10] Checking Docker Socket...${NC}"
if [ -S /var/run/docker.sock ]; then
    echo -e "${GREEN}✓ Docker socket exists${NC}"
else
    echo -e "${RED}✗ Docker socket not found${NC}"
fi

# Check network
echo -e "\n${YELLOW}[10/10] Checking Docker Networks...${NC}"
if docker network inspect coffee-export-network &> /dev/null; then
    echo -e "${GREEN}✓ coffee-export-network exists${NC}"
else
    echo -e "${YELLOW}⚠ coffee-export-network does not exist (will be created on startup)${NC}"
fi

# ============================================================================
# CLEANUP OPTIONS
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}CLEANUP OPTIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Available cleanup options:${NC}"
echo "  1) Clean stopped containers"
echo "  2) Clean dangling images"
echo "  3) Clean dangling volumes"
echo "  4) Full cleanup (containers, images, volumes)"
echo "  5) Reset CouchDB volumes"
echo "  6) Skip cleanup"
echo ""
read -p "Select option (1-6): " cleanup_option

case $cleanup_option in
    1)
        echo -e "\n${YELLOW}Removing stopped containers...${NC}"
        docker container prune -f
        echo -e "${GREEN}✓ Stopped containers removed${NC}"
        ;;
    2)
        echo -e "\n${YELLOW}Removing dangling images...${NC}"
        docker image prune -f
        echo -e "${GREEN}✓ Dangling images removed${NC}"
        ;;
    3)
        echo -e "\n${YELLOW}Removing dangling volumes...${NC}"
        docker volume prune -f
        echo -e "${GREEN}✓ Dangling volumes removed${NC}"
        ;;
    4)
        echo -e "\n${YELLOW}Performing full cleanup...${NC}"
        echo -e "${RED}WARNING: This will remove all stopped containers, dangling images, and dangling volumes${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            docker container prune -f
            docker image prune -f
            docker volume prune -f
            echo -e "${GREEN}✓ Full cleanup completed${NC}"
        else
            echo -e "${YELLOW}Cleanup cancelled${NC}"
        fi
        ;;
    5)
        echo -e "\n${YELLOW}Resetting CouchDB volumes...${NC}"
        echo -e "${RED}WARNING: This will delete all CouchDB data${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            for i in {0..5}; do
                if docker volume inspect "couchdb${i}" &> /dev/null; then
                    docker volume rm "couchdb${i}"
                    docker volume create "couchdb${i}"
                    echo -e "${GREEN}✓ Reset couchdb${i}${NC}"
                fi
            done
        else
            echo -e "${YELLOW}Reset cancelled${NC}"
        fi
        ;;
    6)
        echo -e "${YELLOW}Skipping cleanup${NC}"
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

# ============================================================================
# FINAL RECOMMENDATIONS
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}RECOMMENDATIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Before starting the system:${NC}"
echo "  1. Ensure all required files are present:"
echo "     • docker-compose.yml"
echo "     • docker-compose-ccaas.yml"
echo "     • network/organizations/ directory"
echo "     • chaincode/coffee-export/ directory"
echo ""
echo "  2. Verify environment variables:"
echo "     • Check .env file for required settings"
echo "     • Ensure JWT_SECRET values are set"
echo ""
echo "  3. Check system resources:"
echo "     • Minimum 8GB RAM recommended"
echo "     • Minimum 20GB free disk space"
echo "     • CPU: 4+ cores recommended"
echo ""
echo "  4. Network configuration:"
echo "     • Ensure ports 3001-3005, 5001, 5435, 7050-7051, 5984+ are available"
echo "     • Check firewall settings if accessing from other machines"
echo ""

echo -e "${YELLOW}To start the system:${NC}"
echo "  • Run: ./start-system.sh"
echo ""

echo -e "${YELLOW}To monitor the system:${NC}"
echo "  • View all containers: docker ps"
echo "  • View logs: docker logs -f <container-name>"
echo "  • Check volumes: docker volume ls | grep couchdb"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Diagnostic complete!${NC}"
echo -e "${BLUE}═════════���═════════════════════════════════════════════════${NC}"
