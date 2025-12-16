#!/bin/bash

# ============================================================================
# Docker Setup Verification Script
# Verify that all Docker setup is complete and ready
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Main verification
main() {
    log "=========================================="
    log "Docker Setup Verification"
    log "=========================================="
    echo ""
    
    local all_good=true
    
    # Check Docker
    log "Checking Docker installation..."
    if command -v docker &> /dev/null; then
        success "Docker is installed: $(docker --version)"
    else
        error "Docker is not installed"
        all_good=false
    fi
    
    # Check Docker Compose
    log "Checking Docker Compose installation..."
    if command -v docker-compose &> /dev/null; then
        success "Docker Compose is installed: $(docker-compose --version)"
    else
        error "Docker Compose is not installed"
        all_good=false
    fi
    
    # Check Docker daemon
    log "Checking Docker daemon..."
    if docker ps &> /dev/null; then
        success "Docker daemon is running"
    else
        error "Docker daemon is not running"
        all_good=false
    fi
    
    echo ""
    log "Checking configuration files..."
    
    # Check docker-compose.yml
    if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
        success "docker-compose.yml exists"
    else
        error "docker-compose.yml not found"
        all_good=false
    fi
    
    # Check startup script
    if [ -f "$PROJECT_DIR/docker-startup.sh" ]; then
        if [ -x "$PROJECT_DIR/docker-startup.sh" ]; then
            success "docker-startup.sh exists and is executable"
        else
            warning "docker-startup.sh exists but is not executable"
            chmod +x "$PROJECT_DIR/docker-startup.sh"
            success "Made docker-startup.sh executable"
        fi
    else
        error "docker-startup.sh not found"
        all_good=false
    fi
    
    # Check management script
    if [ -f "$PROJECT_DIR/docker-manage.sh" ]; then
        if [ -x "$PROJECT_DIR/docker-manage.sh" ]; then
            success "docker-manage.sh exists and is executable"
        else
            warning "docker-manage.sh exists but is not executable"
            chmod +x "$PROJECT_DIR/docker-manage.sh"
            success "Made docker-manage.sh executable"
        fi
    else
        error "docker-manage.sh not found"
        all_good=false
    fi
    
    echo ""
    log "Checking documentation files..."
    
    local docs=(
        "DOCKER_INDEX.md"
        "EVERYTHING_ON_DOCKER_SUMMARY.md"
        "DOCKER_QUICKSTART.md"
        "DOCKER_COMPLETE_SETUP.md"
        "DOCKER_IMPLEMENTATION_COMPLETE.md"
        "CONFIGURATION_ISSUES_FIXED.md"
    )
    
    for doc in "${docs[@]}"; do
        if [ -f "$PROJECT_DIR/$doc" ]; then
            success "$doc exists"
        else
            warning "$doc not found (optional)"
        fi
    done
    
    echo ""
    log "Checking API configuration files..."
    
    local apis=(
        "commercial-bank"
        "national-bank"
        "ecta"
        "shipping-line"
        "custom-authorities"
    )
    
    for svc in "${apis[@]}"; do
        if [ -f "$PROJECT_DIR/api/$svc/.env" ]; then
            success "api/$svc/.env exists"
        elif [ -f "$PROJECT_DIR/apis/$svc/.env" ]; then
            success "apis/$svc/.env exists"
        else
            warning "$svc .env not found in api/ or apis/ (will rely on defaults)"
        fi
    done
    
    echo ""
    log "Checking Dockerfiles..."
    
    local services=(
        "commercial-bank"
        "national-bank"
        "ecta"
        "shipping-line"
        "custom-authorities"
    )
    
    local df_missing=0
    for svc in "${services[@]}"; do
        if [ -f "$PROJECT_DIR/api/$svc/Dockerfile" ]; then
            success "api/$svc/Dockerfile exists"
        elif [ -f "$PROJECT_DIR/apis/$svc/Dockerfile" ] || [ -f "$PROJECT_DIR/apis/$svc/Dockerfile.fast" ] || [ -f "$PROJECT_DIR/enterprise-apis/$svc/Dockerfile" ]; then
            success "Found Dockerfile for $svc under apis/ or enterprise-apis/"
        else
            error "Dockerfile for $svc not found in api/ or apis/"
            df_missing=$((df_missing+1))
        fi
    done
    
    if [ -f "$PROJECT_DIR/frontend/Dockerfile" ]; then
        success "frontend/Dockerfile exists"
    else
        error "frontend/Dockerfile not found"
        all_good=false
    fi
    
    if [ $df_missing -gt 0 ]; then
        all_good=false
    fi
    
    echo ""
    log "=========================================="
    
    if [ "$all_good" = true ]; then
        success "All Docker setup files are in place!"
        echo ""
        echo -e "${GREEN}You're ready to start!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Read: DOCKER_INDEX.md"
        echo "2. Run: ./docker-startup.sh"
        echo "3. Access: http://localhost"
        echo ""
        return 0
    else
        error "Some files are missing or Docker is not properly installed"
        echo ""
        echo "Please:"
        echo "1. Install Docker: https://docs.docker.com/get-docker/"
        echo "2. Install Docker Compose: https://docs.docker.com/compose/install/"
        echo "3. Ensure Docker daemon is running"
        echo "4. Run this script again"
        echo ""
        return 1
    fi
}

# Run main
main "$@"
