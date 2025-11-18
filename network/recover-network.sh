#!/bin/bash

# Automated network recovery script
# Handles common Fabric network issues and recovers to working state

set -e

CHANNEL_NAME="${1:-coffeechannel}"
VERBOSE="${2:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Check network status
check_network_status() {
    log_info "Checking network status..."
    
    RUNNING=$(docker ps --filter "label=service=hyperledger-fabric" --format "{{.Names}}" | wc -l)
    TOTAL=$(docker ps -a --filter "label=service=hyperledger-fabric" --format "{{.Names}}" | wc -l)
    
    echo "  Running: $RUNNING / Total: $TOTAL"
    
    if [ "$RUNNING" -lt 6 ]; then
        log_warning "Not all containers are running"
        return 1
    fi
    
    log_success "All containers are running"
    return 0
}

# Start network if not running
start_network() {
    log_info "Starting network..."
    
    if ! check_network_status; then
        log_info "Bringing up network..."
        IMAGE_TAG=latest docker compose -f docker/docker-compose.yaml up -d
        
        log_info "Waiting for containers to stabilize (30 seconds)..."
        sleep 30
        
        if check_network_status; then
            log_success "Network started successfully"
        else
            log_error "Failed to start network"
            return 1
        fi
    fi
    
    return 0
}

# Wait for orderer to be ready
wait_for_orderer() {
    log_info "Waiting for orderer to initialize..."
    
    local COUNTER=0
    local MAX_WAIT=60
    
    while [ $COUNTER -lt $MAX_WAIT ]; do
        if docker logs orderer.coffee-export.com 2>/dev/null | grep -q "Starting orderer\|Orderer started\|Raft leader"; then
            log_success "Orderer is ready"
            return 0
        fi
        
        COUNTER=$((COUNTER + 1))
        if [ $((COUNTER % 10)) -eq 0 ]; then
            echo "  Waiting... ($COUNTER/$MAX_WAIT seconds)"
        fi
        sleep 1
    done
    
    log_warning "Orderer initialization timeout (may still be initializing)"
    return 0
}

