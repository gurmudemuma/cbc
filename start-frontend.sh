#!/bin/bash

################################################################################
# Start Frontend Script
# 
# This script starts the React/Vite frontend development server
# with proper environment configuration and health checks.
#
# Usage:
#   ./start-frontend.sh              # Start frontend
#   ./start-frontend.sh --help       # Show help
#   ./start-frontend.sh --check      # Check prerequisites
#   ./start-frontend.sh --build      # Build for production
#   ./start-frontend.sh --stop       # Stop frontend
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
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
LOG_DIR="${SCRIPT_DIR}/logs"
PID_FILE="${SCRIPT_DIR}/.frontend-pid"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
API_PORT="${API_PORT:-3001}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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
    
    # Check frontend directory
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        all_ok=false
    else
        print_success "Frontend directory found"
    fi
    
    # Check package.json
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        print_error "package.json not found in frontend directory"
        all_ok=false
    else
        print_success "package.json found"
    fi
    
    # Check node_modules
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_warning "node_modules not found. Run 'npm install' in frontend directory"
        all_ok=false
    else
        print_success "node_modules found"
    fi
    
    # Check vite config
    if [ ! -f "$FRONTEND_DIR/vite.config.js" ]; then
        print_warning "vite.config.js not found"
    else
        print_success "vite.config.js found"
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
    
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_error "Port $port is already in use"
            return 1
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_error "Port $port is already in use"
            return 1
        fi
    else
        print_warning "Cannot check port availability (lsof/netstat not found)"
        return 0
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
    
    # Check .env file
    local env_file="$FRONTEND_DIR/.env"
    if [ ! -f "$env_file" ]; then
        print_warning "Missing .env file for frontend"
        if [ -f "$FRONTEND_DIR/.env.template" ]; then
            cp "$FRONTEND_DIR/.env.template" "$env_file"
            print_success "Created .env from template"
        else
            print_info "Creating .env with default values..."
            cat > "$env_file" << EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
VITE_LOG_LEVEL=info
EOF
            print_success "Created .env with defaults"
        fi
    else
        print_success ".env file found"
    fi
    
    echo ""
}

################################################################################
# Frontend Start/Stop Functions
################################################################################

start_frontend() {
    print_header "Starting Frontend"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    print_info "Starting frontend on port $FRONTEND_PORT..."
    
    cd "$FRONTEND_DIR"
    
    # Set environment variables
    export VITE_PORT=$FRONTEND_PORT
    export NODE_ENV=development
    
    local log_file="${LOG_DIR}/frontend.log"
    
    # Start frontend
    npm run dev > "$log_file" 2>&1 &
    local pid=$!
    
    # Store PID
    echo "$pid" > "$PID_FILE"
    
    # Wait a moment for frontend to start
    sleep 3
    
    # Check if process is still running
    if ! kill -0 $pid 2>/dev/null; then
        print_error "Failed to start frontend"
        print_info "Check log: $log_file"
        tail -20 "$log_file"
        return 1
    fi
    
    print_success "Frontend started (PID: $pid)"
    return 0
}

stop_frontend() {
    print_header "Stopping Frontend"
    
    if [ ! -f "$PID_FILE" ]; then
        print_warning "No PID file found"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    
    if [ -z "$pid" ]; then
        print_warning "No PID found"
        return 0
    fi
    
    if kill -0 $pid 2>/dev/null; then
        print_info "Stopping frontend (PID: $pid)..."
        kill $pid 2>/dev/null || true
        
        # Wait for graceful shutdown
        local count=0
        while kill -0 $pid 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            print_warning "Force killing frontend (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
        
        print_success "Frontend stopped"
    else
        print_warning "Frontend process not running"
    fi
    
    # Clear PID file
    rm -f "$PID_FILE"
    
    echo ""
}

################################################################################
# Health Check Functions
################################################################################

check_frontend_health() {
    print_header "Checking Frontend Health"
    
    print_info "Waiting for frontend to be ready..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if command -v curl &> /dev/null; then
            if curl -s "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
                print_success "Frontend is responding on port $FRONTEND_PORT"
                return 0
            fi
        else
            # If curl is not available, just wait
            if [ $attempt -gt 5 ]; then
                print_success "Frontend should be ready (curl not available for verification)"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -lt $max_attempts ]; then
            sleep 1
        fi
    done
    
    print_warning "Frontend did not respond within timeout"
    return 1
}

################################################################################
# Build Functions
################################################################################

