#!/bin/bash

################################################################################
# System Verification Script
# 
# This script performs comprehensive diagnostics of the entire system
# and provides detailed status and troubleshooting information.
#
# Usage:
#   ./verify-system.sh              # Run full verification
#   ./verify-system.sh --help       # Show help
#   ./verify-system.sh --quick      # Quick check
#   ./verify-system.sh --detailed   # Detailed diagnostics
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
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-coffee_export_db}"
DB_USER="${DB_USER:-postgres}"

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

print_ok() {
    echo -e "${GREEN}OK${NC}"
}

print_fail() {
    echo -e "${RED}FAIL${NC}"
}

################################################################################
# System Checks
################################################################################

check_system_requirements() {
    print_section "System Requirements"
    
    echo -n "Docker:              "
    if command -v docker &> /dev/null; then
        print_ok
    else
        print_fail
    fi
    
    echo -n "Docker Compose:      "
    if command -v docker-compose &> /dev/null; then
        print_ok
    else
        print_fail
    fi
    
    echo -n "Node.js:             "
    if command -v node &> /dev/null; then
        print_ok
    else
        print_fail
    fi
    
    echo -n "npm:                 "
    if command -v npm &> /dev/null; then
        print_ok
    else
        print_fail
    fi
    
    echo -n "PostgreSQL client:   "
    if command -v psql &> /dev/null; then
        print_ok
    else
        print_fail
    fi
    
    echo -n "curl:                "
    if command -v curl &> /dev/null; then
        print_ok
    else
        print_fail
    fi
    
    echo ""
}

check_docker_status() {
    print_section "Docker Status"
    
    echo -n "Docker daemon:       "
    if docker ps &> /dev/null; then
        print_ok
    else
        print_fail
        return 1
    fi
    
    echo -n "Docker network:      "
    if docker network ls | grep -q "coffee-export"; then
        print_ok
    else
        print_fail
    fi
    
    echo ""
}

check_infrastructure() {
    print_section "Infrastructure Services"
    
    # PostgreSQL
    echo -n "PostgreSQL:          "
    if docker ps --filter "name=postgres" --quiet &> /dev/null; then
        if docker exec postgres pg_isready -U postgres &> /dev/null; then
            print_ok
        else
            print_fail
        fi
    else
        print_fail
    fi
    
    # Redis
    echo -n "Redis:               "
    if docker ps --filter "name=redis" --quiet &> /dev/null; then
        if docker exec redis redis-cli ping &> /dev/null; then
            print_ok
        else
            print_fail
        fi
    else
        print_fail
    fi
    
    # IPFS
    echo -n "IPFS:                "
    if docker ps --filter "name=ipfs" --quiet &> /dev/null; then
        if docker exec ipfs ipfs id &> /dev/null; then
            print_ok
        else
            print_fail
        fi
    else
        print_fail
    fi
    
    echo ""
}

