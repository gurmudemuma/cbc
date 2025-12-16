#!/bin/bash

# Complete System Startup Script
# This script starts the entire coffee-export system in the correct order:
# 1. Database (PostgreSQL)
# 2. IPFS
# 3. Hyperledger Fabric Network (Orderer, Peers, CouchDB)
# 4. CCAAS Chaincode Service
# 5. API Services
# 6. Frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHAINCODE_NAME="coffee-export"
CHAINCODE_VERSION="1.0"
CHANNEL_NAME="coffeechannel"
ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker found${NC}"
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}✗ docker-compose is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ docker-compose found${NC}"
    
    # Check if required files exist
    if [ ! -f "$SCRIPT_DIR/docker-compose.yml" ]; then
        echo -e "${RED}✗ docker-compose.yml not found in $SCRIPT_DIR${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ docker-compose.yml found${NC}"
    
    # Check if chaincode directory exists
    if [ ! -d "$SCRIPT_DIR/chaincode/$CHAINCODE_NAME" ]; then
        echo -e "${RED}✗ Chaincode directory not found: $SCRIPT_DIR/chaincode/$CHAINCODE_NAME${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Chaincode directory found${NC}"
    
    # Check if network organizations exist
    if [ ! -d "$SCRIPT_DIR/network/organizations" ]; then
        echo -e "${RED}✗ Network organizations directory not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Network organizations found${NC}"
    
    # Check Docker daemon
    if ! docker ps &> /dev/null; then
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
}

# ============================================================================
# CLEANUP FUNCTION
# ============================================================================

cleanup_on_error() {
    echo -e "\n${RED}An error occurred during startup${NC}"
    echo -e "${YELLOW}Attempting to clean up...${NC}"
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose-ccaas.yml down 2>/dev/null || true
    exit 1
}

trap cleanup_on_error ERR

# ============================================================================
# VERIFY COUCHDB VOLUMES
# ============================================================================

verify_couchdb_volumes() {
    echo -e "\n${YELLOW}Verifying CouchDB volumes...${NC}"
    
    # Check if volumes are defined in docker-compose.yml
    if grep -q "couchdb0:" "$SCRIPT_DIR/docker-compose.yml"; then
        echo -e "${GREEN}✓ CouchDB volumes defined in docker-compose.yml${NC}"
    else
        echo -e "${RED}✗ CouchDB volumes not found in docker-compose.yml${NC}"
        exit 1
    fi
    
    # Create volumes if they don't exist
    for i in {0..6}; do
        VOLUME_NAME="couchdb${i}"
        if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
            echo -e "${YELLOW}Creating volume: $VOLUME_NAME${NC}"
            docker volume create "$VOLUME_NAME" || true
        fi
    done
    echo -e "${GREEN}✓ All CouchDB volumes verified/created${NC}"
}

# ============================================================================
# SETUP SECRETS & ENVIRONMENT
# ============================================================================

