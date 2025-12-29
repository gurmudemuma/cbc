#!/bin/bash

################################################################################
# Start Infrastructure Services Script
# 
# This script starts all infrastructure services (PostgreSQL, Redis, IPFS)
# using Docker Compose and verifies their health.
#
# Usage:
#   ./start-infrastructure.sh              # Start all infrastructure
#   ./start-infrastructure.sh --help       # Show help
#   ./start-infrastructure.sh --check      # Check prerequisites
#   ./start-infrastructure.sh --status     # Show status
#   ./start-infrastructure.sh --stop       # Stop all services
#   ./start-infrastructure.sh --logs       # Show logs
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.postgres.yml"
NETWORK_NAME="coffee-export-network"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Services
declare -A SERVICES=(
    [postgres]="5432"
    [redis]="6379"
    [ipfs]="5001"
)

################################################################################
# Helper Functions
################################################################################

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

print_debug() {
    echo -e "${CYAN}⚙ $1${NC}"
}

################################################################################
# Prerequisite Checks
################################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        all_ok=false
    else
        print_success "Docker $(docker --version | cut -d' ' -f3)"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        all_ok=false
    else
        print_success "Docker Compose $(docker-compose --version | cut -d' ' -f3)"
    fi
    
    # Check if Docker daemon is running
    if ! docker ps &> /dev/null; then
        print_error "Docker daemon is not running"
        all_ok=false
    else
        print_success "Docker daemon is running"
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $COMPOSE_FILE"
        all_ok=false
    else
        print_success "Docker Compose file found"
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Some prerequisites are missing"
        return 1
    fi
    
    print_success "All prerequisites met"
    return 0
}

################################################################################
# Network Management
################################################################################

create_network() {
    print_header "Setting Up Docker Network"
    
    if docker network ls | grep -q "$NETWORK_NAME"; then
        print_success "Network '$NETWORK_NAME' already exists"
        # Remove and recreate to ensure proper configuration
        print_info "Removing existing network to ensure proper configuration..."
        docker network rm "$NETWORK_NAME" 2>/dev/null || true
        sleep 1
    fi
    
    print_info "Creating network '$NETWORK_NAME'..."
    if docker network create "$NETWORK_NAME" &> /dev/null; then
        print_success "Network '$NETWORK_NAME' created"
    else
        print_warning "Network '$NETWORK_NAME' may already exist"
    fi
    
    echo ""
}

################################################################################
# Service Management
################################################################################

start_infrastructure() {
    print_header "Starting Infrastructure Services"
    
    print_info "Starting services from: $COMPOSE_FILE"
    
    if docker-compose -f "$COMPOSE_FILE" up -d; then
        print_success "Infrastructure services started"
    else
        print_error "Failed to start infrastructure services"
        return 1
    fi
    
    echo ""
}

stop_infrastructure() {
    print_header "Stopping Infrastructure Services"
    
    if docker-compose -f "$COMPOSE_FILE" down; then
        print_success "Infrastructure services stopped"
    else
        print_error "Failed to stop infrastructure services"
        return 1
    fi
    
    echo ""
}

################################################################################
# Health Checks
################################################################################

wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    print_info "Waiting for $service to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        case "$service" in
            postgres)
                if docker exec postgres pg_isready -U postgres &> /dev/null; then
                    print_success "$service is ready"
                    return 0
                fi
                ;;
            redis)
                if docker exec redis redis-cli ping &> /dev/null; then
                    print_success "$service is ready"
                    return 0
                fi
                ;;
            ipfs)
                if docker exec ipfs ipfs id &> /dev/null; then
                    print_success "$service is ready"
                    return 0
                fi
                ;;
        esac
        
        attempt=$((attempt + 1))
        if [ $attempt -lt $max_attempts ]; then
            sleep 1
        fi
    done
    
    print_warning "$service did not become ready within timeout"
    return 1
}

