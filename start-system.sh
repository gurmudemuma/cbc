#!/bin/bash

# Coffee Blockchain Consortium - Complete System Startup
# This script performs a complete system startup from scratch including:
# - Prerequisites validation
# - Environment cleaning
# - Fabric binaries installation (if needed)
# - Environment setup
# - Configuration validation
# - Security validation
# - Network setup
# - Channel creation
# - Chaincode deployment
# - Admin enrollment
# - API and Frontend startup
# - IPFS daemon startup
# - System verification

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse command line arguments
CLEAN_START=false
SKIP_DEPS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_START=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --clean       Perform a clean start (remove all existing data)"
            echo "  --skip-deps   Skip dependency installation"
            echo "  -h, --help    Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║     Coffee Blockchain Consortium - Complete Startup        ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$CLEAN_START" = true ]; then
    echo -e "${MAGENTA}🧹 Clean start mode enabled${NC}"
fi
echo ""

# Clean up previous data and processes
echo "🧹 Performing a clean start by removing old data..."
if [ -f "$(dirname "$0")/scripts/clean.sh" ]; then
    bash "$(dirname "$0")/scripts/clean.sh"
else
    echo "⚠️ Warning: clean.sh script not found. Skipping cleanup."
fi
echo "✅ System cleaned."
echo ""

# Platform check
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${YELLOW}⚠️ This script is optimized for Linux. Some commands may not work on $OSTYPE.${NC}"
    echo -e "${YELLOW}Proceeding with caution...${NC}"
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        echo -e "${YELLOW}Please start Docker and try again${NC}"
        exit 1
    fi
}

# Function to check if network is running
check_network() {
    if docker ps | grep -q "peer0.exporterbank"; then
        return 0
    else
        return 1
    fi
}

