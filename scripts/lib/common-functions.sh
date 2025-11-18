#!/bin/bash

# ========================================
# Common Functions Library
# Shared utilities for all scripts
# ========================================

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Print a formatted header
print_header() {
    local message="$1"
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}${message}${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Print info message
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if a port is in use
check_port() {
    local PORT=$1
    local SERVICE=$2
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $PORT ($SERVICE) is in use"
        return 1
    else
        print_success "Port $PORT ($SERVICE) is available"
        return 0
    fi
}

# Kill process on a specific port
kill_port() {
    local PORT=$1
    local SERVICE=$2
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_info "Killing process on port $PORT ($SERVICE)..."
        kill $(lsof -t -i:$PORT) 2>/dev/null || true
        sleep 2
        print_success "Process on port $PORT killed"
        return 0
    else
        print_info "No process running on port $PORT"
        return 1
    fi
}

# Check service health endpoint
check_health() {
    local service_name=$1
    local port=$2
    local max_retries=${3:-3}
    local retry_delay=${4:-2}
    
    for i in $(seq 1 $max_retries); do
        if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
            print_success "$service_name (port $port) is healthy"
            return 0
        else
            if [ $i -lt $max_retries ]; then
                print_warning "$service_name (port $port) not responding, retrying... ($i/$max_retries)"
                sleep $retry_delay
            fi
        fi
    done
    
    print_error "$service_name (port $port) is not responding"
    return 1
}

# Stop an API service
stop_service() {
    local service_name=$1
    local port=$2
    local pid_file=${3:-"logs/${service_name}.pid"}
    
    print_info "Stopping $service_name..."
    
    # Try to kill by PID file first
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            rm -f "$pid_file"
            print_success "$service_name stopped (PID: $pid)"
        else
            rm -f "$pid_file"
        fi
    fi
    
    # Kill by port as fallback
    kill_port "$port" "$service_name"
}

# Start an API service
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    local log_file=${4:-"logs/${service_name}.log"}
    local pid_file=${5:-"logs/${service_name}.pid"}
    
    print_info "Starting $service_name on port $port..."
    
    # Kill existing process if running
    kill_port "$port" "$service_name"
    
    # Create logs directory if it doesn't exist
    mkdir -p "$(dirname "$log_file")"
    mkdir -p "$(dirname "$pid_file")"
    
    # Start the service in background
    cd "$service_dir" && npm run dev > "../../$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    
    print_success "$service_name started (PID: $pid)"
    print_info "Log: $log_file"
}

# Run a test and check result
run_test() {
    local test_name="$1"
    local expected="$2"
    local response="$3"
    
    if echo "$response" | grep -qi "$expected"; then
        print_success "Test passed: $test_name"
        return 0
    else
        print_error "Test failed: $test_name"
        echo "Expected: $expected"
        echo "Got: $response"
        return 1
    fi
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        print_info "Please start Docker and try again"
        return 1
    fi
    print_success "Docker is running"
    return 0
}

# Check if blockchain network is running
check_blockchain_network() {
    if ! docker ps | grep -q "peer0.commercialbank"; then
        print_error "Blockchain network is not running"
        print_info "Start the network with: cd network && ./network.sh up"
        return 1
    fi
    print_success "Blockchain network is running"
    return 0
}

# Check if a file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_success "$description exists: $file"
        return 0
    else
        print_error "$description not found: $file"
        return 1
    fi
}

# Check if a directory exists
check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        print_success "$description exists: $dir"
        return 0
    else
        print_error "$description not found: $dir"
        return 1
    fi
}

# Wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local timeout=${3:-60}
    local interval=${4:-2}
    
    print_info "Waiting for $service_name to be ready..."
    
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
            print_success "$service_name is ready"
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    print_error "$service_name failed to start within ${timeout}s"
    return 1
}

# Get project root directory
get_project_root() {
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
}

# Confirm action with user
confirm_action() {
    local message="$1"
    local default=${2:-"n"}
    
    if [ "$default" = "y" ]; then
        local prompt="[Y/n]"
    else
        local prompt="[y/N]"
    fi
    
    echo -ne "${YELLOW}${message} ${prompt}: ${NC}"
    read -r response
    
    response=${response:-$default}
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Export all functions
export -f print_header
export -f print_success
export -f print_error
export -f print_warning
export -f print_info
export -f check_port
export -f kill_port
export -f check_health
export -f stop_service
export -f start_service
export -f run_test
export -f check_docker
export -f check_blockchain_network
export -f check_file
export -f check_directory
export -f wait_for_service
export -f get_project_root
export -f confirm_action
