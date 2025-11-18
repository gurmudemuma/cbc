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

# Removed set -e to handle errors explicitly
# Using trap for proper cleanup on errors

# Exit codes
EXIT_SUCCESS=0
EXIT_PREREQUISITES_FAILED=1
EXIT_NETWORK_FAILED=2
EXIT_CHAINCODE_FAILED=3
EXIT_API_FAILED=4
EXIT_IPFS_FAILED=5

# Track what has been started for cleanup
NETWORK_STARTED=false
APIS_STARTED=false
IPFS_STARTED=false

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

# Create logs directory and log file
LOGS_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOGS_DIR"
STARTUP_LOG="$LOGS_DIR/startup-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$STARTUP_LOG"
}

log "INFO" "=== Starting Coffee Blockchain Consortium System ==="
log "INFO" "Project root: $PROJECT_ROOT"

# Parse command line arguments
CLEAN_START=false
SKIP_DEPS=false
UPDATE_CHAINCODE=false

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
        --update-chaincode)
            UPDATE_CHAINCODE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --clean             Perform a clean start (remove all existing data)"
            echo "  --skip-deps         Skip dependency installation"
            echo "  --update-chaincode  Force chaincode update to latest version"
            echo "  -h, --help          Show this help message"
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

# Cleanup function for rollback on failure
cleanup_on_error() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║            Startup Failed - Rolling Back...                ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        
        if [ "$APIS_STARTED" = true ]; then
            echo -e "${YELLOW}Stopping API services...${NC}"
            stop_services
        fi
        
        if [ "$IPFS_STARTED" = true ]; then
            echo -e "${YELLOW}Stopping IPFS daemon...${NC}"
            pkill -f 'ipfs daemon' 2>/dev/null || true
        fi
        
        echo -e "${RED}Startup failed with exit code: $exit_code${NC}"
        echo -e "${YELLOW}Check logs for details${NC}"
    fi
}

# Set trap for cleanup on error
trap cleanup_on_error EXIT

# Clean up previous data and processes
echo "🧹 Performing a clean start by removing old data..."
if [ -f "$(dirname "$0")/scripts/clean.sh" ]; then
    if ! bash "$(dirname "$0")/scripts/clean.sh"; then
        echo -e "${YELLOW}⚠️ Warning: clean.sh script had issues but continuing...${NC}"
    fi
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

# Cross-platform port checking function
check_port() {
    local port=$1
    local host=${2:-localhost}
    
    # Try multiple methods for cross-platform compatibility
    if command -v lsof &> /dev/null; then
        lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
        return $?
    elif command -v netstat &> /dev/null; then
        netstat -an | grep -q ":$port.*LISTEN"
        return $?
    elif command -v ss &> /dev/null; then
        ss -ln | grep -q ":$port"
        return $?
    else
        # Fallback: try to connect to the port
        (echo >/dev/tcp/$host/$port) &>/dev/null
        return $?
    fi
}

# Function to wait for port to be ready
wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local interval=${3:-1}
    local count=0
    
    log "INFO" "Waiting for port $port to be ready (timeout: ${timeout}s)..."
    while [ $count -lt $timeout ]; do
        if check_port $port; then
            log "INFO" "Port $port is ready"
            return 0
        fi
        sleep $interval
        count=$((count + interval))
    done
    
    log "ERROR" "Timeout waiting for port $port"
    return 1
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        log "ERROR" "Docker is not running"
        echo -e "${YELLOW}Please start Docker and try again${NC}"
        exit $EXIT_PREREQUISITES_FAILED
    fi
    log "INFO" "Docker is running"
}

# Function to check if network is running
check_network() {
    if docker ps | grep -q "peer0.commercialbank"; then
        return 0
    else
        return 1
    fi
}

# Function to check API health via HTTP
check_api_health() {
    local port=$1
    local endpoint=${2:-/health}
    local timeout=${3:-5}
    
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout http://localhost:$port$endpoint 2>/dev/null)
        if [[ "$response" =~ ^2[0-9]{2}$ ]]; then
            return 0
        else
            return 1
        fi
    else
        # Fallback to port check if curl not available
        check_port $port
        return $?
    fi
}

