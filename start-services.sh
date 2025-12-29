#!/bin/bash

################################################################################
# Start Services Script
# 
# This script starts all API services with comprehensive management features
# including Docker support, health checks, and full service lifecycle management.
#
# Usage:
#   ./start-services.sh              # Start all services
#   ./start-services.sh --help       # Show help
#   ./start-services.sh --check      # Check prerequisites
#   ./start-services.sh --logs       # Show logs
#   ./start-services.sh --stop       # Stop all services
#   ./start-services.sh --status     # Show service status
#   ./start-services.sh --health     # Check service health
#   ./start-services.sh --restart    # Restart all services
#   ./start-services.sh --tail       # Tail logs in real-time
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
LOG_DIR="${SCRIPT_DIR}/logs"
PID_FILE="${SCRIPT_DIR}/.api-pids"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Services configuration
declare -A SERVICES=(
    [commercial-bank]="3001"
    [custom-authorities]="3002"
    [ecta]="3003"
    [exporter-portal]="3004"
    [national-bank]="3005"
    [ecx]="3006"
    [shipping-line]="3007"
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
# Docker Detection & Configuration
################################################################################

detect_docker_environment() {
    print_header "Detecting Docker Environment"
    
    # Check if Docker is running
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found, using localhost"
        POSTGRES_IP="127.0.0.1"
        IPFS_IP="127.0.0.1"
        DOCKER_AVAILABLE=false
    else
        DOCKER_AVAILABLE=true
        print_success "Docker is available"
        
        # Get PostgreSQL container IP
        if docker ps --filter "name=postgres" --quiet &> /dev/null; then
            POSTGRES_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' postgres 2>/dev/null || echo "127.0.0.1")
            if [ -z "$POSTGRES_IP" ]; then
                POSTGRES_IP="127.0.0.1"
            fi
            print_success "PostgreSQL container detected at $POSTGRES_IP"
        else
            print_warning "PostgreSQL container not running, using localhost"
            POSTGRES_IP="127.0.0.1"
        fi
        
        # Get IPFS container IP
        if docker ps --filter "name=ipfs" --quiet &> /dev/null; then
            IPFS_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ipfs 2>/dev/null || echo "127.0.0.1")
            if [ -z "$IPFS_IP" ]; then
                IPFS_IP="127.0.0.1"
            fi
            print_success "IPFS container detected at $IPFS_IP"
        else
            print_warning "IPFS container not running, using localhost"
            IPFS_IP="127.0.0.1"
        fi
    fi
    
    # Set final values
    DB_HOST="${POSTGRES_IP:-127.0.0.1}"
    DB_PORT="5432"
    DB_NAME="coffee_export_db"
    DB_USER="postgres"
    DB_PASSWORD="postgres"
    IPFS_HOST="${IPFS_IP:-127.0.0.1}"
    IPFS_PORT="5001"
    
    echo ""
}

################################################################################
# Prerequisite Checks
################################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        all_ok=false
    else
        print_success "Node.js $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        all_ok=false
    else
        print_success "npm $(npm --version)"
    fi
    
    # Check if api directory exists
    if [ ! -d "${SCRIPT_DIR}/api" ]; then
        print_error "API directory not found at ${SCRIPT_DIR}/api"
        all_ok=false
    else
        print_success "API directory found"
    fi
    
    # Check if compiled code exists
    local compiled_count=0
    for service in "${!SERVICES[@]}"; do
        local dist_dir="${SCRIPT_DIR}/api/${service}/dist"
        if [ -d "$dist_dir" ]; then
            compiled_count=$((compiled_count + 1))
        fi
    done
    
    if [ $compiled_count -eq 0 ]; then
        print_warning "No compiled code found. Run 'npm run build' in each service directory"
        all_ok=false
    else
        print_success "Found compiled code for $compiled_count services"
    fi
    
    # Check database connectivity
    if command -v psql &> /dev/null; then
        if psql -h "$DB_HOST" -U postgres -d coffee_export_db -c "SELECT 1" &> /dev/null; then
            print_success "PostgreSQL database is accessible at $DB_HOST"
        else
            print_warning "PostgreSQL database is not accessible at $DB_HOST (will start in degraded mode)"
        fi
    else
        print_warning "PostgreSQL client not found (optional for local testing)"
    fi
    
    # Check IPFS connectivity
    if command -v curl &> /dev/null; then
        if curl -s "http://${IPFS_HOST}:5001/api/v0/id" > /dev/null 2>&1; then
            print_success "IPFS node is accessible at $IPFS_HOST"
        else
            print_warning "IPFS node is not accessible at $IPFS_HOST (optional)"
        fi
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Some prerequisites are missing"
        return 1
    fi
    
    print_success "All prerequisites met"
    return 0
}

