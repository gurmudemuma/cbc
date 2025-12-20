#!/bin/bash

################################################################################
# Master Startup Script - Start Everything
# 
# This script orchestrates the startup of the entire system:
# 1. Infrastructure (PostgreSQL, Redis, IPFS)
# 2. Database initialization
# 3. API services (7 services)
# 4. Frontend
#
# Usage:
#   ./start-all.sh              # Start everything
#   ./start-all.sh --help       # Show help
#   ./start-all.sh --check      # Check prerequisites
#   ./start-all.sh --status     # Show status
#   ./start-all.sh --stop       # Stop everything
#   ./start-all.sh --logs       # Show logs
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Scripts
INFRASTRUCTURE_SCRIPT="${SCRIPT_DIR}/start-infrastructure.sh"
DATABASE_SCRIPT="${SCRIPT_DIR}/init-database.sh"
APIS_SCRIPT="${SCRIPT_DIR}/start-all-apis.sh"
FRONTEND_SCRIPT="${SCRIPT_DIR}/start-frontend.sh"

# Configuration
INFRASTRUCTURE_WAIT=45
DATABASE_WAIT=30
APIS_WAIT=30
FRONTEND_WAIT=15

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║${NC} $1"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_section() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

print_step() {
    echo -e "${CYAN}→ $1${NC}"
}

################################################################################
# Prerequisite Checks
################################################################################

check_scripts_exist() {
    print_section "Checking Required Scripts"
    
    local all_ok=true
    
    if [ ! -f "$INFRASTRUCTURE_SCRIPT" ]; then
        print_error "Infrastructure script not found: $INFRASTRUCTURE_SCRIPT"
        all_ok=false
    else
        print_success "Infrastructure script found"
    fi
    
    if [ ! -f "$DATABASE_SCRIPT" ]; then
        print_error "Database script not found: $DATABASE_SCRIPT"
        all_ok=false
    else
        print_success "Database script found"
    fi
    
    if [ ! -f "$APIS_SCRIPT" ]; then
        print_error "APIs script not found: $APIS_SCRIPT"
        all_ok=false
    else
        print_success "APIs script found"
    fi
    
    if [ ! -f "$FRONTEND_SCRIPT" ]; then
        print_error "Frontend script not found: $FRONTEND_SCRIPT"
        all_ok=false
    else
        print_success "Frontend script found"
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Some required scripts are missing"
        return 1
    fi
    
    print_success "All required scripts found"
    echo ""
    return 0
}

check_prerequisites() {
    print_section "Checking System Prerequisites"
    
    local all_ok=true
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        all_ok=false
    else
        print_success "Docker is installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        all_ok=false
    else
        print_success "Docker Compose is installed"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        all_ok=false
    else
        print_success "Node.js is installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        all_ok=false
    else
        print_success "npm is installed"
    fi
    
    # Check psql
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) is not installed (optional)"
    else
        print_success "PostgreSQL client is installed"
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Some prerequisites are missing"
        return 1
    fi
    
    print_success "All prerequisites met"
    echo ""
    return 0
}

################################################################################
# Startup Functions
################################################################################

start_infrastructure() {
    print_section "Step 1: Starting Infrastructure Services"
    print_step "Starting PostgreSQL, Redis, and IPFS..."
    echo ""
    
    if bash "$INFRASTRUCTURE_SCRIPT"; then
        print_success "Infrastructure services started"
        echo ""
        print_info "Waiting $INFRASTRUCTURE_WAIT seconds for infrastructure to stabilize..."
        sleep $INFRASTRUCTURE_WAIT
        echo ""
        return 0
    else
        print_error "Failed to start infrastructure services"
        return 1
    fi
}

initialize_database() {
    print_section "Step 2: Initializing Database"
    print_step "Creating database and running migrations..."
    echo ""
    
    if bash "$DATABASE_SCRIPT"; then
        print_success "Database initialized"
        echo ""
        print_info "Waiting $DATABASE_WAIT seconds for database to stabilize..."
        sleep $DATABASE_WAIT
        echo ""
        return 0
    else
        print_error "Failed to initialize database"
        return 1
    fi
}