# Clean channel artifacts
clean_artifacts() {
    log_info "Cleaning channel artifacts..."
    
    rm -f channel-artifacts/*.block 2>/dev/null || true
    rm -f channel-artifacts/*.tx 2>/dev/null || true
    rm -f config_block.pb 2>/dev/null || true
    rm -f config_update.pb 2>/dev/null || true
    rm -f modified_config.pb 2>/dev/null || true
    rm -f original_config.pb 2>/dev/null || true
    rm -f channel-creation.log 2>/dev/null || true
    rm -f channel-join.log 2>/dev/null || true
    
    log_success "Artifacts cleaned"
}

# Create channel
create_channel() {
    log_info "Creating channel '$CHANNEL_NAME'..."
    
    # Source environment
    . scripts/envVar.sh
    
    # Find configtxgen
    CONFIGTXGEN_CMD=""
    if command -v configtxgen.exe &> /dev/null; then
        CONFIGTXGEN_CMD="configtxgen.exe"
    elif command -v configtxgen &> /dev/null; then
        CONFIGTXGEN_CMD="configtxgen"
    else
        if [ -x "${PWD}/../bin/configtxgen.exe" ]; then
            CONFIGTXGEN_CMD="${PWD}/../bin/configtxgen.exe"
        elif [ -x "${PWD}/../bin/configtxgen" ]; then
            CONFIGTXGEN_CMD="${PWD}/../bin/configtxgen"
        fi
    fi
    
    if [ -z "$CONFIGTXGEN_CMD" ]; then
        log_error "configtxgen tool not found"
        return 1
    fi
    
    # Create channel artifacts directory
    mkdir -p channel-artifacts
    
    # Generate genesis block
    log_info "Generating genesis block..."
    export FABRIC_CFG_PATH=$PWD/configtx
    
    if ! $CONFIGTXGEN_CMD -profile CoffeeExportGenesis \
        -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block \
        -channelID $CHANNEL_NAME 2>&1 | grep -v "^$"; then
        log_error "Failed to generate genesis block"
        return 1
    fi
    
    if [ ! -f "channel-artifacts/${CHANNEL_NAME}.block" ]; then
        log_error "Genesis block not created"
        return 1
    fi
    
    log_success "Genesis block created"
    
    # Create channel on orderer
    log_info "Creating channel on orderer..."
    
    local COUNTER=0
    local MAX_RETRY=5
    
    while [ $COUNTER -lt $MAX_RETRY ]; do
        COUNTER=$((COUNTER + 1))
        
        if MSYS_NO_PATHCONV=1 docker exec cli osnadmin channel join \
            --channelID $CHANNEL_NAME \
            --config-block //opt//gopath//src//github.com//hyperledger//fabric//peer//channel-artifacts//${CHANNEL_NAME}.block \
            -o orderer.coffee-export.com:7053 \
            --ca-file //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//msp//tlscacerts//tlsca.coffee-export.com-cert.pem \
            --client-cert //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.crt \
            --client-key //opt//gopath//src//github.com//hyperledger//fabric//peer//organizations//ordererOrganizations//coffee-export.com//orderers//orderer.coffee-export.com//tls//server.key 2>&1 | tee -a channel-creation.log; then
            log_success "Channel created on orderer"
            return 0
        fi
        
        if [ $COUNTER -lt $MAX_RETRY ]; then
            log_warning "Attempt $COUNTER failed, retrying in 3 seconds..."
            sleep 3
        fi
    done
    
    log_error "Failed to create channel after $MAX_RETRY attempts"
    return 1
}

# Join peers to channel
join_peers() {
    log_info "Joining peers to channel..."
    
    . scripts/envVar.sh
    export FABRIC_CFG_PATH=$PWD/../config/
    
    # Find peer command
    PEER_CMD=""
    if command -v peer.exe &> /dev/null; then
        PEER_CMD="peer.exe"
    elif command -v peer &> /dev/null; then
        PEER_CMD="peer"
    else
        if [ -x "${PWD}/../bin/peer.exe" ]; then
            PEER_CMD="${PWD}/../bin/peer.exe"
        elif [ -x "${PWD}/../bin/peer" ]; then
            PEER_CMD="${PWD}/../bin/peer"
        fi
    fi
    
    if [ -z "$PEER_CMD" ]; then
        log_error "peer tool not found"
        return 1
    fi
    
    local BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"
    
    # Join each peer
    local PEERS=(1 2 3 4 5)
    local ORG_NAMES=("commercialbank" "NationalBank" "ECTA" "ShippingLine" "CustomAuthorities")
    
    for i in "${!PEERS[@]}"; do
        local ORG=${PEERS[$i]}
        local ORG_NAME=${ORG_NAMES[$i]}
        
        log_info "Joining $ORG_NAME peer..."
        setGlobals $ORG
        
        local COUNTER=0
        local MAX_RETRY=3
        
        while [ $COUNTER -lt $MAX_RETRY ]; do
            COUNTER=$((COUNTER + 1))
            
            if $PEER_CMD channel join -b $BLOCKFILE 2>&1 | tee -a channel-join.log; then
                log_success "$ORG_NAME joined"
                break
            fi
            
            if [ $COUNTER -lt $MAX_RETRY ]; then
                log_warning "Attempt $COUNTER failed, retrying..."
                sleep 2
            fi
        done
        
        if [ $COUNTER -eq $MAX_RETRY ]; then
            log_warning "Failed to join $ORG_NAME after $MAX_RETRY attempts"
        fi
    done
    
    log_success "Peer joining completed"
}

# Verify channel
verify_channel() {
    log_info "Verifying channel..."
    
    # Check channel exists on orderer
    if docker exec cli osnadmin channel list \
        -o orderer.coffee-export.com:7053 \
        --ca-file organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
        --client-cert organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt \
        --client-key organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key 2>&1 | grep -q "$CHANNEL_NAME"; then
        log_success "Channel exists on orderer"
    else
        log_warning "Could not verify channel on orderer"
    fi
}

# Main recovery flow
main() {
    echo ""
    echo "=========================================="
    echo "Hyperledger Fabric Network Recovery"
    echo "=========================================="
    echo "Channel: $CHANNEL_NAME"
    echo ""
    
    check_prerequisites
    
    if ! start_network; then
        log_error "Failed to start network"
        exit 1
    fi
    
    wait_for_orderer
    
    clean_artifacts
    
    if ! create_channel; then
        log_error "Failed to create channel"
        exit 1
    fi
    
    if ! join_peers; then
        log_error "Failed to join peers"
        exit 1
    fi
    
    verify_channel
    
    echo ""
    echo "=========================================="
    log_success "Network recovery completed!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Deploy chaincode: ./network.sh deployCC"
    echo "2. Start API: cd ../api && npm start"
    echo "3. Start Frontend: cd ../frontend && npm run dev"
    echo ""
}

# Run main
main