################################################################################
# Port Availability Check
################################################################################

check_port_available() {
    local port=$1
    local service=$2
    
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_error "Port $port (${service}) is already in use"
            return 1
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_error "Port $port (${service}) is already in use"
            return 1
        fi
    else
        print_warning "Cannot check port availability (lsof/netstat not found)"
        return 0
    fi
    
    return 0
}

check_all_ports() {
    print_header "Checking Port Availability"
    
    local all_ok=true
    for service in "${!SERVICES[@]}"; do
        local port=${SERVICES[$service]}
        if ! check_port_available $port $service; then
            all_ok=false
        else
            print_success "Port $port available for ${service}"
        fi
    done
    
    if [ "$all_ok" = false ]; then
        print_error "Some ports are already in use"
        return 1
    fi
    
    return 0
}

################################################################################
# Environment Setup
################################################################################

setup_environment() {
    print_header "Setting Up Environment"
    
    # Create logs directory
    mkdir -p "$LOG_DIR"
    print_success "Logs directory: $LOG_DIR"
    
    # Create PID file
    > "$PID_FILE"
    print_success "PID file created: $PID_FILE"
    
    # Check and create .env files if needed
    for service in "${!SERVICES[@]}"; do
        local env_file="${SCRIPT_DIR}/api/${service}/.env"
        if [ ! -f "$env_file" ]; then
            print_warning "Missing .env file for ${service}"
            if [ -f "${env_file}.template" ]; then
                cp "${env_file}.template" "$env_file"
                print_success "Created .env for ${service} from template"
            fi
        else
            print_debug ".env found for ${service}"
        fi
    done
    
    echo ""
}

################################################################################
# Service Start Functions
################################################################################

start_service() {
    local service=$1
    local port=${SERVICES[$service]}
    local service_dir="${SCRIPT_DIR}/api/${service}"
    local log_file="${LOG_DIR}/${service}.log"
    
    print_info "Starting ${service} on port ${port}..."
    
    if [ ! -d "$service_dir" ]; then
        print_error "Service directory not found: $service_dir"
        return 1
    fi
    
    # Check if compiled code exists
    if [ ! -f "$service_dir/dist/${service}/src/index.js" ] && [ ! -f "$service_dir/dist/src/index.js" ]; then
        print_error "Compiled code not found for ${service}. Run 'npm run build' first"
        return 1
    fi
    
    # Start the service in background
    cd "$service_dir"
    
    # Set environment variables
    export NODE_ENV=production
    export PORT=$port
    export DB_HOST=$DB_HOST
    export DB_PORT=$DB_PORT
    export DB_NAME=$DB_NAME
    export DB_USER=$DB_USER
    export DB_PASSWORD=$DB_PASSWORD
    export IPFS_HOST=$IPFS_HOST
    export IPFS_PORT=$IPFS_PORT
    export CORS_ORIGIN="http://localhost:5173"
    export LOG_LEVEL="info"
    
    # Determine the correct path to index.js
    local index_path
    if [ -f "$service_dir/dist/${service}/src/index.js" ]; then
        index_path="dist/${service}/src/index.js"
    elif [ -f "$service_dir/dist/src/index.js" ]; then
        index_path="dist/src/index.js"
    else
        print_error "Cannot find index.js for ${service}"
        return 1
    fi
    
    # Start service with nohup
    nohup node "$index_path" > "$log_file" 2>&1 &
    local pid=$!
    
    # Store PID with service name
    echo "$service:$pid" >> "$PID_FILE"
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if process is still running
    if ! kill -0 $pid 2>/dev/null; then
        print_error "Failed to start ${service}"
        print_info "Check log: $log_file"
        tail -20 "$log_file"
        return 1
    fi
    
    print_success "Started ${service} (PID: $pid)"
    return 0
}