start_apis() {
    print_section "Step 3: Starting API Services"
    print_step "Starting all 7 API services..."
    echo ""
    
    if bash "$APIS_SCRIPT"; then
        print_success "API services started"
        echo ""
        print_info "Waiting $APIS_WAIT seconds for APIs to stabilize..."
        sleep $APIS_WAIT
        echo ""
        return 0
    else
        print_error "Failed to start API services"
        return 1
    fi
}

start_frontend_service() {
    print_section "Step 4: Starting Frontend"
    print_step "Starting React/Vite frontend..."
    echo ""
    
    if bash "$FRONTEND_SCRIPT"; then
        print_success "Frontend started"
        echo ""
        print_info "Waiting $FRONTEND_WAIT seconds for frontend to stabilize..."
        sleep $FRONTEND_WAIT
        echo ""
        return 0
    else
        print_warning "Frontend startup had issues (continuing anyway)"
        echo ""
        return 0
    fi
}

################################################################################
# Status Functions
################################################################################

show_startup_summary() {
    print_header "System Startup Complete"
    
    echo ""
    print_success "All services are running!"
    echo ""
    
    print_section "Access Points"
    
    echo -e "${CYAN}Frontend:${NC}"
    echo "  URL: http://localhost:5173"
    echo ""
    
    echo -e "${CYAN}API Services:${NC}"
    echo "  Commercial Bank:    http://localhost:3001"
    echo "  National Bank:       http://localhost:3002"
    echo "  ECTA:                http://localhost:3003"
    echo "  Shipping Line:       http://localhost:3004"
    echo "  Custom Authorities:  http://localhost:3005"
    echo "  ECX:                 http://localhost:3006"
    echo "  Exporter Portal:     http://localhost:3007"
    echo ""
    
    echo -e "${CYAN}API Documentation:${NC}"
    echo "  http://localhost:3001/api-docs"
    echo ""
    
    echo -e "${CYAN}Infrastructure:${NC}"
    echo "  PostgreSQL: localhost:5432 (user: postgres, password: postgres)"
    echo "  Redis:      localhost:6379"
    echo "  IPFS:       localhost:5001"
    echo ""
    
    print_section "Useful Commands"
    
    echo -e "${CYAN}View Logs:${NC}"
    echo "  ./start-all-apis.sh --logs       # View API logs"
    echo "  ./start-frontend.sh --logs       # View frontend logs"
    echo "  ./start-infrastructure.sh --logs # View infrastructure logs"
    echo ""
    
    echo -e "${CYAN}Check Status:${NC}"
    echo "  ./start-all-apis.sh --status       # Check API status"
    echo "  ./start-frontend.sh --status       # Check frontend status"
    echo "  ./start-infrastructure.sh --status # Check infrastructure status"
    echo ""
    
    echo -e "${CYAN}Stop Services:${NC}"
    echo "  ./stop-all.sh                    # Stop everything"
    echo "  ./start-all-apis.sh --stop       # Stop APIs only"
    echo "  ./start-frontend.sh --stop       # Stop frontend only"
    echo "  ./start-infrastructure.sh --stop # Stop infrastructure only"
    echo ""
    
    print_section "Next Steps"
    
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. Login with your credentials"
    echo "3. Start creating exports"
    echo "4. Monitor logs for any issues"
    echo ""
    
    print_success "System is ready for use!"
    echo ""
}

show_status() {
    print_header "System Status"
    
    echo ""
    print_section "Infrastructure Status"
    bash "$INFRASTRUCTURE_SCRIPT" --status || true
    
    echo ""
    print_section "API Services Status"
    bash "$APIS_SCRIPT" --status || true
    
    echo ""
    print_section "Frontend Status"
    bash "$FRONTEND_SCRIPT" --status || true
    
    echo ""
}

