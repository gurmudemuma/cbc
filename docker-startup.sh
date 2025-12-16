#!/bin/bash

# ============================================================================
# Docker Complete Startup Script
# Containerizes and starts the entire Coffee Export Blockchain system
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
LOG_FILE="$PROJECT_DIR/docker-startup.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    success "Docker is installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    success "Docker Compose is installed: $(docker-compose --version)"
    
    # Check Docker daemon
    if ! docker ps &> /dev/null; then
        error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    success "Docker daemon is running"
    
    # Check disk space
    AVAILABLE_SPACE=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 52428800 ]; then  # 50GB in KB
        warning "Less than 50GB available disk space. Recommended: 50GB+"
    else
        success "Sufficient disk space available"
    fi
    
    # Check memory
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2 {print $7}')
    if [ "$AVAILABLE_MEMORY" -lt 8192 ]; then  # 8GB in MB
        warning "Less than 8GB available memory. Recommended: 16GB+"
    else
        success "Sufficient memory available"
    fi
}

# Build images
build_images() {
    log "Building Docker images..."
    
    cd "$PROJECT_DIR"
    
    # Build all services
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        success "All Docker images built successfully"
    else
        error "Failed to build Docker images"
        exit 1
    fi
}

# Start services
start_services() {
    log "Starting Docker services..."
    
    cd "$PROJECT_DIR"
    
    # Start all services in background
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        success "All Docker services started"
    else
        error "Failed to start Docker services"
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    local max_attempts=60
    local attempt=0
    
    # Wait for PostgreSQL
    log "Waiting for PostgreSQL..."
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            success "PostgreSQL is ready"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "PostgreSQL failed to start"
        return 1
    fi
    
    # Wait for IPFS
    log "Waiting for IPFS..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose exec -T ipfs ipfs id &> /dev/null; then
            success "IPFS is ready"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "IPFS failed to start"
        return 1
    fi
    
    # Wait for Fabric peers
    log "Waiting for Fabric peers..."
    for peer in peer0.commercialbank.coffee-export.com peer0.nationalbank.coffee-export.com peer0.ecta.coffee-export.com peer0.shippingline.coffee-export.com peer0.custom-authorities.coffee-export.com; do
        attempt=0
        while [ $attempt -lt $max_attempts ]; do
            if docker-compose logs "$peer" 2>/dev/null | grep -q "Started peer"; then
                success "$peer is ready"
                break
            fi
            attempt=$((attempt + 1))
            echo -n "."
            sleep 2
        done
    done
    
    # Wait for API services
    log "Waiting for API services..."
    for port in 3001 3002 3003 3004 3005; do
        attempt=0
        while [ $attempt -lt $max_attempts ]; do
            if curl -s http://localhost:$port/health &> /dev/null; then
                success "API on port $port is ready"
                break
            fi
            attempt=$((attempt + 1))
            echo -n "."
            sleep 2
        done
    done
}

# Verify services
verify_services() {
    log "Verifying services..."
    
    cd "$PROJECT_DIR"
    
    # Check running containers
    log "Running containers:"
    docker-compose ps
    
    # Test API endpoints
    log "Testing API endpoints..."
    
    for port in 3001 3002 3003 3004 3005; do
        if curl -s http://localhost:$port/health &> /dev/null; then
            success "API on port $port is responding"
        else
            warning "API on port $port is not responding yet"
        fi
    done
    
    # Test database
    log "Testing database connection..."
    if docker-compose exec -T postgres psql -U postgres -d coffee_export_db -c "SELECT 1" &> /dev/null; then
        success "Database connection successful"
    else
        warning "Database connection failed"
    fi
    
    # Test IPFS
    log "Testing IPFS..."
    if docker-compose exec -T ipfs ipfs id &> /dev/null; then
        success "IPFS is responding"
    else
        warning "IPFS is not responding"
    fi
}

# Display summary
display_summary() {
    log "=========================================="
    log "Docker Setup Complete!"
    log "=========================================="
    echo ""
    echo -e "${GREEN}Services Running:${NC}"
    echo "  • PostgreSQL Database: localhost:5432"
    echo "  • IPFS API: localhost:5001"
    echo "  • IPFS Gateway: localhost:8080"
    echo "  • Redis Cache: localhost:6379"
    echo "  • Commercial Bank API: http://localhost:3001"
    echo "  • National Bank API: http://localhost:3002"
    echo "  • ECTA API: http://localhost:3003"
    echo "  • Shipping Line API: http://localhost:3004"
    echo "  • Custom Authorities API: http://localhost:3005"
    echo "  • Frontend: http://localhost"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  • View logs: docker-compose logs -f"
    echo "  • View specific service logs: docker-compose logs -f commercialbank-api"
    echo "  • Stop services: docker-compose down"
    echo "  • Stop and remove volumes: docker-compose down -v"
    echo "  • Restart services: docker-compose restart"
    echo "  • Access database: docker-compose exec postgres psql -U postgres -d coffee_export_db"
    echo ""
    echo -e "${GREEN}Documentation:${NC}"
    echo "  • See DOCKER_COMPLETE_SETUP.md for detailed information"
    echo ""
}

# Main execution
main() {
    log "=========================================="
    log "Coffee Export Blockchain - Docker Setup"
    log "=========================================="
    echo ""
    
    check_prerequisites
    echo ""
    
    log "Building Docker images..."
    build_images
    echo ""
    
    log "Starting Docker services..."
    start_services
    echo ""
    
    log "Waiting for services to be ready..."
    wait_for_services
    echo ""
    
    log "Verifying services..."
    verify_services
    echo ""
    
    display_summary
    
    success "Docker setup completed successfully!"
}

# Run main function
main "$@"