start_all_services() {
    print_header "Starting All API Services"
    
    local failed_services=()
    
    for service in "${!SERVICES[@]}"; do
        if ! start_service "$service"; then
            failed_services+=("$service")
        fi
    done
    
    # Wait for all services to be ready
    print_info "Waiting for services to be ready..."
    sleep 3
    
    # Check health of all services
    print_header "Checking Service Health"
    check_service_health
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        print_error "Failed to start: ${failed_services[*]}"
        return 1
    fi
    
    return 0
}

################################################################################
# Health Check Functions
################################################################################

check_service_health() {
    local all_healthy=true
    
    for service in "${!SERVICES[@]}"; do
        local port=${SERVICES[$service]}
        local url="http://localhost:${port}/health"
        
        if command -v curl &> /dev/null; then
            if curl -s "$url" > /dev/null 2>&1; then
                local response=$(curl -s "$url")
                local db_status=$(echo "$response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
                
                if [ "$db_status" = "connected" ]; then
                    print_success "${service} is healthy (DB: connected)"
                else
                    print_warning "${service} is running (DB: disconnected)"
                fi
            else
                print_error "${service} is not responding on port $port"
                all_healthy=false
            fi
        else
            print_warning "curl not found, skipping health check"
            break
        fi
    done
    
    return $([ "$all_healthy" = true ] && echo 0 || echo 1)
}

################################################################################
# Stop Functions
################################################################################

stop_all_services() {
    print_header "Stopping All Services"
    
    if [ ! -f "$PID_FILE" ]; then
        print_warning "No PID file found"
        return 0
    fi
    
    while IFS=: read -r service pid; do
        if [ -z "$service" ] || [ -z "$pid" ]; then
            continue
        fi
        
        if kill -0 $pid 2>/dev/null; then
            print_info "Stopping ${service} (PID: $pid)..."
            kill $pid 2>/dev/null || true
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 $pid 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                print_warning "Force killing ${service} (PID: $pid)"
                kill -9 $pid 2>/dev/null || true
            fi
            
            print_success "Stopped ${service}"
        fi
    done < "$PID_FILE"
    
    # Clear PID file
    > "$PID_FILE"
    print_success "All services stopped"
    echo ""
}

################################################################################
# Log Functions
################################################################################

show_logs() {
    print_header "Service Logs"
    
    if [ ! -d "$LOG_DIR" ]; then
        print_error "No logs directory found"
        return 1
    fi
    
    for log_file in "$LOG_DIR"/*.log; do
        if [ -f "$log_file" ]; then
            local service=$(basename "$log_file" .log)
            print_info "=== ${service} ==="
            tail -30 "$log_file"
            echo ""
        fi
    done
}

tail_logs() {
    print_header "Tailing All Logs (Press Ctrl+C to exit)"
    
    if [ ! -d "$LOG_DIR" ]; then
        print_error "No logs directory found"
        return 1
    fi
    
    if command -v tail &> /dev/null; then
        tail -f "$LOG_DIR"/*.log
    else
        print_error "tail command not found"
        return 1
    fi
}

################################################################################
# Status Functions
################################################################################

show_status() {
    print_header "Service Status"
    
    if [ ! -f "$PID_FILE" ]; then
        print_warning "No services running"
        return 0
    fi
    
    local running=0
    local stopped=0
    
    while IFS=: read -r service pid; do
        if [ -z "$service" ] || [ -z "$pid" ]; then
            continue
        fi
        
        local port=${SERVICES[$service]}
        
        if kill -0 $pid 2>/dev/null; then
            print_success "${service} (PID: $pid, Port: $port) - RUNNING"
            running=$((running + 1))
        else
            print_error "${service} (PID: $pid, Port: $port) - STOPPED"
            stopped=$((stopped + 1))
        fi
    done < "$PID_FILE"
    
    echo ""
    print_info "Running: $running, Stopped: $stopped"
    echo ""
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${BLUE}CBC API Services Startup Script${NC}

${BLUE}Usage:${NC}
    ./start-services.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Start all API services
    --help          Show this help message
    --check         Check prerequisites and Docker environment
    --status        Show service status
    --logs          Show recent logs
    --tail          Tail all logs in real-time
    --stop          Stop all services
    --restart       Restart all services
    --health        Check service health

${BLUE}Services:${NC}
    Commercial Bank API    → http://localhost:3001
    Custom Authorities API → http://localhost:3002
    ECTA API              → http://localhost:3003
    Exporter Portal API   → http://localhost:3004
    National Bank API     → http://localhost:3005
    ECX API               → http://localhost:3006
    Shipping Line API     → http://localhost:3007

${BLUE}Examples:${NC}
    # Start all services
    ./start-services.sh

    # Check if everything is ready
    ./start-services.sh --check

    # View service status
    ./start-services.sh --status

    # View logs
    ./start-services.sh --logs

    # Stop all services
    ./start-services.sh --stop

${BLUE}Environment Variables:${NC}
    NODE_ENV              Environment (default: production)
    DB_HOST               Database host (auto-detected from Docker)
    DB_PORT               Database port (default: 5432)
    DB_NAME               Database name (default: coffee_export_db)
    DB_USER               Database user (default: postgres)
    DB_PASSWORD           Database password (default: postgres)
    IPFS_HOST             IPFS host (auto-detected from Docker)
    IPFS_PORT             IPFS port (default: 5001)

${BLUE}Logs:${NC}
    All logs are stored in: ${LOG_DIR}

${BLUE}PIDs:${NC}
    Service PIDs are stored in: ${PID_FILE}

${BLUE}Docker Integration:${NC}
    This script automatically detects Docker containers for:
    - PostgreSQL (postgres)
    - IPFS (ipfs)
    
    If containers are not found, it falls back to localhost.

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
            detect_docker_environment
            check_prerequisites || exit 1
            check_all_ports || exit 1
            exit 0
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
            stop_all_services
            exit 0
            ;;
        --restart)
            stop_all_services
            sleep 2
            detect_docker_environment
            setup_environment
            check_prerequisites || exit 1
            check_all_ports || exit 1
            start_all_services
            exit $?
            ;;
        --health)
            check_service_health
            exit $?
            ;;
        start)
            print_header "CBC API Services Startup"
            print_info "Starting all API services with comprehensive management..."
            echo ""
            
            detect_docker_environment
            echo ""
            
            check_prerequisites || exit 1
            echo ""
            
            check_all_ports || exit 1
            echo ""
            
            setup_environment
            
            start_all_services
            local result=$?
            echo ""
            
            if [ $result -eq 0 ]; then
                print_header "All Services Started Successfully"
                print_info "Services are running on the following ports:"
                for service in "${!SERVICES[@]}"; do
                    local port=${SERVICES[$service]}
                    echo "  ${service}: http://localhost:${port}"
                done
                echo ""
                print_info "Database: $DB_HOST:$DB_PORT"
                print_info "IPFS: $IPFS_HOST:$IPFS_PORT"
                echo ""
                print_info "View logs: ./start-services.sh --logs"
                print_info "Check status: ./start-services.sh --status"
                print_info "Stop services: ./start-services.sh --stop"
                echo ""
                print_success "Ready to accept requests!"
            else
                print_error "Some services failed to start"
                print_info "Check logs: ./start-services.sh --logs"
                exit 1
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