################################################################################
# Stop Functions
################################################################################

stop_all_services() {
    print_header "Stopping All Services"
    
    echo ""
    print_section "Stopping Frontend"
    bash "$FRONTEND_SCRIPT" --stop || true
    
    echo ""
    print_section "Stopping API Services"
    bash "$APIS_SCRIPT" --stop || true
    
    echo ""
    print_section "Stopping Infrastructure"
    bash "$INFRASTRUCTURE_SCRIPT" --stop || true
    
    echo ""
    print_success "All services stopped"
    echo ""
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${MAGENTA}╔══════════════════════════════���═════════════════════════════╗${NC}
${MAGENTA}║${NC} Coffee Export Consortium - Master Startup Script
${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}

${BLUE}Usage:${NC}
    ./start-all.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Start entire system (infrastructure → database → APIs → frontend)
    --help          Show this help message
    --check         Check prerequisites
    --status        Show system status
    --logs          Show all logs
    --stop          Stop all services
    --restart       Restart all services

${BLUE}Startup Sequence:${NC}
    1. Infrastructure (PostgreSQL, Redis, IPFS)
    2. Database initialization and migrations
    3. API services (7 services on ports 3001-3007)
    4. Frontend (React/Vite on port 5173)

${BLUE}Examples:${NC}
    # Start everything
    ./start-all.sh

    # Check if system is ready
    ./start-all.sh --check

    # View system status
    ./start-all.sh --status

    # Stop everything
    ./start-all.sh --stop

${BLUE}Individual Service Scripts:${NC}
    ./start-infrastructure.sh    # Start infrastructure only
    ./init-database.sh           # Initialize database only
    ./start-all-apis.sh          # Start APIs only
    ./start-frontend.sh          # Start frontend only
    ./stop-all.sh                # Stop all services

${BLUE}Access Points:${NC}
    Frontend:       http://localhost:5173
    API Docs:       http://localhost:3001/api-docs
    PostgreSQL:     localhost:5432
    Redis:          localhost:6379
    IPFS:           localhost:5001

${BLUE}Troubleshooting:${NC}
    # View logs
    ./start-all-apis.sh --logs
    ./start-frontend.sh --logs
    ./start-infrastructure.sh --logs

    # Check status
    ./start-all-apis.sh --status
    ./start-frontend.sh --status
    ./start-infrastructure.sh --status

    # Stop and restart
    ./stop-all.sh
    sleep 5
    ./start-all.sh

${BLUE}System Requirements:${NC}
    - Docker and Docker Compose
    - Node.js 16+
    - npm 8+
    - PostgreSQL client (psql) - optional
    - 4GB RAM minimum
    - 10GB disk space

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
            check_scripts_exist || exit 1
            echo ""
            check_prerequisites || exit 1
            echo ""
            print_success "System is ready to start"
            echo ""
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        --logs)
            print_header "System Logs"
            echo ""
            print_section "API Logs"
            bash "$APIS_SCRIPT" --logs || true
            echo ""
            print_section "Frontend Logs"
            bash "$FRONTEND_SCRIPT" --logs || true
            echo ""
            print_section "Infrastructure Logs"
            bash "$INFRASTRUCTURE_SCRIPT" --logs || true
            echo ""
            exit 0
            ;;
        --stop)
            stop_all_services
            exit 0
            ;;
        --restart)
            stop_all_services
            sleep 3
            # Fall through to start
            ;&
        start)
            print_header "Coffee Export Consortium - System Startup"
            print_info "Starting entire system..."
            echo ""
            
            check_scripts_exist || exit 1
            echo ""
            
            check_prerequisites || exit 1
            echo ""
            
            # Start infrastructure
            start_infrastructure || exit 1
            
            # Initialize database
            initialize_database || exit 1
            
            # Start APIs
            start_apis || exit 1
            
            # Start frontend
            start_frontend_service || true
            
            # Show summary
            show_startup_summary
            
            exit 0
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