# Function to stop running services
stop_services() {
    echo -e "${YELLOW}Stopping running services...${NC}"
    
    # Stop tmux sessions if they exist
    if command -v tmux &> /dev/null; then
        tmux kill-session -t cbc-apis 2>/dev/null || true
        tmux kill-session -t cbc-frontend 2>/dev/null || true
    fi
    
    # Stop specific node processes
    pkill -f "npm run dev.*exporter-bank" 2>/dev/null || true
    pkill -f "npm run dev.*national-bank" 2>/dev/null || true
    pkill -f "npm run dev.*ncat" 2>/dev/null || true
    pkill -f "npm run dev.*shipping-line" 2>/dev/null || true
    pkill -f "npm run dev.*frontend" 2>/dev/null || true
    pkill -f "ipfs daemon" 2>/dev/null || true
    
    sleep 2
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Step 0: Clean environment if requested
if [ "$CLEAN_START" = true ]; then
    echo -e "${BLUE}[0/16] Cleaning Environment...${NC}"
    
    # Stop services first
    stop_services
    
    # Run clean script
    echo -e "${YELLOW}Removing all Docker containers and generated artifacts...${NC}"
    cd "$PROJECT_ROOT/network"
    ./network.sh down 2>/dev/null || true
    cd "$PROJECT_ROOT"
    
    # Remove generated crypto material
    echo -e "${YELLOW}Removing crypto material...${NC}"
    rm -rf network/organizations/peerOrganizations 2>/dev/null || true
    rm -rf network/organizations/ordererOrganizations 2>/dev/null || true
    rm -rf network/organizations/fabric-ca 2>/dev/null || true
    
    # Remove channel artifacts
    echo -e "${YELLOW}Removing channel artifacts...${NC}"
    rm -rf network/channel-artifacts 2>/dev/null || true
    rm -rf network/system-genesis-block 2>/dev/null || true
    
    # Remove chaincode packages
    echo -e "${YELLOW}Removing chaincode packages...${NC}"
    rm -f network/*.tar.gz 2>/dev/null || true
    rm -f network/log.txt 2>/dev/null || true
    
    # Remove API wallets
    echo -e "${YELLOW}Removing API wallets...${NC}"
    rm -rf api/exporter-bank/wallet/* 2>/dev/null || true
    rm -rf api/national-bank/wallet/* 2>/dev/null || true
    rm -rf api/ncat/wallet/* 2>/dev/null || true
    rm -rf api/shipping-line/wallet/* 2>/dev/null || true
    
    # Clean Docker (specific to project volumes if possible, but prune for simplicity)
    echo -e "${YELLOW}Cleaning Docker volumes and networks...${NC}"
    docker volume prune -f 2>/dev/null || true
    docker network prune -f 2>/dev/null || true
    
    # Reset IPFS repo
    if command -v ipfs &> /dev/null; then
        echo -e "${YELLOW}Resetting IPFS repository...${NC}"
        rm -rf ~/.ipfs 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Environment cleaned${NC}"
    echo ""
fi

# Step 1: Check Prerequisites
echo -e "${BLUE}[1/16] Checking Prerequisites...${NC}"
check_docker
echo -e "${GREEN}✅ Docker is running${NC}"

# Check for required tools
MISSING_TOOLS=()

if ! command -v node &> /dev/null; then
    MISSING_TOOLS+=("Node.js")
fi

if ! command -v npm &> /dev/null; then
    MISSING_TOOLS+=("npm")
fi

if ! command -v go &> /dev/null; then
    MISSING_TOOLS+=("Go")
fi

if ! command -v docker-compose &> /dev/null; then
    MISSING_TOOLS+=("docker-compose")
fi

# IPFS is optional - only needed for file storage features
if ! command -v ipfs &> /dev/null; then
    echo -e "${YELLOW}⚠️ IPFS not found - file storage features will be disabled${NC}"
fi

# lsof is not available on Windows/MINGW - skip this check
if [[ "$OSTYPE" == "linux-gnu"* ]] && ! command -v lsof &> /dev/null; then
    MISSING_TOOLS+=("lsof")
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required tools: ${MISSING_TOOLS[*]}${NC}"
    echo -e "${YELLOW}Please install missing tools and try again${NC}"
    exit 1
fi

# Optional tools
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}⚠️ tmux not found, will use nohup for background processes${NC}"
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 2: Check and Install Fabric Binaries (if needed)
echo -e "${BLUE}[2/16] Checking Fabric Binaries...${NC}"
if ! command -v peer &> /dev/null || ! command -v orderer &> /dev/null; then
    echo -e "${YELLOW}Fabric binaries not found. Installing...${NC}"
    if [ -f "$PROJECT_ROOT/scripts/install-fabric.sh" ]; then
        chmod +x "$PROJECT_ROOT/scripts/install-fabric.sh"
        cd "$PROJECT_ROOT"
        "$PROJECT_ROOT/scripts/install-fabric.sh"
        # Add binaries to PATH for this session
        export PATH="$PROJECT_ROOT/bin:$PATH"
        echo -e "${GREEN}✅ Fabric binaries installed${NC}"
    else
        echo -e "${YELLOW}⚠️  install-fabric.sh not found, assuming binaries are available${NC}"
    fi
else
    echo -e "${GREEN}✅ Fabric binaries are available${NC}"
fi
echo ""

# Step 3: Verify Setup
echo -e "${BLUE}[3/16] Verifying Setup...${NC}"
if [ -f "$PROJECT_ROOT/scripts/verify-setup.sh" ]; then
    chmod +x "$PROJECT_ROOT/scripts/verify-setup.sh"
    if "$PROJECT_ROOT/scripts/verify-setup.sh"; then
        echo -e "${GREEN}✅ Setup verification passed${NC}"
    else
        echo -e "${RED}❌ Setup verification failed${NC}"
        echo -e "${YELLOW}Please check missing files and try again${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  verify-setup.sh not found, skipping verification${NC}"
fi
echo ""

# Step 4: Install Dependencies
if [ "$SKIP_DEPS" = false ]; then
    echo -e "${BLUE}[4/16] Installing Dependencies...${NC}"
    
    # Install chaincode dependencies
    echo -e "${YELLOW}Installing chaincode dependencies...${NC}"
    cd "$PROJECT_ROOT/chaincode/coffee-export"
    go mod download 2>/dev/null || true
    go mod tidy 2>/dev/null || true
    
    cd "$PROJECT_ROOT/chaincode/user-management"
    go mod download 2>/dev/null || true
    go mod tidy 2>/dev/null || true
    
    # Install API dependencies
    echo -e "${YELLOW}Installing API dependencies...${NC}"
    if [ -d "$PROJECT_ROOT/api" ]; then
        echo -e "${YELLOW}  - Installing shared API dependencies...${NC}"
        cd "$PROJECT_ROOT/api"
        npm install --silent 2>/dev/null || npm install
    fi
    
    # Install frontend dependencies
    if [ -d "$PROJECT_ROOT/frontend" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$PROJECT_ROOT/frontend"
    npm install --legacy-peer-deps --silent 2>/dev/null || npm install --legacy-peer-deps
    fi
    
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
else
    echo -e "${BLUE}[4/16] Skipping dependency installation${NC}"
    echo ""
fi

# Step 5: Setup Environment Files
echo -e "${BLUE}[5/16] Setting Up Environment Files...${NC}"

create_env_file() {
    local dir=$1
    local env_file="$dir/.env"
    local example_file="$dir/.env.example"
    
    if [ ! -f "$env_file" ]; then
        if [ -f "$example_file" ]; then
            cp "$example_file" "$env_file"
            echo -e "${GREEN}  ✅ Created $env_file from example${NC}"
        else
            echo -e "${YELLOW}  ⚠️  $example_file not found, creating basic $env_file${NC}"
            touch "$env_file"
            # Add basic defaults if needed
            echo "# Default environment variables" >> "$env_file"
            if [[ $dir == *"frontend"* ]]; then
                echo "VITE_PORT=5173" >> "$env_file"
                echo "VITE_API_URL=http://localhost:3001" >> "$env_file"
            fi
        fi
    else
        echo -e "${YELLOW}  ⚠️  $env_file already exists${NC}"
    fi
}

create_env_file "api/exporter-bank"
create_env_file "api/national-bank"
create_env_file "api/ncat"
create_env_file "api/shipping-line"
create_env_file "frontend"

echo -e "${GREEN}✅ Environment files ready${NC}"
echo ""

# Step 6: Validate Configuration
echo -e "${BLUE}[6/16] Validating Configuration...${NC}"
if [ -f "$PROJECT_ROOT/scripts/validate-config.sh" ]; then
    chmod +x "$PROJECT_ROOT/scripts/validate-config.sh"
    if "$PROJECT_ROOT/scripts/validate-config.sh"; then
        echo -e "${GREEN}✅ Configuration validation passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuration validation had warnings${NC}"
        echo -e "${YELLOW}Continuing with startup...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  validate-config.sh not found, skipping validation${NC}"
fi
echo ""

# Step 7: Security Validation
echo -e "${BLUE}[7/16] Running Security Validation...${NC}"
if [ -f "$PROJECT_ROOT/scripts/security-validation.sh" ]; then
    chmod +x "$PROJECT_ROOT/scripts/security-validation.sh"
    if "$PROJECT_ROOT/scripts/security-validation.sh"; then
        echo -e "${GREEN}✅ Security validation passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Security validation had warnings${NC}"
        echo -e "${YELLOW}Please review security recommendations${NC}"
        echo -e "${YELLOW}Continuing with startup...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  security-validation.sh not found, skipping security validation${NC}"
fi
echo ""

# Step 8: Make Scripts Executable
echo -e "${BLUE}[8/16] Making Scripts Executable...${NC}"
chmod +x "$PROJECT_ROOT/network/network.sh" 2>/dev/null || true
chmod +x "$PROJECT_ROOT/network/scripts/"*.sh 2>/dev/null || true
chmod +x "$PROJECT_ROOT/scripts/"*.sh 2>/dev/null || true
echo -e "${GREEN}✅ Scripts are executable${NC}"
echo ""

# Step 9: Create Necessary Directories
echo -e "${BLUE}[9/16] Creating Necessary Directories...${NC}"
# Note: Do NOT create peerOrganizations and ordererOrganizations directories
# as network.sh checks for their existence to decide whether to generate crypto material
mkdir -p "$PROJECT_ROOT/network/channel-artifacts"
mkdir -p "$PROJECT_ROOT/network/system-genesis-block"
mkdir -p "$PROJECT_ROOT/api/exporter-bank/wallet"
mkdir -p "$PROJECT_ROOT/api/national-bank/wallet"
mkdir -p "$PROJECT_ROOT/api/ncat/wallet"
mkdir -p "$PROJECT_ROOT/api/shipping-line/wallet"
mkdir -p "$PROJECT_ROOT/logs"
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Step 10: Start Blockchain Network
echo -e "${BLUE}[10/16] Starting Blockchain Network...${NC}"
if check_network && [ "$CLEAN_START" = false ]; then
    echo -e "${YELLOW}⚠️  Blockchain network is already running${NC}"
    
    # Ensure connection profiles exist
    if [ ! -f "$PROJECT_ROOT/network/organizations/peerOrganizations/exporterbank.coffee-export.com/connection-exporterbank.json" ]; then
        echo -e "${YELLOW}Connection profiles not found. Generating...${NC}"
        cd "$PROJECT_ROOT/network"
        ./organizations/ccp-generate.sh
        echo -e "${GREEN}✅ Connection profiles generated${NC}"
    fi
else
    echo -e "${YELLOW}Step 10.1: Generating crypto material (certificates)...${NC}"
    cd "$PROJECT_ROOT/network"
    
    # Use network.sh to generate crypto material (it calls createOrgs internally)
    # This ensures proper order: crypto material -> connection profiles -> containers
    if [ ! -d "organizations/peerOrganizations" ]; then
        echo -e "${YELLOW}Creating organizations and crypto material...${NC}"
        # The network.sh up command will call createOrgs if needed
    fi
    
    echo -e "${YELLOW}Step 10.2: Starting network containers...${NC}"
    ./network.sh up
    
    # Wait for network to be ready with polling
    echo -e "${YELLOW}Step 10.3: Waiting for network to be ready...${NC}"
    for i in {1..30}; do
        if check_network; then
            break
        fi
        sleep 1
    done
    
    if check_network; then
        echo -e "${GREEN}✅ Blockchain network started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start blockchain network${NC}"
        exit 1
    fi
    
    # Generate connection profiles (done after crypto material exists)
    echo -e "${YELLOW}Step 10.4: Generating connection profiles...${NC}"
    cd "$PROJECT_ROOT/network"
    if [ -f "./organizations/ccp-generate.sh" ]; then
        ./organizations/ccp-generate.sh
        echo -e "${GREEN}✅ Connection profiles generated${NC}"
    else
        echo -e "${YELLOW}⚠️  ccp-generate.sh not found, connection profiles may already exist${NC}"
    fi
fi
echo ""

# Step 11: Create Channel
echo -e "${BLUE}[11/16] Creating Channel...${NC}"
CHANNEL_TEMP=$(docker exec peer0.exporterbank.coffee-export.com ls /var/hyperledger/production/ledgersData/chains/chains 2>/dev/null || echo "")
CHANNEL_EXISTS=$(echo "$CHANNEL_TEMP" | grep -c "coffeechannel" 2>/dev/null || echo "0")
CHANNEL_EXISTS=$(echo "$CHANNEL_EXISTS" | tr -d '\n\r' | tr -d ' ')

if [ "$CHANNEL_EXISTS" -eq 0 ] || [ "$CLEAN_START" = true ]; then
    echo -e "${YELLOW}Creating channel 'coffeechannel'...${NC}"
    cd "$PROJECT_ROOT/network"
    ./network.sh createChannel
    echo -e "${GREEN}✅ Channel created successfully${NC}"
else
    echo -e "${GREEN}✅ Channel already exists${NC}"
fi
echo ""

# Step 12: Deploy Chaincodes
echo -e "${BLUE}[12/16] Deploying Chaincodes...${NC}"
echo -e "${YELLOW}This may take 2-5 minutes per chaincode...${NC}"

CHAINCODE_TEMP=$(docker exec peer0.exporterbank.coffee-export.com ls /var/hyperledger/production/lifecycle/chaincodes 2>/dev/null || echo "")
COFFEE_EXPORT_CHECK=$(echo "$CHAINCODE_TEMP" | grep -c "coffee-export" 2>/dev/null || echo "0")
COFFEE_EXPORT_CHECK=$(echo "$COFFEE_EXPORT_CHECK" | tr -d '\n\r' | tr -d ' ')
USER_MGMT_CHECK=$(echo "$CHAINCODE_TEMP" | grep -c "user-management" 2>/dev/null || echo "0")
USER_MGMT_CHECK=$(echo "$USER_MGMT_CHECK" | tr -d '\n\r' | tr -d ' ')

cd "$PROJECT_ROOT/network"

if [ "$COFFEE_EXPORT_CHECK" -eq 0 ] || [ "$CLEAN_START" = true ]; then
    echo -e "${YELLOW}Deploying coffee-export chaincode...${NC}"
    ./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl go
    echo -e "${GREEN}✅ coffee-export chaincode deployed${NC}"
else
    echo -e "${GREEN}✅ coffee-export chaincode already deployed${NC}"
fi

if [ "$USER_MGMT_CHECK" -eq 0 ] || [ "$CLEAN_START" = true ]; then
    echo -e "${YELLOW}Deploying user-management chaincode...${NC}"
    ./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl go
    echo -e "${GREEN}✅ user-management chaincode deployed${NC}"
else
    echo -e "${GREEN}✅ user-management chaincode already deployed${NC}"
fi

echo -e "${GREEN}✅ All chaincodes deployed successfully${NC}"
echo ""

# Step 13: Enroll Admin Users
echo -e "${BLUE}[13/16] Enrolling Admin Users...${NC}"
if [ -f "$PROJECT_ROOT/scripts/enroll-admins.sh" ]; then
    chmod +x "$PROJECT_ROOT/scripts/enroll-admins.sh"
    "$PROJECT_ROOT/scripts/enroll-admins.sh"
else
    echo -e "${YELLOW}⚠️  enroll-admins.sh not found, skipping admin enrollment${NC}"
    echo -e "${YELLOW}APIs will attempt to enroll admin on first connection${NC}"
fi
echo ""

# Step 14: Start API Services
echo -e "${BLUE}[14/16] Starting API Services...${NC}"

cd "$PROJECT_ROOT"

# Check if ports are available
echo -e "${YELLOW}Checking API ports availability...${NC}"
PORTS_IN_USE=()
for port in 3001 3002 3003 3004; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        PORTS_IN_USE+=($port)
    fi
done

free_port() {
    local port=$1
    local pid=$(lsof -t -i:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process $pid on port $port...${NC}"
        kill -9 $pid 2>/dev/null || true
    fi
}

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Ports in use: ${PORTS_IN_USE[*]}${NC}"
    echo -e "${YELLOW}Attempting to free ports...${NC}"
    for port in "${PORTS_IN_USE[@]}"; do
        free_port $port
    done
    sleep 3
fi

# Check if tmux is available
if command -v tmux &> /dev/null; then
    echo -e "${YELLOW}Starting APIs in tmux session 'cbc-apis'...${NC}"
    
    # Kill existing session if it exists
    tmux kill-session -t cbc-apis 2>/dev/null || true
    
    # Start new session
    if [ -f "$PROJECT_ROOT/scripts/dev-apis.sh" ]; then
        chmod +x "$PROJECT_ROOT/scripts/dev-apis.sh"
        # Run dev-apis.sh in background and detach immediately
        nohup "$PROJECT_ROOT/scripts/dev-apis.sh" > /dev/null 2>&1 &
    else
        echo -e "${YELLOW}dev-apis.sh not found, starting APIs individually...${NC}"
        # Start APIs individually in tmux
        tmux new-session -d -s cbc-apis
        tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/exporter-bank && echo 'Starting Exporter Bank API...' && npm run dev" C-m
        tmux split-window -t cbc-apis -h
        tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/national-bank && echo 'Starting National Bank API...' && npm run dev" C-m
        tmux split-window -t cbc-apis -v
        tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/ncat && echo 'Starting NCAT API...' && npm run dev" C-m
        tmux select-pane -t cbc-apis.0
        tmux split-window -t cbc-apis -v
        tmux send-keys -t cbc-apis "cd $PROJECT_ROOT/api/shipping-line && echo 'Starting Shipping Line API...' && npm run dev" C-m
    fi
    echo -e "${GREEN}✅ API services started${NC}"
    echo -e "${CYAN}   View logs: tmux attach-session -t cbc-apis${NC}"
else
    echo -e "${YELLOW}tmux not found, starting APIs with nohup...${NC}"
    
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Start each API from the root with workspaces
    echo -e "${YELLOW}  - Starting Exporter Bank API (port 3001)...${NC}"
    cd "$PROJECT_ROOT/api"
    nohup npm run dev --workspace=exporter-bank-api > "$PROJECT_ROOT/logs/exporter-bank.log" 2>&1 &
    EXPORTER_PID=$!
    echo $EXPORTER_PID > "$PROJECT_ROOT/logs/exporter-bank.pid"
    
    echo -e "${YELLOW}  - Starting National Bank API (port 3002)...${NC}"
    cd "$PROJECT_ROOT/api"
    nohup npm run dev --workspace=national-bank-api > "$PROJECT_ROOT/logs/national-bank.log" 2>&1 &
    NATIONAL_PID=$!
    echo $NATIONAL_PID > "$PROJECT_ROOT/logs/national-bank.pid"
    
    echo -e "${YELLOW}  - Starting NCAT API (port 3003)...${NC}"
    cd "$PROJECT_ROOT/api"
    nohup npm run dev --workspace=ncat-api > "$PROJECT_ROOT/logs/ncat.log" 2>&1 &
    NCAT_PID=$!
    echo $NCAT_PID > "$PROJECT_ROOT/logs/ncat.pid"
    
    echo -e "${YELLOW}  - Starting Shipping Line API (port 3004)...${NC}"
    cd "$PROJECT_ROOT/api"
    nohup npm run dev --workspace=shipping-line-api > "$PROJECT_ROOT/logs/shipping-line.log" 2>&1 &
    SHIPPING_PID=$!
    echo $SHIPPING_PID > "$PROJECT_ROOT/logs/shipping-line.pid"
    
    echo -e "${GREEN}✅ API services started in background${NC}"
    echo -e "${CYAN}   View logs in: $PROJECT_ROOT/logs/${NC}"
    echo -e "${CYAN}   PIDs saved in: $PROJECT_ROOT/logs/*.pid${NC}"
fi

# Wait for APIs to start with polling
echo -e "${YELLOW}Waiting for APIs to initialize...${NC}"
for port in 3001 3002 3003 3004; do
    for i in {1..30}; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
done

# Quick health check
echo -e "${YELLOW}Performing API health checks...${NC}"
API_HEALTH_OK=0
for port in 3001 3002 3003 3004; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}  ✅ API on port $port is running${NC}"
        ((API_HEALTH_OK++))
    else
        echo -e "${RED}  ❌ API on port $port is not responding${NC}"
    fi
done

if [ $API_HEALTH_OK -eq 4 ]; then
    echo -e "${GREEN}✅ All API services are running${NC}"
else
    echo -e "${YELLOW}⚠️  $API_HEALTH_OK/4 API services are running${NC}"
    echo -e "${YELLOW}Some APIs may still be starting up...${NC}"
fi
echo ""

# Step 15: Start IPFS Daemon
echo -e "${BLUE}[15/16] Starting IPFS Daemon...${NC}"
# Check if IPFS is available
if ! command -v ipfs &> /dev/null; then
    echo -e "${YELLOW}⚠️ IPFS not found - skipping IPFS daemon startup${NC}"
    echo -e "${YELLOW}File storage features will be disabled${NC}"
else
    # Check if IPFS is already running by checking port 5001
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ IPFS is already running${NC}"
    else
        echo -e "${YELLOW}Starting IPFS daemon...${NC}"
        # Initialize IPFS if not already done
        if [ ! -d ~/.ipfs ]; then
            echo -e "${YELLOW}Initializing IPFS repository...${NC}"
            ipfs init
        fi
        
        # Create logs directory
        mkdir -p "$PROJECT_ROOT/logs"
        
        # Start IPFS daemon
        nohup ipfs daemon > "$PROJECT_ROOT/logs/ipfs.log" 2>&1 &
        
        # Wait with polling
        echo -e "${YELLOW}Waiting for IPFS daemon to start...${NC}"
        for i in {1..30}; do
            if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${GREEN}✅ IPFS daemon started${NC}"
        else
            echo -e "${RED}❌ Failed to start IPFS daemon${NC}"
            echo -e "${YELLOW}Check $PROJECT_ROOT/logs/ipfs.log for errors${NC}"
        fi
    fi
fi
echo ""

# Final Step: System Verification
echo -e "${BLUE}Final: System Verification...${NC}"
echo -e "${YELLOW}Performing final system health checks...${NC}"

# Check if all services are responding
SERVICES_OK=0
TOTAL_SERVICES=6

# Check blockchain network
if docker ps | grep -q "peer0.exporterbank"; then
    echo -e "${GREEN}  ✅ Blockchain network is running${NC}"
    ((SERVICES_OK++))
else
    echo -e "${RED}  ❌ Blockchain network is not running${NC}"
fi

# Check API services (basic port check)
for port in 3001 3002 3003 3004; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}  ✅ API service on port $port is running${NC}"
        ((SERVICES_OK++))
    else
        echo -e "${RED}  ❌ API service on port $port is not running${NC}"
    fi
done

# Check IPFS
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ IPFS is running on port 5001${NC}"
    ((SERVICES_OK++))
else
    echo -e "${RED}  ❌ IPFS is not running${NC}"
fi

echo ""
if [ $SERVICES_OK -eq $TOTAL_SERVICES ]; then
    echo -e "${GREEN}✅ All critical services are running${NC}"
else
    echo -e "${YELLOW}⚠️  $SERVICES_OK/$TOTAL_SERVICES services are running${NC}"
    echo -e "${YELLOW}Some services may still be starting up${NC}"
fi
echo ""

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║              System Started Successfully! 🎉                ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Services Running:${NC}"
echo -e "  • Blockchain Network:  ${GREEN}✓${NC}"
echo -e "  • Channel:             ${GREEN}coffeechannel${NC}"
echo -e "  • Chaincodes:          ${GREEN}coffee-export, user-management${NC}"
echo -e "  • Exporter Bank API:   ${GREEN}http://localhost:3001${NC}"
echo -e "  • National Bank API:   ${GREEN}http://localhost:3002${NC}"
echo -e "  • NCAT API:            ${GREEN}http://localhost:3003${NC}"
echo -e "  • Shipping Line API:   ${GREEN}http://localhost:3004${NC}"
echo -e "  • IPFS API:            ${GREEN}http://localhost:5001${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "${CYAN}1. Create a Test User:${NC}"
echo -e "   curl -X POST http://localhost:3001/api/auth/register \\"
echo -e "     -H \"Content-Type: application/json\" \\"
echo -e "     -d '{"
echo -e "       \"username\": \"testuser\","
echo -e "       \"password\": \"Test123!@#\","
echo -e "       \"email\": \"test@example.com\","
echo -e "       \"organizationId\": \"exporter\","
echo -e "       \"role\": \"exporter\""
echo -e "     }'"
echo ""
echo -e "${YELLOW}View Logs:${NC}"
if command -v tmux &> /dev/null; then
    echo -e "   APIs:      ${CYAN}tmux attach-session -t cbc-apis${NC}"
else
    echo -e "   APIs:      ${CYAN}tail -f $PROJECT_ROOT/logs/*.log${NC}"
fi
echo -e "   IPFS:      ${CYAN}tail -f $PROJECT_ROOT/logs/ipfs.log${NC}"
echo ""
echo -e "${YELLOW}Stop the System:${NC}"
if command -v tmux &> /dev/null; then
    echo -e "   ${CYAN}tmux kill-session -t cbc-apis${NC}"
    echo -e "   ${CYAN}pkill -f 'ipfs daemon'${NC}"
else
    echo -e "   ${CYAN}pkill -f 'npm run dev'${NC}"
    echo -e "   ${CYAN}pkill -f 'ipfs daemon'${NC}"
fi
echo -e "   ${CYAN}cd $PROJECT_ROOT/network && ./network.sh down${NC}"
echo ""
echo -e "${YELLOW}Restart Options:${NC}"
echo -e "   Normal restart:  ${CYAN}./start-system.sh${NC}"
echo -e "   Clean restart:   ${CYAN}./start-system.sh --clean${NC}"
echo -e "   Skip deps:       ${CYAN}./start-system.sh --skip-deps${NC}"
echo ""
echo -e "${GREEN}Happy Coding! ☕${NC}"
echo ""

# Wait for APIs to be ready and register users
echo "⏳ Waiting for APIs to initialize..."
sleep 15 # Wait for APIs to be fully up
echo "✅ APIs are up."
echo ""

echo -e "${BLUE}[16/16] Registering Test Users...${NC}"
echo -e "${YELLOW}Creating test users for each organization...${NC}"

# Function to register a test user
register_test_user() {
    local port=$1
    local org_name=$2
    local username=$3
    local password=$4
    local email=$5
    
    echo -e "${YELLOW}  Registering $username in $org_name...${NC}"
    
    response=$(curl -s -X POST http://localhost:$port/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\",\"email\":\"$email\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}  ✅ Successfully registered $username${NC}"
        echo -e "${CYAN}     Username: $username${NC}"
        echo -e "${CYAN}     Password: $password${NC}"
    else
        echo -e "${RED}  ❌ Failed to register $username${NC}"
        echo -e "${YELLOW}     Response: $response${NC}"
    fi
    echo ""
}

# Register test users for each organization
register_test_user 3001 "Exporter Bank" "exporter1" "Exporter123!@#" "exporter1@exporterbank.com"
register_test_user 3002 "National Bank" "banker1" "Banker123!@#" "banker1@nationalbank.com"
register_test_user 3003 "NCAT" "inspector1" "Inspector123!@#" "inspector1@ncat.gov"
register_test_user 3004 "Shipping Line" "shipper1" "Shipper123!@#" "shipper1@shippingline.com"

echo -e "${GREEN}✅ Test users registered successfully!${NC}"
echo ""
echo -e "${CYAN}╔════════════════════════════════��═══════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║                  Test User Credentials                     ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Exporter Bank:${NC}"
echo -e "  Username: ${CYAN}exporter1${NC}"
echo -e "  Password: ${CYAN}Exporter123!@#${NC}"
echo ""
echo -e "${GREEN}National Bank:${NC}"
echo -e "  Username: ${CYAN}banker1${NC}"
echo -e "  Password: ${CYAN}Banker123!@#${NC}"
echo ""
echo -e "${GREEN}NCAT:${NC}"
echo -e "  Username: ${CYAN}inspector1${NC}"
echo -e "  Password: ${CYAN}Inspector123!@#${NC}"
echo ""
echo -e "${GREEN}Shipping Line:${NC}"
echo -e "  Username: ${CYAN}shipper1${NC}"
echo -e "  Password: ${CYAN}Shipper123!@#${NC}"
echo ""