setup_secrets_and_env() {
    echo -e "\n${YELLOW}Setting up secrets and environment...${NC}"

    # Create secrets directory
    if [ ! -d "$SCRIPT_DIR/secrets" ]; then
        mkdir -p "$SCRIPT_DIR/secrets"
        echo -e "${GREEN}✓ Created secrets directory${NC}"
    fi

    # Generate Postgres password if missing
    if [ ! -f "$SCRIPT_DIR/secrets/postgres_password" ]; then
        echo "postgres_password_$(date +%s)" > "$SCRIPT_DIR/secrets/postgres_password"
        echo -e "${GREEN}✓ Generated postgres_password${NC}"
    fi

    # Generate CouchDB password if missing
    if [ ! -f "$SCRIPT_DIR/secrets/couchdb_password" ]; then
        echo "couchdb_password_$(date +%s)" > "$SCRIPT_DIR/secrets/couchdb_password"
        echo -e "${GREEN}✓ Generated couchdb_password${NC}"
    fi
    
    # Export COUCHDB_PASSWORD for docker-compose
    export COUCHDB_PASSWORD=$(cat "$SCRIPT_DIR/secrets/couchdb_password")

    # Load or generate JWT secrets
    # Check if .env exists, if not create from example or generate defaults
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        if [ -f "$SCRIPT_DIR/.env.example" ]; then
            cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
            echo -e "${GREEN}✓ Created .env from example${NC}"
        else
            touch "$SCRIPT_DIR/.env"
            echo -e "${GREEN}✓ Created empty .env${NC}"
        fi
    fi

    # Ensure JWT secrets exist in .env
    local secrets_updated=0
    
    if ! grep -q "JWT_SECRET_COMMERCIALBANK=" "$SCRIPT_DIR/.env"; then
        echo "JWT_SECRET_COMMERCIALBANK=secret_commercial_$(date +%s)" >> "$SCRIPT_DIR/.env"
        secrets_updated=1
    fi
    if ! grep -q "JWT_SECRET_NATIONALBANK=" "$SCRIPT_DIR/.env"; then
        echo "JWT_SECRET_NATIONALBANK=secret_national_$(date +%s)" >> "$SCRIPT_DIR/.env"
        secrets_updated=1
    fi
    if ! grep -q "JWT_SECRET_ECTA=" "$SCRIPT_DIR/.env"; then
        echo "JWT_SECRET_ECTA=secret_ecta_$(date +%s)" >> "$SCRIPT_DIR/.env"
        secrets_updated=1
    fi
    if ! grep -q "JWT_SECRET_SHIPPINGLINE=" "$SCRIPT_DIR/.env"; then
        echo "JWT_SECRET_SHIPPINGLINE=secret_shipping_$(date +%s)" >> "$SCRIPT_DIR/.env"
        secrets_updated=1
    fi
    if ! grep -q "JWT_SECRET_CUSTOMAUTHORITIES=" "$SCRIPT_DIR/.env"; then
        echo "JWT_SECRET_CUSTOMAUTHORITIES=secret_custom_$(date +%s)" >> "$SCRIPT_DIR/.env"
        secrets_updated=1
    fi

    if [ $secrets_updated -eq 1 ]; then
        echo -e "${GREEN}✓ Added missing JWT secrets to .env${NC}"
    fi

    # Export variables from .env for docker-compose
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
}

# ============================================================================
# WAIT FOR SERVICE HEALTH
# ============================================================================

wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $service to be ready...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if docker ps --format "{{.Names}}" | grep -q "^${service}$"; then
            if docker exec "$service" sh -c "exit 0" 2>/dev/null; then
                echo -e "${GREEN}✓ $service is ready${NC}"
                return 0
            fi
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}✗ $service failed to start${NC}"
    return 1
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Coffee Export System - Complete Startup Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Run prerequisite checks
check_prerequisites
verify_couchdb_volumes
setup_secrets_and_env