build_frontend() {
    print_header "Building Frontend"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    print_info "Building frontend for production..."
    
    cd "$FRONTEND_DIR"
    
    if npm run build; then
        print_success "Frontend build completed"
        
        # Check if dist directory was created
        if [ -d "$FRONTEND_DIR/dist" ]; then
            local dist_size=$(du -sh "$FRONTEND_DIR/dist" | cut -f1)
            print_success "Build output size: $dist_size"
        fi
        
        return 0
    else
        print_error "Frontend build failed"
        return 1
    fi
}

################################################################################
# Log Functions
################################################################################

show_logs() {
    print_header "Frontend Logs"
    
    local log_file="${LOG_DIR}/frontend.log"
    
    if [ ! -f "$log_file" ]; then
        print_warning "No logs found"
        return 0
    fi
    
    tail -50 "$log_file"
}

tail_logs() {
    print_header "Tailing Frontend Logs (Press Ctrl+C to exit)"
    
    local log_file="${LOG_DIR}/frontend.log"
    
    if [ ! -f "$log_file" ]; then
        print_warning "No logs found"
        return 0
    fi
    
    tail -f "$log_file"
}

################################################################################
# Status Functions
################################################################################

show_status() {
    print_header "Frontend Status"
    
    if [ ! -f "$PID_FILE" ]; then
        print_warning "Frontend is not running"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    
    if [ -z "$pid" ]; then
        print_warning "No PID found"
        return 0
    fi
    
    if kill -0 $pid 2>/dev/null; then
        print_success "Frontend is running (PID: $pid, Port: $FRONTEND_PORT)"
        
        # Show process info
        if command -v ps &> /dev/null; then
            ps -p $pid -o pid,ppid,cmd,etime
        fi
    else
        print_error "Frontend is not running (PID: $pid)"
    fi
    
    echo ""
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${BLUE}Frontend Startup Script${NC}

${BLUE}Usage:${NC}
    ./start-frontend.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Start frontend development server
    --help          Show this help message
    --check         Check prerequisites
    --status        Show frontend status
    --logs          Show recent logs
    --tail          Tail logs in real-time
    --build         Build for production
    --stop          Stop frontend
    --restart       Restart frontend

${BLUE}Examples:${NC}
    # Start frontend
    ./start-frontend.sh

    # Check if everything is ready
    ./start-frontend.sh --check

    # View frontend status
    ./start-frontend.sh --status

    # View logs
    ./start-frontend.sh --logs

    # Build for production
    ./start-frontend.sh --build

    # Stop frontend
    ./start-frontend.sh --stop

${BLUE}Frontend Configuration:${NC}
    Port: ${FRONTEND_PORT}
    Directory: ${FRONTEND_DIR}
    API URL: http://localhost:${API_PORT}

${BLUE}Environment Variables:${NC}
    FRONTEND_PORT   Frontend port (default: 5173)
    API_PORT        API port (default: 3001)
    NODE_ENV        Environment (default: development)

${BLUE}Logs:${NC}
    ${LOG_DIR}/frontend.log

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
        --build)
            check_prerequisites || exit 1
            echo ""
            build_frontend
            exit $?
            ;;
        --stop)
            stop_frontend
            exit 0
            ;;
        --restart)
            stop_frontend
            sleep 2
            check_prerequisites || exit 1
            echo ""
            setup_environment
            check_port_available $FRONTEND_PORT || exit 1
            echo ""
            start_frontend || exit 1
            echo ""
            check_frontend_health
            exit $?
            ;;
        start)
            print_header "Frontend Startup"
            print_info "Starting React/Vite frontend..."
            echo ""
            
            check_prerequisites || exit 1
            echo ""
            
            check_port_available $FRONTEND_PORT || exit 1
            echo ""
            
            setup_environment
            
            start_frontend || exit 1
            echo ""
            
            check_frontend_health
            local result=$?
            echo ""
            
            if [ $result -eq 0 ]; then
                print_header "Frontend Ready"
                print_success "Frontend is running and ready"
                echo ""
                print_info "Access frontend at: http://localhost:${FRONTEND_PORT}"
                print_info "API URL: http://localhost:${API_PORT}"
                echo ""
                print_info "View logs: ./start-frontend.sh --logs"
                print_info "Check status: ./start-frontend.sh --status"
                print_info "Stop frontend: ./start-frontend.sh --stop"
                echo ""
            else
                print_warning "Frontend may not be fully ready"
                print_info "Check logs: ./start-frontend.sh --logs"
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
