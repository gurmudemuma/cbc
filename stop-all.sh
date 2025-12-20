#!/bin/bash

################################################################################
# Stop All Services Script
# 
# This script stops all running services (frontend, APIs, infrastructure)
# and performs cleanup.
#
# Usage:
#   ./stop-all.sh              # Stop all services
#   ./stop-all.sh --help       # Show help
#   ./stop-all.sh --clean      # Stop and clean up
#   ./stop-all.sh --force      # Force stop all services
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
APIS_SCRIPT="${SCRIPT_DIR}/start-all-apis.sh"
FRONTEND_SCRIPT="${SCRIPT_DIR}/start-frontend.sh"

# PID files
FRONTEND_PID_FILE="${SCRIPT_DIR}/.frontend-pid"
APIS_PID_FILE="${SCRIPT_DIR}/.api-pids"

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
# Stop Functions
################################################################################

stop_frontend() {
    print_section "Stopping Frontend"
    
    if [ ! -f "$FRONTEND_PID_FILE" ]; then
        print_info "Frontend is not running"
        return 0
    fi
    
    local pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
    
    if [ -z "$pid" ]; then
        print_info "No frontend PID found"
        return 0
    fi
    
    if kill -0 $pid 2>/dev/null; then
        print_step "Stopping frontend (PID: $pid)..."
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
        print_info "Frontend process not running"
    fi
    
    # Clean up PID file
    rm -f "$FRONTEND_PID_FILE"
    
    echo ""
}

stop_apis() {
    print_section "Stopping API Services"
    
    if [ ! -f "$APIS_PID_FILE" ]; then
        print_info "No API services running"
        return 0
    fi
    
    local stopped_count=0
    
    while IFS=: read -r service pid; do
        if [ -z "$service" ] || [ -z "$pid" ]; then
            continue
        fi
        
        if kill -0 $pid 2>/dev/null; then
            print_step "Stopping ${service} (PID: $pid)..."
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
            stopped_count=$((stopped_count + 1))
        fi
    done < "$APIS_PID_FILE"
    
    # Clean up PID file
    rm -f "$APIS_PID_FILE"
    
    if [ $stopped_count -gt 0 ]; then
        print_success "Stopped $stopped_count API services"
    else
        print_info "No API services were running"
    fi
    
    echo ""
}

stop_infrastructure() {
    print_section "Stopping Infrastructure Services"
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose not found, skipping infrastructure stop"
        return 0
    fi
    
    local compose_file="${SCRIPT_DIR}/docker-compose.postgres.yml"
    
    if [ ! -f "$compose_file" ]; then
        print_warning "Docker Compose file not found: $compose_file"
        return 0
    fi
    
    print_step "Stopping Docker containers..."
    
    if docker-compose -f "$compose_file" down 2>/dev/null; then
        print_success "Infrastructure services stopped"
    else
        print_warning "Some infrastructure services may not have stopped cleanly"
    fi
    
    echo ""
}

################################################################################
# Cleanup Functions
################################################################################

