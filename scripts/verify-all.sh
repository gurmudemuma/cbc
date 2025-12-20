#!/bin/bash

# CBC Verify All Services Script
# Verifies all services are running and healthy

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying CBC Services..."
echo ""

FAILED=0

# Check Docker
echo -e "${BLUE}Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${RED}✗${NC} Docker not installed"
  FAILED=$((FAILED + 1))
else
  echo -e "${GREEN}✓${NC} Docker installed"
fi
echo ""

# Check Infrastructure
echo -e "${BLUE}Checking Infrastructure...${NC}"

# PostgreSQL
if docker ps | grep -q "postgres"; then
  if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL running (port 5432)"
  else
    echo -e "${RED}✗${NC} PostgreSQL not responding"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "${RED}✗${NC} PostgreSQL not running"
  FAILED=$((FAILED + 1))
fi

# Redis
if docker ps | grep -q "redis"; then
  if docker exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis running (port 6379)"
  else
    echo -e "${RED}✗${NC} Redis not responding"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "${RED}✗${NC} Redis not running"
  FAILED=$((FAILED + 1))
fi

# IPFS
if docker ps | grep -q "ipfs"; then
  echo -e "${GREEN}✓${NC} IPFS running (port 5001)"
else
  echo -e "${YELLOW}⚠${NC} IPFS not running"
fi
echo ""

# Check API Services
echo -e "${BLUE}Checking API Services...${NC}"

SERVICES=(
  "cbc-commercial-bank:3001"
  "cbc-custom-authorities:3002"
  "cbc-ecta:3003"
  "cbc-exporter-portal:3004"
  "cbc-national-bank:3005"
  "cbc-ecx:3006"
  "cbc-shipping-line:3007"
)

for service in "${SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$service"
  if docker ps | grep -q "$name"; then
    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} $name running (port $port)"
    else
      echo -e "${YELLOW}⚠${NC} $name running but health check failed (port $port)"
    fi
  else
    echo -e "${RED}✗${NC} $name not running"
    FAILED=$((FAILED + 1))
  fi
done
echo ""

# Summary
echo -e "${BLUE}Summary:${NC}"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All services verified!${NC}"
  echo ""
  echo "📍 Access services at:"
  echo "   Frontend:          http://localhost:3000"
  echo "   Commercial Bank:   http://localhost:3001/health"
  echo "   Custom Authorities: http://localhost:3002/health"
  echo "   ECTA:              http://localhost:3003/health"
  echo "   Exporter Portal:   http://localhost:3004/health"
  echo "   National Bank:     http://localhost:3005/health"
  echo "   ECX:               http://localhost:3006/health"
  echo "   Shipping Line:     http://localhost:3007/health"
  exit 0
else
  echo -e "${RED}✗ $FAILED service(s) failed verification${NC}"
  echo ""
  echo "💡 To start services:"
  echo "   ./scripts/start-all.sh"
  echo ""
  echo "💡 To view logs:"
  echo "   docker-compose -f docker-compose.postgres.yml logs -f"
  echo "   docker-compose -f docker-compose.apis.yml logs -f"
  exit 1
fi
