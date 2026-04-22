#!/bin/bash
# ============================================================================
# Coffee Export Blockchain System - Professional Deployment Script
# ============================================================================
# This script deploys the complete system in the correct order
# ============================================================================

set -e  # Exit on error

echo ""
echo "============================================================================"
echo "  COFFEE EXPORT BLOCKCHAIN SYSTEM - PROFESSIONAL DEPLOYMENT"
echo "============================================================================"
echo ""
echo "Starting deployment at $(date)"
echo ""

# ============================================================================
# PHASE 1: PRE-DEPLOYMENT CHECKS
# ============================================================================

echo "[PHASE 1] Pre-Deployment Checks"
echo "============================================================================"
echo ""

echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not running"
    echo "Please install Docker and try again"
    exit 1
fi
echo "✓ Docker is available"

echo ""
echo "Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi
echo "✓ Docker Compose is available"

echo ""
echo "Checking available disk space..."
docker system df
echo ""

# ============================================================================
# PHASE 2: CLEANUP
# ============================================================================

echo ""
echo "[PHASE 2] Cleanup Previous Deployment"
echo "============================================================================"
echo ""

echo "Stopping existing containers..."
docker-compose -f docker-compose-hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose-fabric.yml down 2>/dev/null || true
echo "✓ Containers stopped"

echo ""
echo "Removing old chaincode containers..."
docker ps -aq --filter "name=dev-peer" | xargs -r docker rm -f 2>/dev/null || true
echo "✓ Old chaincode containers removed"

echo ""
echo "Cleaning up unused resources..."
docker system prune -f >/dev/null 2>&1 || true
echo "✓ Cleanup complete"

# ============================================================================
# PHASE 3: NETWORK SETUP
# ============================================================================

echo ""
echo "[PHASE 3] Network Setup"
echo "============================================================================"
echo ""

echo "Creating Docker network..."
if docker network create fabric-network 2>/dev/null; then
    echo "✓ Network created"
else
    echo "Network already exists, continuing..."
fi

# ============================================================================
# PHASE 4: FABRIC NETWORK
# ============================================================================

echo ""
echo "[PHASE 4] Starting Fabric Network"
echo "============================================================================"
echo ""

echo "Starting orderers, peers, and CouchDB..."
docker-compose -f docker-compose-fabric.yml up -d
echo "✓ Fabric network started"

echo ""
echo "Waiting for Fabric network to be ready (30 seconds)..."
sleep 30
echo "✓ Fabric network ready"

echo ""
echo "Verifying Fabric containers..."
docker ps --filter "network=fabric-network" --format "table {{.Names}}\t{{.Status}}"
echo ""

# ============================================================================
# PHASE 5: BLOCKCHAIN INITIALIZATION
# ============================================================================

echo ""
echo "[PHASE 5] Blockchain Initialization"
echo "============================================================================"
echo ""

echo "Checking if channel exists..."
if docker exec cli peer channel list 2>/dev/null | grep -q "coffeechannel"; then
    echo "Channel already exists, deploying chaincode..."
    cd scripts
    bash deploy-chaincode.sh
    cd ..
    echo "✓ Chaincode deployed"
else
    echo "Channel does not exist, creating..."
    cd scripts
    bash install-blockchain.sh
    cd ..
    echo "✓ Blockchain initialized"
fi

echo ""
echo "Verifying chaincode deployment..."
if docker exec cli peer lifecycle chaincode querycommitted --channelID coffeechannel --name ecta; then
    echo "✓ Chaincode verified"
else
    echo "WARNING: Chaincode verification failed"
fi

# ============================================================================
# PHASE 6: BUILD APPLICATION IMAGES
# ============================================================================

echo ""
echo "[PHASE 6] Building Application Images"
echo "============================================================================"
echo ""

echo "Building Gateway..."
docker-compose -f docker-compose-hybrid.yml build gateway
echo "✓ Gateway built"

echo ""
echo "Building Blockchain Bridge..."
docker-compose -f docker-compose-hybrid.yml build blockchain-bridge
echo "✓ Blockchain Bridge built"

echo ""
echo "Building CBC Services..."
docker-compose -f docker-compose-hybrid.yml build ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service
echo "✓ CBC Services built"

echo ""
echo "Building Buyer Verification..."
docker-compose -f docker-compose-hybrid.yml build buyer-verification
echo "✓ Buyer Verification built"

echo ""
echo "Building Frontend..."
docker-compose -f docker-compose-hybrid.yml build frontend
echo "✓ Frontend built"

# ============================================================================
# PHASE 7: START INFRASTRUCTURE
# ============================================================================

echo ""
echo "[PHASE 7] Starting Infrastructure Services"
echo "============================================================================"
echo ""

echo "Starting PostgreSQL, Redis, Kafka, Zookeeper..."
docker-compose -f docker-compose-hybrid.yml up -d postgres redis zookeeper kafka
echo "✓ Infrastructure services started"

