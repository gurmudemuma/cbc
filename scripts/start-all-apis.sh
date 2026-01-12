#!/bin/bash

################################################################################
# Start All APIs Script
# 
# This script starts all 7 API services for the CBC (Coffee Export Blockchain)
# project in parallel with proper logging and error handling.
#
# Usage:
#   ./start-all-apis.sh              # Start all services
#   ./start-all-apis.sh --help       # Show help
#   ./start-all-apis.sh --check      # Check prerequisites
#   ./start-all-apis.sh --logs       # Show logs
#   ./start-all-apis.sh --stop       # Stop all services
#
################################################################################

set -e

# Function to pause on exit
pause_on_exit() {
    echo ""
    echo "Press Enter to exit..."
    read _
}
trap pause_on_exit EXIT


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
PID_FILE="${SCRIPT_DIR}/.api-pids"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# API Services Configuration
declare -A SERVICES=(
    [commercial-bank]="3001"
    [custom-authorities]="3002"
    [ecta]="3003"
    [exporter-portal]="3004"
    [national-bank]="3005"
    [ecx]="3006"
    [shipping-line]="3007"
    [esw]="3008"
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
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found (optional for local testing)"
    else
        print_success "PostgreSQL client $(psql --version)"
    fi
    
    # Check if api directory exists
    if [ ! -d "${SCRIPT_DIR}/api" ]; then
        print_error "API directory not found at ${SCRIPT_DIR}/api"
        all_ok=false
    else
        print_success "API directory found"
    fi
    
    # Check if node_modules exists
    if [ ! -d "${SCRIPT_DIR}/api/node_modules" ]; then
        print_warning "node_modules not found. Run 'npm install' first"
        all_ok=false
    else
        print_success "node_modules found"
    fi
    
    # Check database connectivity
    if command -v psql &> /dev/null; then
        # Try to get Docker container IP first
        local db_host="localhost"
        if command -v docker &> /dev/null && docker ps --filter "name=postgres" --quiet &> /dev/null; then
            local container_ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' postgres 2>/dev/null)
            if [ -n "$container_ip" ]; then
                db_host="$container_ip"
            fi
        fi
        
        if PGPASSWORD="postgres" psql -h "$db_host" -U postgres -d coffee_export_db -c "SELECT 1" &> /dev/null; then
            print_success "PostgreSQL database is accessible"
        else
            print_warning "PostgreSQL database is not accessible (will start in degraded mode)"
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
    
    # Try lsof first with timeout
    if command -v lsof &> /dev/null; then
        if timeout 2 lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_error "Port $port (${service}) is already in use"
            return 1
        fi
    # Fallback to netstat if lsof not available or times out
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_error "Port $port (${service}) is already in use"
            return 1
        fi
    else
        # If neither lsof nor netstat available, skip check
        print_warning "Cannot check port $port (lsof/netstat not available)"
        return 0
    fi
    return 0
}

check_all_ports() {
    print_header "Checking Port Availability"
    
    local all_ok=true
    local ports_in_use=()
    
    for service in "${!SERVICES[@]}"; do
        local port=${SERVICES[$service]}
        if ! check_port_available $port $service; then
            all_ok=false
            ports_in_use+=("$port")
        else
            print_success "Port $port available for ${service}"
        fi
    done
    
    if [ "$all_ok" = false ]; then
        print_warning "Some ports are already in use: ${ports_in_use[*]}"
        print_info "Attempting to clean up existing processes..."
        cleanup_ports "${ports_in_use[@]}"
        return 0
    fi
    
    return 0
}

cleanup_ports() {
    local ports=("$@")
    
    for port in "${ports[@]}"; do
        if command -v lsof &> /dev/null; then
            local pids=$(lsof -ti :$port 2>/dev/null || true)
            if [ -n "$pids" ]; then
                print_info "Killing process on port $port..."
                echo "$pids" | xargs kill -9 2>/dev/null || true
                sleep 1
                print_success "Cleaned up port $port"
            fi
        fi
    done
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
    
    # Check and load .env files
    for service in "${!SERVICES[@]}"; do
        local env_file="${SCRIPT_DIR}/api/${service}/.env"
        if [ ! -f "$env_file" ]; then
            print_warning "Missing .env file for ${service}"
            print_info "Creating .env from template..."
            if [ -f "${env_file}.template" ]; then
                cp "${env_file}.template" "$env_file"
                print_success "Created .env for ${service}"
            fi
        else
            print_success ".env found for ${service}"
        fi
    done
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
    
    # Start the service in background
    cd "$service_dir"
    
    # Set environment variables
    export PORT=$port
    export NODE_ENV=${NODE_ENV:-development}
    
    # Start service and capture PID
    npm run dev > "$log_file" 2>&1 &
    local pid=$!
    
    # Store PID
    echo "$service:$pid" >> "$PID_FILE"
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if process is still running
    if ! kill -0 $pid 2>/dev/null; then
        print_error "Failed to start ${service}"
        print_info "Check log: $log_file"
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
        
        if curl -s "$url" > /dev/null 2>&1; then
            local response=$(curl -s "$url")
            local db_status=$(echo "$response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
            
            if [ "$db_status" = "connected" ]; then
                print_success "${service} is healthy (DB: connected)"
            else
                print_warning "${service} is running (DB: disconnected)"
            fi
        else
            print_error "${service} is not responding"
            all_healthy=false
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
                kill -9 $pid 2>/dev/null || true
            fi
            
            print_success "Stopped ${service}"
        fi
    done < "$PID_FILE"
    
    # Clear PID file
    > "$PID_FILE"
    print_success "All services stopped"
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
            tail -20 "$log_file"
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
    
    tail -f "$LOG_DIR"/*.log
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
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${BLUE}CBC API Services Startup Script${NC}

${BLUE}Usage:${NC}
    ./start-all-apis.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Start all API services
    --help          Show this help message
    --check         Check prerequisites
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
    ESW API               → http://localhost:3008

${BLUE}Examples:${NC}
    # Start all services
    ./start-all-apis.sh

    # Check if everything is ready
    ./start-all-apis.sh --check

    # View service status
    ./start-all-apis.sh --status

    # View logs
    ./start-all-apis.sh --logs

    # Stop all services
    ./start-all-apis.sh --stop

${BLUE}Environment Variables:${NC}
    NODE_ENV              Development environment (default: development)
    DATABASE_URL          PostgreSQL connection string
    DB_HOST               Database host (default: localhost)
    DB_PORT               Database port (default: 5432)
    DB_NAME               Database name (default: coffee_export_db)
    DB_USER               Database user (default: postgres)
    DB_PASSWORD           Database password (default: postgres)

${BLUE}Logs:${NC}
    All logs are stored in: ${LOG_DIR}

${BLUE}PIDs:${NC}
    Service PIDs are stored in: ${PID_FILE}

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
            check_prerequisites && check_all_ports
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
            stop_all_services
            exit 0
            ;;
        --restart)
            stop_all_services
            sleep 2
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
            print_info "Starting all API services..."
            echo ""
            
            check_prerequisites || exit 1
            echo ""
            
            check_all_ports || exit 1
            echo ""
            
            setup_environment
            echo ""
            
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
                print_info "View logs: ./start-all-apis.sh --logs"
                print_info "Check status: ./start-all-apis.sh --status"
                print_info "Stop services: ./start-all-apis.sh --stop"
                echo ""
                print_success "Ready to accept requests!"
            else
                print_error "Some services failed to start"
                print_info "Check logs: ./start-all-apis.sh --logs"
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