check_database() {
    print_section "Database"
    
    echo -n "Database connection: "
    if PGPASSWORD="postgres" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
        print_ok
    else
        print_fail
        return 1
    fi
    
    echo -n "Database tables:     "
    local table_count=$(PGPASSWORD="postgres" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$table_count" -gt 0 ]; then
        echo -e "${GREEN}$table_count tables${NC}"
    else
        echo -e "${YELLOW}No tables${NC}"
    fi
    
    echo ""
}

check_api_services() {
    print_section "API Services"
    
    local ports=(3001 3002 3003 3004 3005 3006 3007)
    local services=("Commercial Bank" "National Bank" "ECTA" "Shipping Line" "Custom Authorities" "ECX" "Exporter Portal")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local service=${services[$i]}
        
        echo -n "$service (${port}):  "
        if curl -s "http://localhost:${port}/health" > /dev/null 2>&1; then
            print_ok
        else
            print_fail
        fi
    done
    
    echo ""
}

check_frontend() {
    print_section "Frontend"
    
    echo -n "Frontend (5173):      "
    if curl -s "http://localhost:5173" > /dev/null 2>&1; then
        print_ok
    else
        print_fail
    fi
    
    echo ""
}

check_ports() {
    print_section "Port Availability"
    
    local ports=(3001 3002 3003 3004 3005 3006 3007 5173 5432 6379 5001)
    local names=("API-3001" "API-3002" "API-3003" "API-3004" "API-3005" "API-3006" "API-3007" "Frontend" "PostgreSQL" "Redis" "IPFS")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${names[$i]}
        
        echo -n "$name (${port}):  "
        if command -v lsof &> /dev/null; then
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                print_ok
            else
                print_fail
            fi
        else
            echo "UNKNOWN"
        fi
    done
    
    echo ""
}

check_disk_space() {
    print_section "Disk Space"
    
    if command -v df &> /dev/null; then
        local usage=$(df -h "$SCRIPT_DIR" | tail -1 | awk '{print $5}')
        echo "Usage: $usage"
        
        local available=$(df -h "$SCRIPT_DIR" | tail -1 | awk '{print $4}')
        echo "Available: $available"
    else
        print_warning "df command not found"
    fi
    
    echo ""
}

check_memory() {
    print_section "Memory Usage"
    
    if command -v free &> /dev/null; then
        free -h
    else
        print_warning "free command not found"
    fi
    
    echo ""
}

check_processes() {
    print_section "Running Processes"
    
    echo "Node.js processes:"
    ps aux | grep -E "node|npm" | grep -v grep | wc -l | xargs echo "  Count:"
    
    echo ""
    echo "Docker containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "  Docker not available"
    
    echo ""
}

check_logs() {
    print_section "Recent Errors in Logs"
    
    local logs_dir="${SCRIPT_DIR}/logs"
    
    if [ ! -d "$logs_dir" ]; then
        print_info "No logs directory found"
        return 0
    fi
    
    local error_count=$(grep -r "ERROR\|error\|failed\|Failed" "$logs_dir" 2>/dev/null | wc -l || echo "0")
    
    if [ "$error_count" -gt 0 ]; then
        print_warning "Found $error_count error entries in logs"
        echo ""
        echo "Recent errors:"
        grep -r "ERROR\|error\|failed\|Failed" "$logs_dir" 2>/dev/null | tail -10 || true
    else
        print_success "No errors found in logs"
    fi
    
    echo ""
}

################################################################################
# Detailed Diagnostics
################################################################################

detailed_diagnostics() {
    print_header "Detailed System Diagnostics"
    
    echo ""
    
    # System info
    print_section "System Information"
    echo "OS: $(uname -s)"
    echo "Kernel: $(uname -r)"
    echo "Hostname: $(hostname)"
    echo ""
    
    # Docker info
    if command -v docker &> /dev/null; then
        print_section "Docker Information"
        docker --version
        docker-compose --version
        echo ""
    fi
    
    # Node info
    if command -v node &> /dev/null; then
        print_section "Node.js Information"
        node --version
        npm --version
        echo ""
    fi
    
    # Database info
    if command -v psql &> /dev/null; then
        print_section "Database Information"
        psql --version
        echo ""
        
        if PGPASSWORD="postgres" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" 2>/dev/null; then
            echo ""
        fi
    fi
    
    # Docker containers
    if command -v docker &> /dev/null; then
        print_section "Docker Containers"
        docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
        echo ""
    fi
    
    # Network info
    if command -v docker &> /dev/null; then
        print_section "Docker Networks"
        docker network ls
        echo ""
    fi
}

################################################################################
# Summary Report
################################################################################

generate_summary() {
    print_header "System Verification Summary"
    
    echo ""
    print_section "Status Overview"
    
    local all_ok=true
    
    # Check critical components
    if ! docker ps &> /dev/null; then
        print_error "Docker daemon is not running"
        all_ok=false
    fi
    
    if ! docker ps --filter "name=postgres" --quiet &> /dev/null; then
        print_warning "PostgreSQL container not running"
    fi
    
    if ! curl -s "http://localhost:3001/health" > /dev/null 2>&1; then
        print_warning "API services not responding"
    fi
    
    if [ "$all_ok" = true ]; then
        print_success "System appears to be healthy"
    else
        print_warning "System has issues that need attention"
    fi
    
    echo ""
    print_section "Recommendations"
    
    if ! docker ps &> /dev/null; then
        echo "1. Start Docker daemon"
        echo "   sudo systemctl start docker"
    fi
    
    if ! docker ps --filter "name=postgres" --quiet &> /dev/null; then
        echo "1. Start infrastructure services"
        echo "   ./start-infrastructure.sh"
    fi
    
    if ! curl -s "http://localhost:3001/health" > /dev/null 2>&1; then
        echo "2. Start API services"
        echo "   ./start-all-apis.sh"
    fi
    
    echo ""
    print_section "Useful Commands"
    
    echo "View logs:"
    echo "  ./start-all-apis.sh --logs"
    echo "  ./start-frontend.sh --logs"
    echo "  ./start-infrastructure.sh --logs"
    echo ""
    
    echo "Check status:"
    echo "  ./start-all-apis.sh --status"
    echo "  ./start-frontend.sh --status"
    echo "  ./start-infrastructure.sh --status"
    echo ""
    
    echo "Start/Stop:"
    echo "  ./start-all.sh          # Start everything"
    echo "  ./stop-all.sh           # Stop everything"
    echo ""
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}
${MAGENTA}║${NC} Coffee Export Consortium - System Verification Script
${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}

${BLUE}Usage:${NC}
    ./verify-system.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Run full verification
    --help          Show this help message
    --quick         Quick status check
    --detailed      Detailed diagnostics
    --docker        Check Docker status
    --database      Check database status
    --apis          Check API services
    --frontend      Check frontend status

${BLUE}Examples:${NC}
    # Full verification
    ./verify-system.sh

    # Quick check
    ./verify-system.sh --quick

    # Detailed diagnostics
    ./verify-system.sh --detailed

    # Check specific component
    ./verify-system.sh --database
    ./verify-system.sh --apis

${BLUE}What Gets Checked:${NC}
    - System requirements (Docker, Node.js, etc.)
    - Docker status and containers
    - Infrastructure services (PostgreSQL, Redis, IPFS)
    - Database connectivity and schema
    - API services (all 7 services)
    - Frontend
    - Port availability
    - Disk space and memory
    - Running processes
    - Log files for errors

${BLUE}Output:${NC}
    ✓ = OK
    ✗ = FAIL
    ⚠ = WARNING

EOF
}

################################################################################
# Main Script
################################################################################

main() {
    local command=${1:-full}
    
    case "$command" in
        --help|-h)
            show_help
            exit 0
            ;;
        --quick)
            print_header "Quick System Check"
            echo ""
            check_system_requirements
            check_docker_status || true
            check_infrastructure || true
            check_api_services || true
            check_frontend || true
            echo ""
            ;;
        --detailed)
            print_header "Detailed System Diagnostics"
            echo ""
            detailed_diagnostics
            echo ""
            ;;
        --docker)
            check_docker_status
            ;;
        --database)
            check_database
            ;;
        --apis)
            check_api_services
            ;;
        --frontend)
            check_frontend
            ;;
        full)
            print_header "Full System Verification"
            echo ""
            
            check_system_requirements
            check_docker_status || true
            check_infrastructure || true
            check_database || true
            check_api_services || true
            check_frontend || true
            check_ports || true
            check_disk_space || true
            check_memory || true
            check_processes || true
            check_logs || true
            
            generate_summary
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
