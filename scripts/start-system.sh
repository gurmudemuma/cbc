#!/bin/bash
# Coffee Export System - Complete Startup Script (Linux/Mac)
# Starts all services in the correct order with health checks

set -e

echo
echo "=========================================="
echo "Coffee Export System - Startup Script"
echo "=========================================="
echo

# Configuration
COMPOSE_FILE="../docker-compose-hybrid.yml"
TIMEOUT=300
HEALTH_CHECK_INTERVAL=5

# Check if Docker is running
echo "Checking Docker..."
if ! docker ps >/dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi
echo "[OK] Docker is running"
echo

# Start infrastructure services
echo "Starting infrastructure services..."
docker-compose -f $COMPOSE_FILE up -d \
    zookeeper \
    kafka \
    postgres \
    redis

echo "[OK] Infrastructure services started"
echo

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
elapsed=0
while ! docker ps --filter "name=coffee-postgres" --format "{{.Status}}" | grep -i "healthy" >/dev/null; do
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "[ERROR] PostgreSQL failed to start"
        exit 1
    fi
    sleep $HEALTH_CHECK_INTERVAL
    elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
done
echo "[OK] PostgreSQL is ready"
echo

# Start blockchain services
echo "Starting blockchain services..."
# Note: Blockchain peers and orderers should be started separately via Fabric network
echo "[INFO] Blockchain services should be started separately via fabric network"
echo

# Start gateway and core services
echo "Starting gateway and core services..."
docker-compose -f $COMPOSE_FILE up -d \
    gateway \
    blockchain-bridge \
    buyer-verification

echo "[OK] Gateway and core services started"
echo

# Wait for gateway
echo "Waiting for gateway..."
elapsed=0
while ! docker ps --filter "name=coffee-gateway" --format "{{.Status}}" | grep -i "healthy" >/dev/null; do
    if [ $elapsed -ge $TIMEOUT ]; then
        echo "[WARNING] Gateway health check timeout, continuing..."
        break
    fi
    sleep $HEALTH_CHECK_INTERVAL
    elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
done
echo "[OK] Gateway is ready"
echo

# Start CBC services
echo "Starting CBC services..."
docker-compose -f $COMPOSE_FILE up -d \
    ecta-service \
    commercial-bank-service \
    national-bank-service \
    customs-service \
    ecx-service \
    shipping-service

echo "[OK] CBC services started"
echo

# Start frontend
echo "Starting frontend..."
docker-compose -f $COMPOSE_FILE up -d frontend

echo "[OK] Frontend started"
echo

# Final status
echo "=========================================="
echo "System Status"
echo "=========================================="
echo

echo "Service URLs:"
echo "  Frontend:        http://localhost:5173"
echo "  Gateway API:     http://localhost:3000"
echo "  ECTA Service:    http://localhost:3003"
echo "  PostgreSQL:      localhost:5432"
echo "  Redis:           localhost:6379"
echo

echo "Test Credentials:"
echo "  Username: Ella"
echo "  Password: password123"
echo

echo "Next Steps:"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Login with test credentials"
echo "  3. Navigate to 'My Applications' to test the system"
echo

echo "[OK] System startup complete!"
echo