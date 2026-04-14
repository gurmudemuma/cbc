#!/bin/bash
# Coffee Export System - Complete Startup Script (Linux/Mac)
# Starts all services in the correct order with proper validation

set -e

echo ""
echo "=========================================="
echo "Coffee Export System - Startup Script"
echo "=========================================="
echo ""

COMPOSE_HYBRID="docker-compose-hybrid.yml"
COMPOSE_FABRIC="docker-compose-fabric.yml"

# Check if Docker is running
echo "Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi
echo "[OK] Docker is running"
echo ""

# Clean up
echo "Cleaning up all containers from previous runs..."
docker-compose -f "$COMPOSE_HYBRID" down -v --remove-orphans 2>/dev/null || true
docker-compose -f "$COMPOSE_FABRIC" down -v --remove-orphans 2>/dev/null || true
echo "[OK] Cleanup complete"
echo ""

# Force remove any leftover networks
echo "Cleaning up leftover networks..."
docker network rm fabric-network 2>/dev/null || true
echo "[OK] Networks cleaned"
echo ""

# Create network
echo "Creating fabric-network..."
docker network create fabric-network 2>/dev/null || true
echo "[OK] Fabric network ready"
echo ""

# Start blockchain
echo "Starting blockchain infrastructure..."
docker-compose -f "$COMPOSE_FABRIC" up -d
echo "[OK] Blockchain infrastructure started"
echo ""

# Start CLI container explicitly
echo "Starting CLI container..."
docker-compose -f "$COMPOSE_FABRIC" up -d cli 2>/dev/null || true
echo ""

# Wait for CLI container to be ready
echo "Waiting for CLI container to be ready..."
CLI_READY=0
for i in {1..30}; do
    if docker exec cli ls /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config > /dev/null 2>&1; then
        echo "[OK] CLI container is ready"
        CLI_READY=1
        break
    fi
    sleep 2
done
if [ $CLI_READY -eq 0 ]; then
    echo "[WARNING] CLI container not ready, but continuing..."
fi
echo ""

# Start application services
echo "Starting application infrastructure services..."
docker-compose -f "$COMPOSE_HYBRID" up -d zookeeper kafka postgres redis
echo "[OK] Application infrastructure services started"
echo ""

# Wait for PostgreSQL
echo "Waiting for PostgreSQL to initialize..."
PG_READY=0
for i in {1..120}; do
    if docker exec postgres psql -U postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo "[OK] PostgreSQL is ready"
        PG_READY=1
        break
    fi
    sleep 1
done
if [ $PG_READY -eq 0 ]; then
    echo "[ERROR] PostgreSQL failed to start"
    docker-compose -f "$COMPOSE_HYBRID" logs postgres
    exit 1
fi
echo ""

# Start gateway
echo "Starting gateway and core services..."
docker-compose -f "$COMPOSE_HYBRID" up -d gateway blockchain-bridge buyer-verification
echo "[OK] Gateway services started"
echo ""

# Wait for gateway to be ready
echo "Waiting for gateway to initialize..."
GATEWAY_READY=0
for i in {1..60}; do
    if docker exec gateway curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "[OK] Gateway is ready"
        GATEWAY_READY=1
        break
    fi
    sleep 1
done
if [ $GATEWAY_READY -eq 0 ]; then
    echo "[WARNING] Gateway health check failed, but continuing..."
fi
echo ""

# Seed database
echo "Initializing database and seeding users..."
docker-compose -f "$COMPOSE_HYBRID" exec -T gateway npm run seed
echo "[OK] Database initialized and users seeded"
echo ""

# Check database
echo "Checking database contents..."
docker-compose -f "$COMPOSE_HYBRID" exec -T gateway npm run check-db
echo ""

# Start CBC services
echo "Starting CBC services..."
docker-compose -f "$COMPOSE_HYBRID" up -d ecta-service commercial-bank-service national-bank-service customs-service ecx-service shipping-service 2>/dev/null || true
echo ""

# Wait for CBC services to be ready
echo "Waiting for CBC services to initialize..."
CBC_READY=0
for i in {1..60}; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -i "coffee-ecta.*Up" > /dev/null 2>&1; then
        echo "[OK] CBC services are ready"
        CBC_READY=1
        break
    fi
    sleep 2
done
if [ $CBC_READY -eq 0 ]; then
    echo "[WARNING] CBC services not fully ready, but continuing..."
fi
echo ""

# Start frontend
echo "Starting frontend..."
docker-compose -f "$COMPOSE_HYBRID" up -d frontend 2>/dev/null || true
echo "[OK] Frontend started"
echo ""

# Wait for frontend to be ready
echo "Waiting for frontend to initialize..."
FRONTEND_READY=0
for i in {1..30}; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -i "coffee-frontend.*Up" > /dev/null 2>&1; then
        echo "[OK] Frontend is ready"
        FRONTEND_READY=1
        break
    fi
    sleep 2
done
if [ $FRONTEND_READY -eq 0 ]; then
    echo "[WARNING] Frontend not ready, but continuing..."
fi
echo ""

# Final status
echo "=========================================="
echo "System Status"
echo "=========================================="
echo ""
echo "Service URLs:"
echo "  Frontend:        http://localhost:5173"
echo "  Gateway API:     http://localhost:3000"
echo "  ECTA Service:    http://localhost:3003"
echo "  PostgreSQL:      localhost:5432"
echo "  Redis:           localhost:6379"
echo ""
echo "Blockchain Services:"
echo "  Orderer 1:       localhost:7050"
echo "  Orderer 2:       localhost:8050"
echo "  Orderer 3:       localhost:9050"
echo "  Peer ECTA 0:     localhost:7051"
echo "  Peer ECTA 1:     localhost:8051"
echo "  CouchDB ECTA 0:  localhost:5984"
echo "  CLI:             docker exec -it cli bash"
echo ""
echo "Test Credentials:"
echo "  Admin:     admin / admin123"
echo "  Exporter1: exporter1 / password123"
echo "  Exporter2: exporter2 / password123"
echo ""
echo "Verifying users in database..."
docker-compose -f "$COMPOSE_HYBRID" exec -T gateway npm run verify-users
echo ""

# Sync users to blockchain (after system is fully initialized)
echo "Syncing users to blockchain..."
docker-compose -f "$COMPOSE_HYBRID" exec -T gateway npm run sync-users 2>/dev/null || {
    echo "[WARNING] Blockchain sync failed, but system is still operational"
    echo "[INFO] You can manually sync later with: npm run sync-users"
}
echo ""

echo "[OK] System startup complete!"
echo ""
echo "=========================================="
echo "Final System Status"
echo "=========================================="
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}" | grep coffee
echo ""
echo "=========================================="
echo ""
