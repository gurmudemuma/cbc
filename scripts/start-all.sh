#!/bin/bash

# CBC Start All Services Script
# Starts infrastructure, APIs, and frontend

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting CBC Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Start Infrastructure
echo -e "${BLUE}[1/3]${NC} Starting infrastructure (PostgreSQL, Redis, IPFS)..."
docker-compose -f docker-compose.postgres.yml up -d
echo -e "${GREEN}✓${NC} Infrastructure started"
echo ""

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${YELLOW}⚠${NC} PostgreSQL took longer than expected, continuing anyway..."
  fi
  sleep 1
done
echo ""

# Step 2: Start APIs
echo -e "${BLUE}[2/3]${NC} Starting API services..."
docker-compose -f docker-compose.apis.yml up -d
echo -e "${GREEN}✓${NC} API services started"
echo ""

# Step 3: Start Frontend (optional)
if [ "$1" != "--no-frontend" ]; then
  echo -e "${BLUE}[3/3]${NC} Starting frontend..."
  if [ -d "frontend" ]; then
    cd frontend
    if [ ! -d "node_modules" ]; then
      echo "Installing frontend dependencies..."
      npm install > /dev/null 2>&1
    fi
    npm start &
    cd ..
    echo -e "${GREEN}✓${NC} Frontend started (http://localhost:3000)"
  else
    echo -e "${YELLOW}⚠${NC} Frontend directory not found, skipping"
  fi
else
  echo -e "${BLUE}[3/3]${NC} Skipping frontend (use --no-frontend to skip)"
fi

echo ""
echo -e "${GREEN}✓ All services started!${NC}"
echo ""
echo "📍 Service URLs:"
echo "   Frontend:          http://localhost:3000"
echo "   Commercial Bank:   http://localhost:3001"
echo "   Custom Authorities: http://localhost:3002"
echo "   ECTA:              http://localhost:3003"
echo "   Exporter Portal:   http://localhost:3004"
echo "   National Bank:     http://localhost:3005"
echo "   ECX:               http://localhost:3006"
echo "   Shipping Line:     http://localhost:3007"
echo ""
echo "📊 Infrastructure:"
echo "   PostgreSQL:        localhost:5432"
echo "   Redis:             localhost:6379"
echo "   IPFS:              localhost:5001"
echo ""
echo "🔍 Verify setup:"
echo "   ./scripts/verify-all.sh"
echo ""
echo "🛑 Stop all services:"
echo "   ./scripts/stop-all.sh"
echo ""