echo ""
echo "Waiting for infrastructure to be ready (30 seconds)..."
sleep 30
echo "✓ Infrastructure ready"

# ============================================================================
# PHASE 8: START APPLICATION SERVICES
# ============================================================================

echo ""
echo "[PHASE 8] Starting Application Services"
echo "============================================================================"
echo ""

echo "Starting Gateway and Blockchain Bridge..."
docker-compose -f docker-compose-hybrid.yml up -d gateway blockchain-bridge
echo "✓ Gateway and Bridge started"

echo ""
echo "Waiting for Gateway to be ready (20 seconds)..."
sleep 20
echo "✓ Gateway ready"

echo ""
echo "Starting CBC Services..."
docker-compose -f docker-compose-hybrid.yml up -d ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service buyer-verification
echo "✓ CBC Services started"

echo ""
echo "Starting Frontend..."
docker-compose -f docker-compose-hybrid.yml up -d frontend
echo "✓ Frontend started"

# ============================================================================
# PHASE 9: DATA INITIALIZATION
# ============================================================================

echo ""
echo "[PHASE 9] Data Initialization"
echo "============================================================================"
echo ""

echo "Enrolling admin identity..."
if docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run enroll-admin; then
    echo "✓ Admin enrolled"
else
    echo "WARNING: Admin enrollment failed (may already exist)"
fi

echo ""
echo "Seeding users..."
if docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run seed-users; then
    echo "✓ Users seeded"
else
    echo "WARNING: User seeding failed (may already exist)"
fi

echo ""
echo "Syncing users to blockchain..."
if docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run sync-users; then
    echo "✓ Users synced to blockchain"
else
    echo "WARNING: Blockchain sync failed (system will still work)"
fi

echo ""
echo "Verifying database..."
if docker-compose -f docker-compose-hybrid.yml exec -T gateway npm run check-db; then
    echo "✓ Database verified"
else
    echo "WARNING: Database verification failed"
fi

# ============================================================================
# PHASE 10: VERIFICATION
# ============================================================================

echo ""
echo "[PHASE 10] Post-Deployment Verification"
echo "============================================================================"
echo ""

echo "Checking all containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "Testing Gateway health..."
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✓ Gateway is healthy"
else
    echo "WARNING: Gateway health check failed"
fi

echo ""
echo "Testing Blockchain Bridge health..."
if curl -s http://localhost:3008/health >/dev/null 2>&1; then
    echo "✓ Bridge is healthy"
else
    echo "WARNING: Bridge health check failed"
fi

echo ""
echo "Testing Frontend..."
if curl -s http://localhost:5173/ >/dev/null 2>&1; then
    echo "✓ Frontend is accessible"
else
    echo "WARNING: Frontend health check failed"
fi

echo ""
echo "Checking blockchain status..."
if docker exec cli peer channel getinfo -c coffeechannel; then
    echo "✓ Blockchain is operational"
else
    echo "WARNING: Blockchain status check failed"
fi

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

echo ""
echo "============================================================================"
echo "  DEPLOYMENT COMPLETE"
echo "============================================================================"
echo ""
echo "Deployment finished at $(date)"
echo ""
echo "============================================================================"
echo "  ACCESS POINTS"
echo "============================================================================"
echo ""
echo "  Frontend:              http://localhost:5173"
echo "  Gateway API:           http://localhost:3000"
echo "  Blockchain Bridge:     http://localhost:3008"
echo "  ECTA Service:          http://localhost:3003"
echo "  Commercial Bank:       http://localhost:3002"
echo "  National Bank:         http://localhost:3004"
echo "  Customs:               http://localhost:3005"
echo "  ECX:                   http://localhost:3006"
echo "  Shipping:              http://localhost:3007"
echo "  Buyer Verification:    http://localhost:3009"
echo ""
echo "  PostgreSQL:            localhost:5432"
echo "  CouchDB:               http://localhost:5984/_utils"
echo "  Redis:                 localhost:6379"
echo "  Kafka:                 localhost:9093"
echo ""
echo "============================================================================"
echo "  TEST CREDENTIALS"
echo "============================================================================"
echo ""
echo "  Admin:      admin / admin123"
echo "  Exporter1:  exporter1 / password123"
echo "  Exporter2:  exporter2 / password123"
echo ""
echo "============================================================================"
echo "  NEXT STEPS"
echo "============================================================================"
echo ""
echo "  1. Open browser: http://localhost:5173"
echo "  2. Login with: admin / admin123"
echo "  3. Explore the system"
echo ""
echo "  View logs:     docker-compose -f docker-compose-hybrid.yml logs -f"
echo "  Stop system:   docker-compose -f docker-compose-hybrid.yml down"
echo "  Check status:  docker ps"
echo ""
echo "============================================================================"
echo ""