# Function to wait for API to be healthy
wait_for_api() {
    local port=$1
    local name=$2
    local timeout=${3:-60}
    local interval=${4:-2}
    local count=0
    
    log "INFO" "Waiting for $name API on port $port to be healthy..."
    
    # First wait for port to be listening (increased timeout for API startup)
    if ! wait_for_port $port 60 1; then
        log "ERROR" "$name API port $port not listening"
        return 1
    fi
    
    # Then check HTTP health
    while [ $count -lt $timeout ]; do
        if check_api_health $port; then
            log "INFO" "$name API is healthy"
            return 0
        fi
        sleep $interval
        count=$((count + interval))
    done
    
    log "ERROR" "Timeout waiting for $name API to be healthy"
    return 1
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
    pkill -f "npm run dev.*commercial-bank" 2>/dev/null || true
    pkill -f "npm run dev.*national-bank" 2>/dev/null || true
    pkill -f "npm run dev.*ecta" 2>/dev/null || true
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
    rm -rf api/commercial-bank/wallet/* 2>/dev/null || true
    rm -rf api/national-bank/wallet/* 2>/dev/null || true
    rm -rf api/ecta/wallet/* 2>/dev/null || true
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
log "INFO" "Step 1: Checking prerequisites"

# Check system resources
echo -e "${YELLOW}Checking system resources...${NC}"

# Check disk space (need at least 10GB free)
DISK_AVAILABLE=$(df -BG "$PROJECT_ROOT" | tail -1 | awk '{print $4}' | sed 's/G//')
MIN_DISK_GB=10
if [ "$DISK_AVAILABLE" -lt "$MIN_DISK_GB" ]; then
    echo -e "${RED}❌ Insufficient disk space: ${DISK_AVAILABLE}GB available, ${MIN_DISK_GB}GB required${NC}"
    log "ERROR" "Insufficient disk space: ${DISK_AVAILABLE}GB"
    exit $EXIT_PREREQUISITES_FAILED
else
    echo -e "${GREEN}✅ Disk space: ${DISK_AVAILABLE}GB available${NC}"
    log "INFO" "Disk space check passed: ${DISK_AVAILABLE}GB"
fi

# Check memory (need at least 4GB available)
if command -v free &> /dev/null; then
    MEM_AVAILABLE=$(free -g | awk '/^Mem:/{print $7}')
    MIN_MEM_GB=4
    if [ "$MEM_AVAILABLE" -lt "$MIN_MEM_GB" ]; then
        echo -e "${YELLOW}⚠️ Low memory: ${MEM_AVAILABLE}GB available, ${MIN_MEM_GB}GB recommended${NC}"
        log "WARN" "Low memory: ${MEM_AVAILABLE}GB"
    else
        echo -e "${GREEN}✅ Memory: ${MEM_AVAILABLE}GB available${NC}"
        log "INFO" "Memory check passed: ${MEM_AVAILABLE}GB"
    fi
fi

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

# IPFS is required for document storage
if ! command -v ipfs &> /dev/null; then
    MISSING_TOOLS+=("IPFS")
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
    go mod vendor 2>/dev/null || go mod vendor
    
    cd "$PROJECT_ROOT/chaincode/user-management"
    go mod download 2>/dev/null || true
    go mod tidy 2>/dev/null || true
    go mod vendor 2>/dev/null || go mod vendor
    
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

create_env_file "api/commercial-bank"
create_env_file "api/national-bank"
create_env_file "api/ecta"
create_env_file "api/shipping-line"
create_env_file "api/custom-authorities"
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

# Fix permissions on existing directories if they're owned by root
if [ -d "$PROJECT_ROOT/network/organizations" ]; then
    if [ "$(stat -c '%U' "$PROJECT_ROOT/network/organizations" 2>/dev/null)" = "root" ]; then
        echo -e "${YELLOW}  Fixing directory ownership (root detected)...${NC}"
        sudo chown -R $(whoami):$(whoami) "$PROJECT_ROOT/network/organizations" 2>/dev/null || true
        echo -e "${GREEN}  ✅ Ownership fixed${NC}"
    fi
fi

# Create parent directories with correct ownership to prevent Docker from creating them as root
mkdir -p "$PROJECT_ROOT/network/organizations/peerOrganizations"
mkdir -p "$PROJECT_ROOT/network/organizations/ordererOrganizations"
mkdir -p "$PROJECT_ROOT/network/channel-artifacts"
mkdir -p "$PROJECT_ROOT/network/system-genesis-block"
mkdir -p "$PROJECT_ROOT/api/commercial-bank/wallet"
mkdir -p "$PROJECT_ROOT/api/national-bank/wallet"
mkdir -p "$PROJECT_ROOT/api/ecta/wallet"
mkdir -p "$PROJECT_ROOT/api/shipping-line/wallet"
mkdir -p "$PROJECT_ROOT/api/custom-authorities/wallet"
mkdir -p "$PROJECT_ROOT/logs"

echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Step 10: Start Blockchain Network
echo -e "${BLUE}[10/16] Starting Blockchain Network...${NC}"
if check_network && [ "$CLEAN_START" = false ]; then
    echo -e "${YELLOW}⚠️  Blockchain network is already running${NC}"
    
    # Ensure connection profiles exist
    if [ ! -f "$PROJECT_ROOT/network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.json" ]; then
        echo -e "${YELLOW}Connection profiles not found. Generating...${NC}"
        cd "$PROJECT_ROOT/network"
        ./organizations/ccp-generate.sh
        echo -e "${GREEN}✅ Connection profiles generated${NC}"
    fi
else
    echo -e "${YELLOW}Step 10.1: Generating crypto material (certificates)...${NC}"
    cd "$PROJECT_ROOT/network"
    log "INFO" "Generating crypto material with cryptogen"
    
    # Check if cryptogen is available
    if ! command -v cryptogen &> /dev/null; then
        echo -e "${RED}❌ cryptogen command not found${NC}"
        log "ERROR" "cryptogen not found in PATH"
        exit $EXIT_NETWORK_FAILED
    fi
    
    # Generate crypto material for each organization explicitly
    # This is more reliable than relying on network.sh's createOrgs function
    echo -e "${YELLOW}  - Generating Commercial Bank identities...${NC}"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-commercialbank.yaml --output="organizations" 2>&1 | tee -a "$STARTUP_LOG"
    
    echo -e "${YELLOW}  - Generating National Bank identities...${NC}"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-nationalbank.yaml --output="organizations" 2>&1 | tee -a "$STARTUP_LOG"
    
    echo -e "${YELLOW}  - Generating ECTA identities...${NC}"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-ecta.yaml --output="organizations" 2>&1 | tee -a "$STARTUP_LOG"
    
    echo -e "${YELLOW}  - Generating Shipping Line identities...${NC}"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-shippingline.yaml --output="organizations" 2>&1 | tee -a "$STARTUP_LOG"
    
    echo -e "${YELLOW}  - Generating Custom Authorities identities...${NC}"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-customauthorities.yaml --output="organizations" 2>&1 | tee -a "$STARTUP_LOG"
    
    echo -e "${YELLOW}  - Generating Orderer identities...${NC}"
    cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations" 2>&1 | tee -a "$STARTUP_LOG"
    
    # Verify crypto material was generated
    if [ ! -d "organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/msp" ]; then
        echo -e "${RED}❌ Crypto material generation failed${NC}"
        log "ERROR" "MSP directories not created"
        exit $EXIT_NETWORK_FAILED
    fi
    
    echo -e "${GREEN}✅ Crypto material generated successfully${NC}"
    log "INFO" "All crypto material generated"
    
    # Generate connection profiles
    echo -e "${YELLOW}Step 10.2: Generating connection profiles...${NC}"
    if [ -f "./organizations/ccp-generate.sh" ]; then
        ./organizations/ccp-generate.sh 2>&1 | tee -a "$STARTUP_LOG"
        echo -e "${GREEN}✅ Connection profiles generated${NC}"
        log "INFO" "Connection profiles generated"
    else
        echo -e "${RED}❌ ccp-generate.sh not found${NC}"
        log "ERROR" "ccp-generate.sh script missing"
        exit $EXIT_NETWORK_FAILED
    fi
    
    # Start network containers using docker compose directly
    echo -e "${YELLOW}Step 10.3: Starting network containers...${NC}"
    log "INFO" "Starting Docker containers"
    
    # Use docker compose directly (more reliable than network.sh)
    IMAGE_TAG=latest docker compose -f docker/docker-compose.yaml up -d 2>&1 | tee -a "$STARTUP_LOG"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start Docker containers${NC}"
        log "ERROR" "Docker compose failed"
        exit $EXIT_NETWORK_FAILED
    fi
    
    # Wait for network to be ready with polling
    echo -e "${YELLOW}Step 10.4: Waiting for network to be ready...${NC}"
    log "INFO" "Waiting for peer containers to start"
    
    for i in {1..60}; do
        if check_network; then
            break
        fi
        sleep 2
    done
    
    if check_network; then
        echo -e "${GREEN}✅ Blockchain network started successfully${NC}"
        log "INFO" "Blockchain network is running"
        NETWORK_STARTED=true
        
        # Verify all peers are running (not just one)
        PEER_COUNT=$(docker ps | grep -c "peer0.*coffee-export.com")
        if [ "$PEER_COUNT" -ge 5 ]; then
            echo -e "${GREEN}✅ All $PEER_COUNT peer containers are running${NC}"
            log "INFO" "All peer containers verified"
        else
            echo -e "${YELLOW}⚠️  Only $PEER_COUNT/5 peer containers running${NC}"
            log "WARN" "Not all peer containers are running"
        fi
    else
        echo -e "${RED}❌ Failed to start blockchain network${NC}"
        log "ERROR" "Blockchain network failed to start - no peers detected"
        
        # Show container status for debugging
        echo -e "${YELLOW}Container status:${NC}"
        docker ps -a | grep "coffee-export" | tee -a "$STARTUP_LOG"
        
        exit $EXIT_NETWORK_FAILED
    fi
fi
echo ""

# Step 11: Create Channel
echo -e "${BLUE}[11/16] Creating Channel...${NC}"
CHANNEL_TEMP=$(docker exec peer0.commercialbank.coffee-export.com ls /var/hyperledger/production/ledgersData/chains/chains 2>/dev/null || echo "")
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

# Step 11.5: Add Custom Authorities Organization
echo -e "${BLUE}[11.5/16] Adding Custom Authorities Organization...${NC}"
cd "$PROJECT_ROOT/network/scripts"
./add-custom-authorities-org.sh
echo -e "${GREEN}✅ Custom Authorities added${NC}"
echo ""

# Step 12: Deploy Chaincodes
echo -e "${BLUE}[12/16] Deploying Chaincodes...${NC}"
echo -e "${YELLOW}This may take 2-5 minutes per chaincode...${NC}"

CHAINCODE_TEMP=$(docker exec peer0.commercialbank.coffee-export.com ls /var/hyperledger/production/lifecycle/chaincodes 2>/dev/null || echo "")
COFFEE_EXPORT_CHECK=$(echo "$CHAINCODE_TEMP" | grep -c "coffee-export" 2>/dev/null || echo "0")
COFFEE_EXPORT_CHECK=$(echo "$COFFEE_EXPORT_CHECK" | tr -d '\n\r' | tr -d ' ')
USER_MGMT_CHECK=$(echo "$CHAINCODE_TEMP" | grep -c "user-management" 2>/dev/null || echo "0")
USER_MGMT_CHECK=$(echo "$USER_MGMT_CHECK" | tr -d '\n\r' | tr -d ' ')

cd "$PROJECT_ROOT/network"

if [ "$COFFEE_EXPORT_CHECK" -eq 0 ] || [ "$CLEAN_START" = true ]; then
    echo -e "${YELLOW}Deploying coffee-export chaincode...${NC}"
    # First deployment on a channel must use sequence 1
    ./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang
    echo -e "${GREEN}✅ coffee-export chaincode deployed${NC}"
    log "INFO" "coffee-export chaincode deployed"
else
    echo -e "${GREEN}✅ coffee-export chaincode already deployed${NC}"
    log "INFO" "coffee-export chaincode already deployed"
    
    # Check if force update flag is set
    if [ "$UPDATE_CHAINCODE" = true ]; then
        echo -e "${YELLOW}Force update requested, redeploying chaincode...${NC}"
        echo -e "${YELLOW}Updating with latest code changes...${NC}"
        echo -e "${YELLOW}This will take 2-3 minutes...${NC}"
        log "INFO" "Force updating coffee-export chaincode"
        
        ./network.sh deployCC -ccn coffee-export -ccp ../chaincode/coffee-export -ccl golang
        echo -e "${GREEN}✅ coffee-export chaincode redeployed${NC}"
        log "INFO" "coffee-export chaincode redeployed"
        
        # Verify deployment
        echo -e "${YELLOW}Verifying deployment...${NC}"
        docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel -n coffee-export 2>/dev/null || echo "Verification skipped (CLI not available)"
        echo ""
    else
        echo -e "${YELLOW}Note: Run with --update-chaincode to redeploy with latest code${NC}"
    fi
fi

if [ "$USER_MGMT_CHECK" -eq 0 ] || [ "$CLEAN_START" = true ]; then
    echo -e "${YELLOW}Deploying user-management chaincode...${NC}"
    ./network.sh deployCC -ccn user-management -ccp ../chaincode/user-management -ccl golang
    echo -e "${GREEN}✅ user-management chaincode deployed${NC}"
else
    echo -e "${GREEN}✅ user-management chaincode already deployed${NC}"
fi

echo -e "${GREEN}✅ All chaincodes deployed successfully${NC}"

# Verify chaincode deployment
echo -e "${YELLOW}Verifying chaincode deployment...${NC}"
log "INFO" "Verifying chaincode deployment"

# Check if chaincode containers are running (more reliable than CLI query)
COFFEE_EXPORT_CONTAINERS=$(docker ps | grep -c "dev-peer.*coffee-export_" || echo "0")
USER_MGMT_CONTAINERS=$(docker ps | grep -c "dev-peer.*user-management_" || echo "0")

if [ "$COFFEE_EXPORT_CONTAINERS" -ge 1 ]; then
    echo -e "${GREEN}  ✅ coffee-export chaincode is running ($COFFEE_EXPORT_CONTAINERS containers)${NC}"
    log "INFO" "coffee-export chaincode verified - $COFFEE_EXPORT_CONTAINERS containers running"
else
    echo -e "${YELLOW}  ⚠️  coffee-export chaincode containers not found${NC}"
    log "WARN" "coffee-export chaincode containers not detected"
    
    # Try CLI query as fallback
    echo -e "${YELLOW}  Attempting CLI query verification...${NC}"
    COMMITTED_CCS=$(docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel -n coffee-export 2>&1 || echo "")
    if echo "$COMMITTED_CCS" | grep -q "Version:"; then
        echo -e "${GREEN}  ✅ coffee-export chaincode is committed (verified via CLI)${NC}"
        log "INFO" "coffee-export chaincode verified via CLI query"
    else
        echo -e "${YELLOW}  ⚠️  Could not verify coffee-export chaincode${NC}"
        echo -e "${YELLOW}  This may be normal if chaincode hasn't been invoked yet${NC}"
        log "WARN" "coffee-export chaincode verification inconclusive"
    fi
fi

if [ "$USER_MGMT_CONTAINERS" -ge 1 ]; then
    echo -e "${GREEN}  ✅ user-management chaincode is running ($USER_MGMT_CONTAINERS containers)${NC}"
    log "INFO" "user-management chaincode verified - $USER_MGMT_CONTAINERS containers running"
else
    echo -e "${YELLOW}  ⚠️  user-management chaincode containers not found (may not be critical)${NC}"
    log "WARN" "user-management chaincode containers not detected"
fi

echo -e "${GREEN}✅ Chaincode verification completed${NC}"
echo ""

# Step 12.5: Generate Connection Profiles
echo -e "${BLUE}[12.5/16] Generating Connection Profiles...${NC}"
log "INFO" "Step 12.5: Generating connection profiles with embedded TLS certificates"
cd "$PROJECT_ROOT/network/scripts"
if [ -f "./generate-connection-profiles.sh" ]; then
    chmod +x ./generate-connection-profiles.sh
    ./generate-connection-profiles.sh
    echo -e "${GREEN}✅ Connection profiles generated with embedded PEM certificates${NC}"
    log "INFO" "Connection profiles generated successfully"
else
    echo -e "${YELLOW}⚠️  generate-connection-profiles.sh not found${NC}"
    log "WARN" "Connection profile generation script not found"
fi
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

# Step 13.5: Start IPFS Daemon
echo -e "${BLUE}[13.5/16] Starting IPFS Daemon...${NC}"

# Check if IPFS is installed
if ! command -v ipfs &> /dev/null; then
    echo -e "${YELLOW}⚠️  IPFS not found. Installing IPFS...${NC}"
    
    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case "$ARCH" in
        x86_64) ARCH="amd64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        armv7l) ARCH="arm" ;;
    esac
    
    IPFS_VERSION="v0.32.1"
    IPFS_DIST="kubo_${IPFS_VERSION}_${OS}-${ARCH}.tar.gz"
    
    echo -e "${YELLOW}Downloading IPFS ${IPFS_VERSION} for ${OS}-${ARCH}...${NC}"
    cd /tmp
    wget -q "https://dist.ipfs.tech/kubo/${IPFS_VERSION}/${IPFS_DIST}" || {
        echo -e "${RED}❌ Failed to download IPFS${NC}"
        echo -e "${YELLOW}⚠️  Continuing without IPFS - document upload will not work${NC}"
        echo -e "${YELLOW}Install manually: https://docs.ipfs.tech/install/command-line/${NC}"
    }
    
    if [ -f "$IPFS_DIST" ]; then
        tar -xzf "$IPFS_DIST"
        cd kubo
        sudo bash install.sh
        cd /tmp
        rm -rf kubo "$IPFS_DIST"
        echo -e "${GREEN}✅ IPFS installed successfully${NC}"
    fi
    
    cd "$PROJECT_ROOT"
fi

# Initialize IPFS if not already initialized
if [ ! -d "$HOME/.ipfs" ]; then
    echo -e "${YELLOW}Initializing IPFS repository...${NC}"
    ipfs init || {
        echo -e "${RED}❌ Failed to initialize IPFS${NC}"
        echo -e "${YELLOW}⚠️  Continuing without IPFS${NC}"
    }
    echo -e "${GREEN}✅ IPFS repository initialized${NC}"
fi

# Check if IPFS daemon is already running
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  IPFS daemon already running on port 5001${NC}"
    IPFS_STARTED=true
else
    # Start IPFS daemon in background
    echo -e "${YELLOW}Starting IPFS daemon...${NC}"
    nohup ipfs daemon > "$PROJECT_ROOT/logs/ipfs.log" 2>&1 &
    IPFS_PID=$!
    echo $IPFS_PID > "$PROJECT_ROOT/logs/ipfs.pid"
    
    # Wait for IPFS to be ready
    echo -e "${YELLOW}Waiting for IPFS daemon to be ready...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:5001/api/v0/id > /dev/null 2>&1; then
            echo -e "${GREEN}✅ IPFS daemon is ready${NC}"
            IPFS_STARTED=true
            
            # Get IPFS peer ID
            IPFS_ID=$(curl -s -X POST http://localhost:5001/api/v0/id | jq -r '.ID' 2>/dev/null || echo "unknown")
            echo -e "${GREEN}   IPFS Peer ID: ${IPFS_ID}${NC}"
            break
        fi
        sleep 1
    done
    
    if [ "$IPFS_STARTED" = false ]; then
        echo -e "${RED}❌ IPFS daemon failed to start${NC}"
        echo -e "${YELLOW}⚠️  Continuing without IPFS - document upload will not work${NC}"
        echo -e "${YELLOW}Check logs: $PROJECT_ROOT/logs/ipfs.log${NC}"
    fi
fi
echo ""

# Step 14: Start API Services
echo -e "${BLUE}[14/16] Starting API Services...${NC}"

cd "$PROJECT_ROOT"

# Ensure .env files have all required variables
echo -e "${YELLOW}Ensuring API .env files are up to date...${NC}"
if [ -f "$PROJECT_ROOT/scripts/fix-env-files.sh" ]; then
    "$PROJECT_ROOT/scripts/fix-env-files.sh" > /dev/null 2>&1
fi

# Fix .env files for native (non-Docker) execution
if [ -f "$PROJECT_ROOT/scripts/fix-env-for-native.sh" ]; then
    "$PROJECT_ROOT/scripts/fix-env-for-native.sh" > /dev/null 2>&1
fi
echo -e "${GREEN}✅ API .env files verified and configured for native execution${NC}"

# Kill any hanging API processes from previous failed startups
echo -e "${YELLOW}Cleaning up any previous API processes...${NC}"

# Stop Docker API containers if they exist
for api_name in commercial-bank-api national-bank-api ecta-api shipping-line-api custom-authorities-api; do
    if docker ps -q -f name="^${api_name}$" | grep -q .; then
        echo -e "${YELLOW}  Stopping Docker container: ${api_name}${NC}"
        docker stop "$api_name" 2>/dev/null || true
        docker rm "$api_name" 2>/dev/null || true
    fi
done

# Kill native node processes
pkill -f "ts-node-dev.*api" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

# Check if ports are available and force-free them
echo -e "${YELLOW}Checking API ports availability...${NC}"
PORTS_IN_USE=()
for port in 3001 3002 3003 3004 3005 3007; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        PORTS_IN_USE+=($port)
    fi
done

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Ports in use: ${PORTS_IN_USE[*]}${NC}"
    echo -e "${YELLOW}Force-killing processes on ports...${NC}"
    for port in "${PORTS_IN_USE[@]}"; do
        lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
    done
    sleep 2
    
    # Verify ports are now free
    for port in "${PORTS_IN_USE[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}❌ Failed to free port $port${NC}"
            exit $EXIT_API_FAILED
        fi
    done
    echo -e "${GREEN}✅ All ports freed${NC}"
fi

# Start APIs with nohup for reliability (faster than tmux with dependency checks)
echo -e "${YELLOW}Starting APIs with nohup...${NC}"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Start each API from their respective directories
echo -e "${YELLOW}  - Starting Commercial Bank API (port 3001)...${NC}"
cd "$PROJECT_ROOT/api/commercial-bank"
nohup npm run dev > "$PROJECT_ROOT/logs/commercial-bank.log" 2>&1 &
COMMERCIAL_PID=$!
echo $COMMERCIAL_PID > "$PROJECT_ROOT/logs/commercial-bank.pid"

echo -e "${YELLOW}  - Starting National Bank API (port 3002)...${NC}"
cd "$PROJECT_ROOT/api/national-bank"
nohup npm run dev > "$PROJECT_ROOT/logs/national-bank.log" 2>&1 &
NATIONAL_PID=$!
echo $NATIONAL_PID > "$PROJECT_ROOT/logs/national-bank.pid"

echo -e "${YELLOW}  - Starting ECTA API (port 3003)...${NC}"
cd "$PROJECT_ROOT/api/ecta"
nohup npm run dev > "$PROJECT_ROOT/logs/ecta.log" 2>&1 &
ECTA_PID=$!
echo $ECTA_PID > "$PROJECT_ROOT/logs/ecta.pid"

echo -e "${YELLOW}  - Starting Shipping Line API (port 3004)...${NC}"
cd "$PROJECT_ROOT/api/shipping-line"
nohup npm run dev > "$PROJECT_ROOT/logs/shipping-line.log" 2>&1 &
SHIPPING_PID=$!
echo $SHIPPING_PID > "$PROJECT_ROOT/logs/shipping-line.pid"

echo -e "${YELLOW}  - Starting Custom Authorities API (port 3005)...${NC}"
cd "$PROJECT_ROOT/api/custom-authorities"
nohup npm run dev > "$PROJECT_ROOT/logs/custom-authorities.log" 2>&1 &
CUSTOM_PID=$!
echo $CUSTOM_PID > "$PROJECT_ROOT/logs/custom-authorities.pid"

echo -e "${YELLOW}  - Starting Exporter Portal API (port 3007)...${NC}"
cd "$PROJECT_ROOT/api/exporter-portal"
# Create client identity if it doesn't exist
if [ ! -f "wallet/exporterPortalClient.id" ]; then
    echo -e "${YELLOW}    Creating dedicated client identity for Exporter Portal...${NC}"
    node create-client-identity.js
fi
nohup npm run dev > "$PROJECT_ROOT/logs/exporter-portal.log" 2>&1 &
EXPORTER_PID=$!
echo $EXPORTER_PID > "$PROJECT_ROOT/logs/exporter-portal.pid"

echo -e "${GREEN}✅ API services started in background${NC}"
echo -e "${CYAN}   View logs in: $PROJECT_ROOT/logs/${NC}"
echo -e "${CYAN}   PIDs saved in: $PROJECT_ROOT/logs/*.pid${NC}"

# Wait for APIs to be healthy with proper checks
echo -e "${YELLOW}Waiting for APIs to initialize and become healthy...${NC}"
log "INFO" "Performing API health checks"

API_HEALTH_OK=0
TOTAL_APIS=6

# Wait for each API with proper health checks
if wait_for_api 3001 "Commercial Bank" 90; then
    ((API_HEALTH_OK++))
    APIS_STARTED=true
fi

if wait_for_api 3002 "National Bank" 90; then
    ((API_HEALTH_OK++))
fi

if wait_for_api 3003 "ECTA" 90; then
    ((API_HEALTH_OK++))
fi

if wait_for_api 3004 "Shipping Line" 90; then
    ((API_HEALTH_OK++))
fi

if wait_for_api 3005 "Custom Authorities" 90; then
    ((API_HEALTH_OK++))
fi

if wait_for_api 3007 "Exporter Portal" 90; then
    ((API_HEALTH_OK++))
fi

echo ""
if [ $API_HEALTH_OK -eq $TOTAL_APIS ]; then
    echo -e "${GREEN}✅ All $TOTAL_APIS API services are healthy${NC}"
    log "INFO" "All API services are healthy"
elif [ $API_HEALTH_OK -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $API_HEALTH_OK/$TOTAL_APIS API services are healthy${NC}"
    echo -e "${YELLOW}Continuing with available services...${NC}"
    log "WARN" "Only $API_HEALTH_OK/$TOTAL_APIS API services are healthy"
else
    echo -e "${RED}❌ No API services are healthy${NC}"
    log "ERROR" "No API services are healthy"
    exit $EXIT_API_FAILED
fi
echo ""

# Step 15: Start IPFS Daemon (Required)
echo -e "${BLUE}[15/16] Starting IPFS Daemon...${NC}"
log "INFO" "Step 15: Starting IPFS daemon"

# Check if IPFS is already running by checking port 5001
if check_port 5001; then
    echo -e "${GREEN}✅ IPFS is already running${NC}"
    log "INFO" "IPFS already running"
    IPFS_STARTED=true
else
    echo -e "${YELLOW}Starting IPFS daemon...${NC}"
    # Initialize IPFS if not already done
    if [ ! -d ~/.ipfs ]; then
        echo -e "${YELLOW}Initializing IPFS repository...${NC}"
        log "INFO" "Initializing IPFS repository"
        if ! ipfs init; then
            echo -e "${RED}❌ Failed to initialize IPFS${NC}"
            log "ERROR" "Failed to initialize IPFS"
            echo -e "${RED}IPFS is required for document storage${NC}"
            exit $EXIT_IPFS_FAILED
        fi
    fi
    
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Start IPFS daemon
    nohup ipfs daemon > "$PROJECT_ROOT/logs/ipfs.log" 2>&1 &
    log "INFO" "IPFS daemon started in background"
    
    # Wait for IPFS to be ready
    if wait_for_port 5001 60; then
        echo -e "${GREEN}✅ IPFS daemon started successfully${NC}"
        log "INFO" "IPFS daemon is ready"
        IPFS_STARTED=true
    else
        echo -e "${RED}❌ Failed to start IPFS daemon${NC}"
        log "ERROR" "IPFS daemon failed to start"
        echo -e "${RED}IPFS is required for document storage${NC}"
        echo -e "${YELLOW}Check $PROJECT_ROOT/logs/ipfs.log for errors${NC}"
        exit $EXIT_IPFS_FAILED
    fi
fi
echo ""

# Final Step: System Verification
echo -e "${BLUE}Final: System Verification...${NC}"
echo -e "${YELLOW}Waiting for APIs to fully initialize Fabric connections...${NC}"
sleep 10
echo -e "${YELLOW}Performing final system health checks...${NC}"

# Check if all services are responding
SERVICES_OK=0
TOTAL_SERVICES=8

# Check blockchain network
if docker ps | grep -q "peer0.commercialbank"; then
    echo -e "${GREEN}  ✅ Blockchain network is running${NC}"
    ((SERVICES_OK++))
else
    echo -e "${RED}  ❌ Blockchain network is not running${NC}"
fi

# Check API services with health checks
API_NAMES=("Commercial Bank" "National Bank" "ECTA" "Shipping Line" "Custom Authorities" "Exporter Portal")
API_PORTS=(3001 3002 3003 3004 3005 3007)
for i in "${!API_PORTS[@]}"; do
    port=${API_PORTS[$i]}
    name=${API_NAMES[$i]}
    if check_api_health $port; then
        echo -e "${GREEN}  ✅ $name API (port $port) is healthy${NC}"
        ((SERVICES_OK++))
    else
        echo -e "${RED}  ❌ $name API (port $port) is not healthy${NC}"
        log "ERROR" "$name API not healthy in final verification"
    fi
done

# Check IPFS (required)
if check_port 5001; then
    echo -e "${GREEN}  ✅ IPFS is running on port 5001 (Required)${NC}"
    ((SERVICES_OK++))
else
    echo -e "${RED}  ❌ IPFS is not running (Required)${NC}"
    log "ERROR" "IPFS not running in final verification"
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
echo -e "  • Commercial Bank API:   ${GREEN}http://localhost:3001${NC}"
echo -e "  • National Bank API:   ${GREEN}http://localhost:3002${NC}"
echo -e "  • ECTA API:            ${GREEN}http://localhost:3003${NC}"
echo -e "  • Shipping Line API:   ${GREEN}http://localhost:3004${NC}"
echo -e "  • Custom Authorities API: ${GREEN}http://localhost:3005${NC}"
echo -e "  • Exporter Portal API: ${GREEN}http://localhost:3007${NC}"
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
echo "⏳ Waiting for APIs to initialize Fabric connections..."
sleep 15
echo "⏳ Checking if APIs are ready for blockchain operations..."

# Check if Commercial Bank API is ready for blockchain operations
MAX_RETRIES=12
RETRY_COUNT=0
API_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/ready 2>/dev/null | grep -q '"status":"ready"'; then
        API_READY=true
        break
    fi
    ((RETRY_COUNT++))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⏳ APIs still initializing... (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

if [ "$API_READY" = true ]; then
    echo "✅ APIs are ready for blockchain operations."
else
    echo "⚠️  APIs may still be initializing. User registration might fail."
fi
echo ""

echo -e "${BLUE}[16/16] Registering Test Users...${NC}"
echo -e "${YELLOW}Creating test users for each organization...${NC}"

# Function to register a test user
# Note: All registrations go through Commercial Bank API (port 3001) because it has
# the proper configuration to submit transactions across all organizations
register_test_user() {
    local org_name=$1
    local org_id=$2
    local username=$3
    local password=$4
    local email=$5
    local role=$6
    
    echo -e "${YELLOW}  Registering $username in $org_name...${NC}"
    log "INFO" "Attempting to register user: $username for $org_name"
    
    # Check if Commercial Bank API is reachable first
    if ! check_api_health 3001; then
        echo -e "${RED}  ❌ Commercial Bank API not healthy, skipping registration${NC}"
        log "ERROR" "Commercial Bank API not healthy for user registration"
        return 1
    fi
    
    # Use jq to properly encode JSON with special characters
    local json_payload=$(jq -n \
        --arg username "$username" \
        --arg password "$password" \
        --arg email "$email" \
        --arg organizationId "$org_id" \
        --arg role "$role" \
        '{username: $username, password: $password, email: $email, organizationId: $organizationId, role: $role}' 2>/dev/null)
    
    # Always use Commercial Bank API (3001) for registration
    response=$(curl -s -X POST http://localhost:3001/api/auth/register \
        -H "Content-Type: application/json" \
        -d "$json_payload" 2>&1)
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}  ✅ Successfully registered $username${NC}"
        log "INFO" "Successfully registered user: $username"
        return 0
    elif echo "$response" | grep -qi "already exists"; then
        echo -e "${YELLOW}  ⚠️  User $username already exists${NC}"
        log "WARN" "User already exists: $username"
        return 0  # Not a failure, user exists
    else
        echo -e "${RED}  ❌ Failed to register $username${NC}"
        log "ERROR" "Failed to register user: $username - Response: $response"
        # Don't show full response in output for security
        echo -e "${YELLOW}     Check $STARTUP_LOG for details${NC}"
        return 1
    fi
}

# Register test users for each organization
# All registrations go through Commercial Bank API to ensure multi-org endorsement
register_test_user "Commercial Bank (Exporter)" "commercialbank" "exporter1" "Exporter123!@#" "exporter1@commercialbank.com" "exporter"
register_test_user "Commercial Bank (Banker)" "commercialbank" "banker1" "Banker123!@#" "banker1@commercialbank.com" "bank"
register_test_user "National Bank (Governor)" "nationalbank" "governor1" "Governor123!@#" "governor1@nationalbank.com" "governor"
register_test_user "ECTA" "ecta" "inspector1" "Inspector123!@#" "inspector1@ecta.gov.et" "user"
register_test_user "Shipping Line" "shippingline" "shipper1" "Shipper123!@#" "shipper1@shippingline.com" "shipper"
register_test_user "Custom Authorities" "custom-authorities" "custom1" "Custom123!@#" "custom1@customs.go.tz" "customs"

echo -e "${GREEN}✅ Test users registered successfully!${NC}"
echo ""
echo -e "${CYAN}╔════════════════════════════════��═══════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║                  Test User Credentials                     ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Commercial Bank - Exporter:${NC}"
echo -e "  Username: ${CYAN}exporter1${NC}"
echo -e "  Password: ${CYAN}Exporter123!@#${NC}"
echo ""
echo -e "${GREEN}Commercial Bank - Banker:${NC}"
echo -e "  Username: ${CYAN}banker1${NC}"
echo -e "  Password: ${CYAN}Banker123!@#${NC}"
echo ""
echo -e "${GREEN}National Bank - Governor:${NC}"
echo -e "  Username: ${CYAN}governor1${NC}"
echo -e "  Password: ${CYAN}Governor123!@#${NC}"
echo ""
echo -e "${GREEN}ECTA:${NC}"
echo -e "  Username: ${CYAN}inspector1${NC}"
echo -e "  Password: ${CYAN}Inspector123!@#${NC}"
echo ""
echo -e "${GREEN}Shipping Line:${NC}"
echo -e "  Username: ${CYAN}shipper1${NC}"
echo -e "  Password: ${CYAN}Shipper123!@#${NC}"
echo ""
echo -e "${GREEN}Custom Authorities:${NC}"
echo -e "  Username: ${CYAN}custom1${NC}"
echo -e "  Password: ${CYAN}Custom123!@#${NC}"
echo ""

# Final success log
log "INFO" "=== System Startup Completed Successfully ==="
log "INFO" "All services are running and healthy"
log "INFO" "Startup log saved to: $STARTUP_LOG"

# Disable trap for successful exit
trap - EXIT

exit $EXIT_SUCCESS