check_infrastructure_health() {
    print_header "Checking Infrastructure Health"
    
    local all_healthy=true
    
    # Check PostgreSQL
    if docker ps --filter "name=postgres" --quiet &> /dev/null; then
        if wait_for_service "postgres" "5432"; then
            # Test database connection
            if docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT 1" &> /dev/null; then
                print_success "PostgreSQL database is accessible"
            else
                print_warning "PostgreSQL is running but database not accessible"
            fi
        else
            print_error "PostgreSQL is not responding"
            all_healthy=false
        fi
    else
        print_error "PostgreSQL container not found"
        all_healthy=false
    fi
    
    # Check Redis
    if docker ps --filter "name=redis" --quiet &> /dev/null; then
        if wait_for_service "redis" "6379"; then
            print_success "Redis is accessible"
        else
            print_error "Redis is not responding"
            all_healthy=false
        fi
    else
        print_warning "Redis container not found (optional)"
    fi
    
    # Check IPFS
    if docker ps --filter "name=ipfs" --quiet &> /dev/null; then
        if wait_for_service "ipfs" "5001"; then
            print_success "IPFS is accessible"
        else
            print_warning "IPFS is not responding (optional)"
        fi
    else
        print_warning "IPFS container not found (optional)"
    fi
    
    echo ""
    
    if [ "$all_healthy" = false ]; then
        return 1
    fi
    
    return 0
}

################################################################################
# Status Functions
################################################################################

show_status() {
    print_header "Infrastructure Status"
    
    if ! docker ps &> /dev/null; then
        print_error "Docker daemon is not running"
        return 1
    fi
    
    echo ""
    print_info "Running Containers:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    print_info "Network Status:"
    if docker network ls | grep -q "$NETWORK_NAME"; then
        print_success "Network '$NETWORK_NAME' exists"
        docker network inspect "$NETWORK_NAME" | grep -A 20 "Containers" || true
    else
        print_warning "Network '$NETWORK_NAME' does not exist"
    fi
    
    echo ""
}

################################################################################
# Log Functions
################################################################################

show_logs() {
    print_header "Infrastructure Logs"
    
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
}

tail_logs() {
    print_header "Tailing Infrastructure Logs (Press Ctrl+C to exit)"
    
    docker-compose -f "$COMPOSE_FILE" logs -f
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${BLUE}Infrastructure Services Startup Script${NC}

${BLUE}Usage:${NC}
    ./start-infrastructure.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Start all infrastructure services
    --help          Show this help message
    --check         Check prerequisites
    --status        Show service status
    --logs          Show recent logs
    --tail          Tail logs in real-time
    --stop          Stop all services
    --restart       Restart all services

${BLUE}Services:${NC}
    PostgreSQL      → localhost:5432
    Redis           → localhost:6379
    IPFS            → localhost:5001

${BLUE}Examples:${NC}
    # Start all infrastructure
    ./start-infrastructure.sh

    # Check if everything is ready
    ./start-infrastructure.sh --check

    # View service status
    ./start-infrastructure.sh --status

    # View logs
    ./start-infrastructure.sh --logs

    # Stop all services
    ./start-infrastructure.sh --stop

${BLUE}Docker Compose File:${NC}
    ${COMPOSE_FILE}

${BLUE}Network:${NC}
    ${NETWORK_NAME}

${BLUE}Database:${NC}
    Name: coffee_export_db
    User: postgres
    Password: postgres

EOF
}

################################################################################
# Main Script
################################################################################

main() {
    local command=${1:-start}
    
    case "$command" in
        --help|-h)
            show_help
            exit 0
            ;;
        --check)
            check_prerequisites
            exit $?
            ;;
        --status)
            show_status
            exit 0
            ;;
        --logs)
            show_logs
            exit 0
            ;;
        --tail)
            tail_logs
            exit 0
            ;;
        --stop)
            stop_infrastructure
            exit 0
            ;;
        --restart)
            stop_infrastructure
            sleep 2
            create_network
            start_infrastructure
            check_infrastructure_health
            exit $?
            ;;
        start)
            print_header "Infrastructure Services Startup"
            print_info "Starting PostgreSQL, Redis, and IPFS..."
            echo ""
            
            check_prerequisites || exit 1
            echo ""
            
            create_network
            
            start_infrastructure || exit 1
            
            check_infrastructure_health
            local result=$?
            echo ""
            
            if [ $result -eq 0 ]; then
                print_header "Infrastructure Ready"
                print_success "All infrastructure services are running and healthy"
                echo ""
                print_info "Services available at:"
                echo "  PostgreSQL: localhost:5432 (user: postgres, password: postgres)"
                echo "  Redis: localhost:6379"
                echo "  IPFS: localhost:5001"
                echo ""
                print_info "Next step: Run './start-all-apis.sh' to start API services"
                echo ""
            else
                print_warning "Some infrastructure services may not be fully ready"
                print_info "Check logs: ./start-infrastructure.sh --logs"
                echo ""
            fi
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