cleanup_logs() {
    print_section "Cleaning Up Logs"
    
    local logs_dir="${SCRIPT_DIR}/logs"
    
    if [ ! -d "$logs_dir" ]; then
        print_info "No logs directory found"
        return 0
    fi
    
    local log_count=$(find "$logs_dir" -name "*.log" 2>/dev/null | wc -l)
    
    if [ $log_count -eq 0 ]; then
        print_info "No log files found"
        return 0
    fi
    
    print_step "Archiving $log_count log files..."
    
    # Create archive directory
    local archive_dir="${logs_dir}/archive"
    mkdir -p "$archive_dir"
    
    # Archive old logs
    local archive_file="${archive_dir}/logs_${TIMESTAMP}.tar.gz"
    if tar -czf "$archive_file" -C "$logs_dir" --exclude=archive *.log 2>/dev/null; then
        print_success "Logs archived to: $archive_file"
        
        # Remove original logs
        rm -f "$logs_dir"/*.log
        print_success "Original log files removed"
    else
        print_warning "Failed to archive logs"
    fi
    
    echo ""
}

cleanup_pids() {
    print_section "Cleaning Up PID Files"
    
    local pids_removed=0
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        rm -f "$FRONTEND_PID_FILE"
        pids_removed=$((pids_removed + 1))
    fi
    
    if [ -f "$APIS_PID_FILE" ]; then
        rm -f "$APIS_PID_FILE"
        pids_removed=$((pids_removed + 1))
    fi
    
    if [ $pids_removed -gt 0 ]; then
        print_success "Removed $pids_removed PID files"
    else
        print_info "No PID files to clean up"
    fi
    
    echo ""
}

cleanup_docker() {
    print_section "Cleaning Up Docker Resources"
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found, skipping cleanup"
        return 0
    fi
    
    # Remove stopped containers
    print_step "Removing stopped containers..."
    local removed=$(docker container prune -f 2>/dev/null | grep -o "Deleted Containers: [0-9]*" | grep -o "[0-9]*" || echo "0")
    if [ "$removed" != "0" ]; then
        print_success "Removed $removed stopped containers"
    else
        print_info "No stopped containers to remove"
    fi
    
    # Remove unused networks
    print_step "Removing unused networks..."
    local networks=$(docker network prune -f 2>/dev/null | grep -o "Deleted Networks: [0-9]*" | grep -o "[0-9]*" || echo "0")
    if [ "$networks" != "0" ]; then
        print_success "Removed $networks unused networks"
    else
        print_info "No unused networks to remove"
    fi
    
    echo ""
}

################################################################################
# Force Stop Functions
################################################################################

force_stop_all() {
    print_header "Force Stopping All Services"
    
    echo ""
    print_section "Force Stopping Node.js Processes"
    
    if command -v pkill &> /dev/null; then
        print_step "Killing all Node.js processes..."
        pkill -f "node" || true
        pkill -f "npm" || true
        print_success "Node.js processes killed"
    else
        print_warning "pkill not found, cannot force stop Node.js processes"
    fi
    
    echo ""
    print_section "Force Stopping Docker Containers"
    
    if command -v docker &> /dev/null; then
        print_step "Stopping all Docker containers..."
        docker stop $(docker ps -q) 2>/dev/null || true
        print_success "Docker containers stopped"
    else
        print_warning "Docker not found"
    fi
    
    echo ""
    print_section "Cleaning Up"
    
    cleanup_pids
    
    echo ""
    print_success "Force stop complete"
    echo ""
}

################################################################################
# Help Function
################################################################################

show_help() {
    cat << EOF
${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}
${MAGENTA}║${NC} Coffee Export Consortium - Stop All Services Script
${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}

${BLUE}Usage:${NC}
    ./stop-all.sh [COMMAND]

${BLUE}Commands:${NC}
    (no args)       Stop all services gracefully
    --help          Show this help message
    --clean         Stop all services and clean up logs/PIDs
    --force         Force stop all services immediately
    --logs          Clean up and archive logs

${BLUE}Examples:${NC}
    # Stop all services gracefully
    ./stop-all.sh

    # Stop and clean up
    ./stop-all.sh --clean

    # Force stop everything
    ./stop-all.sh --force

    # Clean up logs only
    ./stop-all.sh --logs

${BLUE}What Gets Stopped:${NC}
    1. Frontend (React/Vite)
    2. API Services (7 services)
    3. Infrastructure (PostgreSQL, Redis, IPFS)

${BLUE}Cleanup Options:${NC}
    --clean         Stops services and cleans up:
                    - Archives log files
                    - Removes PID files
                    - Removes stopped Docker containers
                    - Removes unused Docker networks

    --force         Immediately kills:
                    - All Node.js processes
                    - All Docker containers
                    - Cleans up PID files

${BLUE}Graceful vs Force Stop:${NC}
    Graceful (default):
    - Sends SIGTERM to processes
    - Waits up to 10 seconds for shutdown
    - Force kills if still running
    - Recommended for normal shutdown

    Force:
    - Immediately kills all processes
    - Stops all Docker containers
    - Use only if graceful stop fails

${BLUE}Logs:${NC}
    Logs are archived to: ./logs/archive/logs_TIMESTAMP.tar.gz

${BLUE}Troubleshooting:${NC}
    # If services won't stop
    ./stop-all.sh --force

    # Check what's still running
    ps aux | grep node
    docker ps

    # Manual cleanup
    pkill -f node
    docker stop \$(docker ps -q)

EOF
}

################################################################################
# Main Script
################################################################################

main() {
    local command=${1:-stop}
    
    case "$command" in
        --help|-h)
            show_help
            exit 0
            ;;
        --clean)
            print_header "Stopping All Services and Cleaning Up"
            echo ""
            
            stop_frontend
            stop_apis
            stop_infrastructure
            cleanup_logs
            cleanup_pids
            cleanup_docker
            
            print_header "Cleanup Complete"
            print_success "All services stopped and cleaned up"
            echo ""
            print_info "To start again: ./start-all.sh"
            echo ""
            exit 0
            ;;
        --force)
            force_stop_all
            exit 0
            ;;
        --logs)
            cleanup_logs
            exit 0
            ;;
        stop)
            print_header "Stopping All Services"
            echo ""
            
            stop_frontend
            stop_apis
            stop_infrastructure
            
            print_header "Shutdown Complete"
            print_success "All services stopped"
            echo ""
            print_info "To start again: ./start-all.sh"
            print_info "To clean up logs: ./stop-all.sh --clean"
            echo ""
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
