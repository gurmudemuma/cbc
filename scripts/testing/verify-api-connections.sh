#!/bin/bash

################################################################################
# API Connection Verification Script
# 
# This script verifies that all APIs are properly connected and responding
# 
# Usage: ./verify-api-connections.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Configuration
declare -A APIS=(
  ["Commercial Bank"]="http://localhost:3001"
  ["Custom Authorities"]="http://localhost:3002"
  ["ECTA"]="http://localhost:3003"
  ["Exporter Portal"]="http://localhost:3004"
  ["National Bank"]="http://localhost:3005"
  ["ECX"]="http://localhost:3006"
  ["Shipping Line"]="http://localhost:3007"
)

declare -A CONTAINERS=(
  ["Commercial Bank"]="cbc-commercial-bank"
  ["Custom Authorities"]="cbc-custom-authorities"
  ["ECTA"]="cbc-ecta"
  ["Exporter Portal"]="cbc-exporter-portal"
  ["National Bank"]="cbc-national-bank"
  ["ECX"]="cbc-ecx"
  ["Shipping Line"]="cbc-shipping-line"
)

# Counters
TOTAL=0
PASSED=0
FAILED=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         API Connection Verification Script                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to test API health
test_api_health() {
  local name=$1
  local url=$2
  local container=$3
  
  TOTAL=$((TOTAL + 1))
  
  echo -n "Testing $name... "
  
  # Check if container is running
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo -e "${RED}✗ FAILED${NC} (Container not running)"
    FAILED=$((FAILED + 1))
    return 1
  fi
  
  # Test health endpoint
  if response=$(curl -s -w "\n%{http_code}" "$url/health" 2>/dev/null); then
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
      # Extract database status
      db_status=$(echo "$body" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
      
      if [ "$db_status" = "connected" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (DB: connected)"
        PASSED=$((PASSED + 1))
        return 0
      else
        echo -e "${YELLOW}⚠ WARNING${NC} (DB: $db_status)"
        PASSED=$((PASSED + 1))
        return 0
      fi
    else
      echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
      FAILED=$((FAILED + 1))
      return 1
    fi
  else
    echo -e "${RED}✗ FAILED${NC} (Connection refused)"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Test all APIs
echo -e "${BLUE}Testing API Health Endpoints:${NC}"
echo ""

for name in "${!APIS[@]}"; do
  url="${APIS[$name]}"
  container="${CONTAINERS[$name]}"
  test_api_health "$name" "$url" "$container"
done

echo ""
echo -e "${BLUE}Testing Database Connection:${NC}"
echo -n "PostgreSQL... "

if docker ps --format '{{.Names}}' | grep -q "^cbc-postgres$"; then
  if docker exec cbc-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
  fi
  TOTAL=$((TOTAL + 1))
else
  echo -e "${RED}✗ FAILED${NC} (Container not running)"
  FAILED=$((FAILED + 1))
  TOTAL=$((TOTAL + 1))
fi

echo ""
echo -e "${BLUE}Testing Redis Connection:${NC}"
echo -n "Redis... "

if docker ps --format '{{.Names}}' | grep -q "^cbc-redis$"; then
  if docker exec cbc-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
  fi
  TOTAL=$((TOTAL + 1))
else
  echo -e "${YELLOW}⚠ WARNING${NC} (Container not running - optional)"
  TOTAL=$((TOTAL + 1))
fi

echo ""
echo -e "${BLUE}Testing Docker Network:${NC}"
echo -n "cbc-network... "

if docker network inspect cbc-network > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASSED${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAILED${NC}"
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Test Summary                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════���════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  $TOTAL"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All API connections verified successfully!${NC}"
  echo ""
  echo "API Endpoints:"
  for name in "${!APIS[@]}"; do
    echo "  - $name: ${APIS[$name]}"
  done
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some API connections failed. Please check the logs.${NC}"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Check if all containers are running: docker ps"
  echo "2. View logs: docker-compose -f docker-compose.apis.yml logs -f"
  echo "3. Restart services: docker-compose -f docker-compose.apis.yml restart"
  echo "4. Rebuild services: docker-compose -f docker-compose.apis.yml up -d --build"
  echo ""
  exit 1
fi