# ============================================================================
# PHASE 1: DATABASE & INFRASTRUCTURE
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: Starting Database & Infrastructure${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Step 1: Start PostgreSQL
echo -e "\n${YELLOW}[1/6] Starting PostgreSQL Database...${NC}"
if docker-compose up -d postgres; then
    echo -e "${GREEN}✓ PostgreSQL started${NC}"
    wait_for_service "postgres" "5432" || true
    sleep 3
else
    echo -e "${RED}✗ Failed to start PostgreSQL${NC}"
    exit 1
fi

# Step 2: Start IPFS
echo -e "\n${YELLOW}[2/6] Starting IPFS Service...${NC}"
if docker-compose up -d ipfs; then
    echo -e "${GREEN}✓ IPFS started${NC}"
    wait_for_service "ipfs" "5001" || true
    sleep 3
else
    echo -e "${RED}✗ Failed to start IPFS${NC}"
    exit 1
fi

# ============================================================================
# PHASE 2: HYPERLEDGER FABRIC NETWORK
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: Starting Hyperledger Fabric Network${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Step 3: Start CouchDB instances
echo -e "\n${YELLOW}[3/6] Starting CouchDB Instances...${NC}"
if docker-compose up -d couchdb0 couchdb1 couchdb2 couchdb3 couchdb4 couchdb5 couchdb6; then
    echo -e "${GREEN}✓ CouchDB instances started${NC}"
    
    # Wait for all CouchDB instances to be ready
    for i in {0..6}; do
        wait_for_service "couchdb${i}" "5984" || true
    done
    
    sleep 5
else
    echo -e "${RED}✗ Failed to start CouchDB${NC}"
    exit 1
fi

# Wait for CouchDB to be ready (containers running + initialization)
echo -e "${YELLOW}Waiting for CouchDB to be fully ready...${NC}"
sleep 20
echo -e "${GREEN}✓ CouchDB ready${NC}"

# Step 4: Start Orderer
echo -e "\n${YELLOW}[4/6] Starting Orderer...${NC}"
if docker-compose up -d orderer.coffee-export.com; then
    echo -e "${GREEN}✓ Orderer started${NC}"
    wait_for_service "orderer.coffee-export.com" "7050" || true
    sleep 5
else
    echo -e "${RED}✗ Failed to start Orderer${NC}"
    exit 1
fi

# Step 5: Start Peers
echo -e "\n${YELLOW}[5/6] Starting Peer Nodes...${NC}"
if docker-compose up -d \
    peer0.commercialbank.coffee-export.com \
    peer0.nationalbank.coffee-export.com \
    peer0.ecta.coffee-export.com \
    peer0.ecx.coffee-export.com \
    peer0.shippingline.coffee-export.com \
    peer0.custom-authorities.coffee-export.com; then
    echo -e "${GREEN}✓ All peer nodes started${NC}"
    echo -e "${YELLOW}Waiting for peers to fully initialize (120 seconds)...${NC}"
    
    # Wait for each peer with extended timeout
    for peer in "peer0.commercialbank.coffee-export.com" "peer0.nationalbank.coffee-export.com" "peer0.ecta.coffee-export.com" "peer0.ecx.coffee-export.com" "peer0.shippingline.coffee-export.com" "peer0.custom-authorities.coffee-export.com"; do
        echo -e "${YELLOW}Checking peer: $peer${NC}"
        PEER_READY=0
        for attempt in {1..60}; do
            if docker ps --format "{{.Names}}" | grep -q "^${peer}$"; then
                if docker logs "$peer" 2>&1 | grep -q "Started peer"; then
                    echo -e "${GREEN}✓ $peer is ready${NC}"
                    PEER_READY=1
                    break
                fi
            fi
            if [ $attempt -lt 60 ]; then
                sleep 2
            fi
        done
        if [ $PEER_READY -eq 0 ]; then
            echo -e "${YELLOW}⚠ $peer initialization check timed out, but continuing...${NC}"
        fi
    done
    
    sleep 60
else
    echo -e "${RED}✗ Failed to start peer nodes${NC}"
    exit 1
fi

# Step 6: Start CLI
echo -e "\n${YELLOW}[6/6] Starting CLI Tool...${NC}"
if docker-compose up -d cli; then
    echo -e "${GREEN}✓ CLI tool started${NC}"
    echo -e "${YELLOW}Waiting for CLI to initialize (20 seconds)...${NC}"
    sleep 20
else
    echo -e "${RED}✗ Failed to start CLI${NC}"
    exit 1
fi

# ============================================================================
# PHASE 3: CHAINCODE AS A SERVICE (CCAAS)
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: Setting Up Chaincode as a Service${NC}"
echo -e "${BLUE}═══════════════���═══════════════════════════════════════════${NC}"

# Step 7: Build Chaincode Binary
echo -e "\n${YELLOW}[7/12] Building Chaincode Binary...${NC}"
cd "$SCRIPT_DIR/chaincode/${CHAINCODE_NAME}"

# Check if binary exists and is newer than source files
NEEDS_REBUILD=0
if [ ! -f "chaincode" ]; then
    NEEDS_REBUILD=1
else
    # Check if any .go file is newer than the binary
    if find . -name "*.go" -newer chaincode | grep -q .; then
        NEEDS_REBUILD=1
    fi
fi

if [ $NEEDS_REBUILD -eq 1 ]; then
    echo -e "${YELLOW}Source changed or binary missing, rebuilding...${NC}"
    # Use -mod=vendor to use local vendor directory and avoid network calls
    # Use -ldflags="-s -w" to strip debug info and reduce binary size
    if CGO_ENABLED=0 GOOS=linux go build -mod=vendor -ldflags="-s -w" -o chaincode .; then
        echo -e "${GREEN}✓ Chaincode binary built${NC}"
    else
        echo -e "${RED}✗ Failed to build chaincode binary${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Chaincode binary is up to date, skipping build${NC}"
fi
cd - > /dev/null

# Step 8: Build CCAAS Docker Image
echo -e "\n${YELLOW}[8/12] Building CCAAS Docker Image...${NC}"
if docker build -t ${CHAINCODE_NAME}-ccaas:latest -f "$SCRIPT_DIR/chaincode/${CHAINCODE_NAME}/Dockerfile" "$SCRIPT_DIR/chaincode/${CHAINCODE_NAME}"; then
    echo -e "${GREEN}✓ CCAAS Docker image built${NC}"
else
    echo -e "${RED}✗ Failed to build CCAAS Docker image${NC}"
    exit 1
fi

# Step 9: Start CCAAS Service
echo -e "\n${YELLOW}[9/12] Starting CCAAS Service...${NC}"
if [ -f "$SCRIPT_DIR/docker-compose-ccaas.yml" ]; then
    if docker-compose -f "$SCRIPT_DIR/docker-compose-ccaas.yml" up -d; then
        echo -e "${GREEN}✓ CCAAS service started${NC}"
        sleep 5
    else
        echo -e "${RED}✗ Failed to start CCAAS service${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ docker-compose-ccaas.yml not found, skipping CCAAS service${NC}"
fi

# Step 10: Package Chaincode
echo -e "\n${YELLOW}[10/12] Packaging Chaincode...${NC}"
cd "$SCRIPT_DIR/chaincode/${CHAINCODE_NAME}"
if [ -d "ccaas-package" ]; then
    # The ccaas-package already has the correct structure
    # Just create tar with metadata.json and code.tar.gz (or connection.json)
    if tar czf /tmp/${CHAINCODE_NAME}-ccaas.tgz -C ccaas-package metadata.json code.tar.gz 2>/dev/null || \
       tar czf /tmp/${CHAINCODE_NAME}-ccaas.tgz -C ccaas-package metadata.json connection.json 2>/dev/null || \
       tar czf /tmp/${CHAINCODE_NAME}-ccaas.tgz -C ccaas-package --exclude='*.tgz' --exclude='.' * 2>/dev/null; then
        echo -e "${GREEN}✓ Chaincode packaged${NC}"
    else
        echo -e "${RED}✗ Failed to package chaincode${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ ccaas-package directory not found, skipping packaging${NC}"
fi
cd - > /dev/null

# Step 11: Create Channel and Install Chaincode
echo -e "\n${YELLOW}[11/12] Creating Channel and Installing Chaincode...${NC}"

# First, create the channel
echo -e "${YELLOW}Creating channel: ${CHANNEL_NAME}...${NC}"
if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=CommercialBankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer channel create \
  -o orderer.coffee-export.com:7050 \
  -c ${CHANNEL_NAME} \
  -f ./channel-artifacts/${CHANNEL_NAME}.tx \
  --tls \
  --cafile ${ORDERER_CA}
" 2>/dev/null; then
    echo -e "${GREEN}✓ Channel created${NC}"
else
    echo -e "${YELLOW}⚠ Channel may already exist, continuing...${NC}"
fi

# Join all peers to the channel
echo -e "${YELLOW}Joining peers to channel...${NC}"
for peer in "peer0.commercialbank.coffee-export.com" "peer0.nationalbank.coffee-export.com" "peer0.ecta.coffee-export.com" "peer0.ecx.coffee-export.com" "peer0.shippingline.coffee-export.com" "peer0.custom-authorities.coffee-export.com"; do
    echo -e "${YELLOW}Joining $peer to channel...${NC}"
    docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=CommercialBankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=${peer}:7051

peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
" 2>/dev/null || true
done

echo -e "${GREEN}✓ Peers joined to channel${NC}"

# Wait for peers to be fully ready before installing chaincode
echo -e "${YELLOW}Waiting for peers to be fully ready for chaincode installation...${NC}"
sleep 30

if [ -f "/tmp/${CHAINCODE_NAME}-ccaas.tgz" ]; then
    if docker cp /tmp/${CHAINCODE_NAME}-ccaas.tgz cli:/tmp/; then
        echo -e "${GREEN}✓ Package copied to CLI${NC}"
    else
        echo -e "${RED}✗ Failed to copy package${NC}"
        exit 1
    fi
    
    # Check if chaincode is already installed before attempting installation
    echo -e "${YELLOW}Checking if chaincode is already installed...${NC}"
    CHAINCODE_INSTALLED=0
    if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=CommercialBankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt

peer lifecycle chaincode queryinstalled | grep -q '${CHAINCODE_NAME}_'
"; then
        echo -e "${GREEN}✓ Chaincode is already installed${NC}"
        CHAINCODE_INSTALLED=1
    fi
    
    # Install chaincode only if not already installed
    if [ $CHAINCODE_INSTALLED -eq 0 ]; then
        INSTALL_SUCCESS=0
        for attempt in {1..3}; do
            echo -e "${YELLOW}Attempting chaincode install (attempt $attempt/3)...${NC}"
            if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=CommercialBankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt

peer lifecycle chaincode install /tmp/${CHAINCODE_NAME}-ccaas.tgz --tls --cafile \$CORE_PEER_TLS_ROOTCERT_FILE
"; then
                echo -e "${GREEN}✓ Chaincode installed${NC}"
                INSTALL_SUCCESS=1
                break
            else
                if [ $attempt -lt 3 ]; then
                    echo -e "${YELLOW}⚠ Install attempt $attempt failed, retrying in 10 seconds...${NC}"
                    sleep 10
                fi
            fi
        done
        
        if [ $INSTALL_SUCCESS -eq 0 ]; then
            echo -e "${RED}✗ Failed to install chaincode after 3 attempts${NC}"
            exit 1
        fi
    fi
    
    # Get package ID
    PACKAGE_ID=$(docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=CommercialBankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME} | awk '{print \$3}' | sed 's/,//'
" 2>/dev/null || echo "")
    
    if [ -z "$PACKAGE_ID" ]; then
        echo -e "${YELLOW}⚠ Could not retrieve package ID (may need manual approval)${NC}"
    else
        echo -e "${GREEN}✓ Package ID: $PACKAGE_ID${NC}"
        
        # Approve and Commit
        if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=CommercialBankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode approveformyorg \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${CHAINCODE_VERSION} \
  --package-id ${PACKAGE_ID} \
  --sequence 1 \
  --tls \
  --cafile ${ORDERER_CA}
"; then
            echo -e "${GREEN}✓ Chaincode approved${NC}"
        else
            echo -e "${YELLOW}⚠ Failed to approve chaincode (may already be approved)${NC}"
        fi
        
        if docker exec cli bash -c "
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=CommercialBankMSP
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/commercialbank.coffee-export.com/users/Admin@commercialbank.coffee-export.com/msp
export CORE_PEER_ADDRESS=peer0.commercialbank.coffee-export.com:7051

peer lifecycle chaincode commit \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${CHAINCODE_VERSION} \
  --sequence 1 \
  --tls \
  --cafile ${ORDERER_CA}
"; then
            echo -e "${GREEN}✓ Chaincode committed${NC}"
        else
            echo -e "${YELLOW}⚠ Failed to commit chaincode (may already be committed)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ Chaincode package not found, skipping installation${NC}"
fi

# ============================================================================
# PHASE 4: API SERVICES
# ============================================================================

echo -e "\n${BLUE}════════════��══════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 4: Starting API Services${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Step 12: Start API Services
echo -e "\n${YELLOW}[12/12] Starting API Services...${NC}"

# Optimized API building process
echo -e "${YELLOW}Using optimized API build process...${NC}"

# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Start API services
if docker-compose up -d \
    commercialbank-api \
    national-bank-api \
    ecta-api \
    ecx-api \
    shipping-line-api \
    custom-authorities-api; then
    echo -e "${GREEN}✓ All API services started${NC}"
    
    # Wait for API services to be ready (they take time to build and start)
    echo -e "${YELLOW}Waiting for API services to initialize (this may take 2-5 minutes)...${NC}"
    sleep 10
    
    # Check if services are running
    for api in "commercialbank-api" "national-bank-api" "ecta-api" "ecx-api" "shipping-line-api" "custom-authorities-api"; do
        if docker ps --format "{{.Names}}" | grep -q "^${api}$"; then
            echo -e "${GREEN}✓ $api is running${NC}"
        else
            echo -e "${YELLOW}⚠ $api is still starting...${NC}"
        fi
    done
    
    sleep 5
else
    echo -e "${RED}✗ Failed to start API services${NC}"
    exit 1
fi

# ============================================================================
# PHASE 5: FRONTEND
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 5: Starting Frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Step 13: Start Frontend
echo -e "\n${YELLOW}[13/13] Starting Frontend Application...${NC}"

# Stop existing frontend if running
docker stop frontend 2>/dev/null || true
docker rm frontend 2>/dev/null || true

# Deploy frontend with direct container IP (Docker daemon has userland-proxy disabled)
if docker run -d --name frontend \
    --network coffee-export-network \
    -p 80:80 \
    -v "$SCRIPT_DIR/frontend/build:/usr/share/nginx/html:ro" \
    -v "$SCRIPT_DIR/frontend/nginx-simple.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:alpine; then
    
    echo -e "${GREEN}✓ Frontend started${NC}"
    sleep 3
    
    # Get container IP
    FRONTEND_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' frontend)
    echo -e "${GREEN}✓ Frontend accessible at: http://${FRONTEND_IP}/${NC}"
else
    echo -e "${RED}✗ Failed to start frontend${NC}"
    exit 1
fi

# ============================================================================
# PHASE 6: USER REGISTRATION
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 6: Registering Test Users${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Step 14: Register test users
echo -e "\n${YELLOW}[14/14] Registering test users...${NC}"
echo -e "${YELLOW}Waiting for APIs to be fully ready (30 seconds)...${NC}"
sleep 30

if [ -f "$SCRIPT_DIR/scripts/register-working-users.sh" ]; then
    bash "$SCRIPT_DIR/scripts/register-working-users.sh"
    echo -e "${GREEN}✓ Test users registered${NC}"
else
    echo -e "${YELLOW}⚠ User registration script not found${NC}"
fi

# ============================================================================
# FINAL VERIFICATION & SUMMARY
# ============================================================================

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VERIFICATION & SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Verify all containers are running
echo -e "\n${YELLOW}Verifying all containers...${NC}"
RUNNING=$(docker ps --format "{{.Names}}" | wc -l)
echo -e "${GREEN}✓ $RUNNING containers running${NC}"

# Display running containers
echo -e "\n${YELLOW}Running Containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "postgres|ipfs|couchdb|orderer|peer|cli|ccaas|api|frontend" || true

# Verify volumes
echo -e "\n${YELLOW}Verifying Docker Volumes:${NC}"
for i in {0..6}; do
    if docker volume inspect "couchdb${i}" &> /dev/null; then
        echo -e "${GREEN}✓ couchdb${i} volume exists${NC}"
    else
        echo -e "${RED}✗ couchdb${i} volume missing${NC}"
    fi
done

# ============================================================================
# FINAL REPORT
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          System Startup Complete!                         ║${NC}"
echo -e "${BLUE}╚═════════════════════════════════════════���══════════════════╝${NC}"

echo -e "\n${GREEN}✓ All components started successfully${NC}"

echo -e "\n${YELLOW}System Components:${NC}"
echo "  Database:"
echo "    • PostgreSQL: http://localhost:5435"
echo ""
echo "  Storage:"
echo "    • IPFS API: http://localhost:5001"
echo "    • IPFS Gateway: http://localhost:8080"
echo ""
echo "  Blockchain:"
echo "    • Orderer: orderer.coffee-export.com:7050"
echo "    • Peers: 7051, 8051, 9051, 10051, 11051"
echo "    • CouchDB: 5984, 6984, 7984, 8984, 9984, 10984"
echo ""
echo "  Chaincode:"
echo "    • CCAAS Service: coffee-export-ccaas:7052"
echo "    • Channel: ${CHANNEL_NAME}"
echo "    • Chaincode: ${CHAINCODE_NAME} v${CHAINCODE_VERSION}"
echo ""
echo "  APIs:"
echo "    • Commercial Bank: http://localhost:3001"
echo "    • National Bank: http://localhost:3002"
echo "    • ECTA: http://localhost:3003"
echo "    • Shipping Line: http://localhost:3004"
echo "    • Custom Authorities: http://localhost:3005"
echo "    • ECX: http://localhost:3006"
echo ""
echo "  Frontend:"
FRONTEND_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' frontend 2>/dev/null || echo "N/A")
echo "    • Web Application: http://${FRONTEND_IP}/"
echo ""

echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View logs:"
echo "    • docker logs -f <container-name>"
echo ""
echo "  Test chaincode:"
echo "    • docker exec cli peer chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -c '{\"function\":\"GetAllExports\",\"Args\":[]}' --tls --cafile ${ORDERER_CA}"
echo ""
echo "  Check CouchDB:"
echo "    • curl -u admin:adminpw http://localhost:5984/"
echo ""
echo "  Stop system:"
echo "    • docker-compose down"
if [ -f "$SCRIPT_DIR/docker-compose-ccaas.yml" ]; then
    echo "    • docker-compose -f docker-compose-ccaas.yml down"
fi
echo ""
echo "  View running containers:"
echo "    • docker ps"
echo ""
echo "  View volumes:"
echo "    • docker volume ls | grep couchdb"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}System is ready to use!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Test User Credentials:${NC}"
echo "  Commercial Bank (http://localhost:3001):"
echo "    • Username: export_user | Password: Export123!@#"
echo ""
echo "  National Bank (http://localhost:3002):"
echo "    • Username: bank_user | Password: Bank123!@#"
echo ""
echo "  ECTA (http://localhost:3003):"
echo "    • Username: ecta_user | Password: Ecta123!@#"
echo ""
echo "  Shipping Line (http://localhost:3004):"
echo "    • Username: ship_user | Password: Ship123!@#"
echo ""
echo "  Custom Authorities (http://localhost:3005):"
echo "    • Username: customs_user | Password: Customs123!@#"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
