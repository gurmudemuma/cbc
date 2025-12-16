#!/bin/bash

# Health check script for Coffee Export Consortium network
# Verifies all components are running and responsive

set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
NETWORK_DIR=$(dirname $SCRIPT_DIR)

source $SCRIPT_DIR/envVar.sh

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

echo "=========================================="
echo "  Coffee Export Network Health Check"
echo "=========================================="
echo ""

# 1. Check Docker daemon
echo "1️⃣  Checking Docker daemon..."
if docker ps > /dev/null 2>&1; then
  pass "Docker daemon is running"
else
  fail "Docker daemon is not running"
  exit 1
fi
echo ""

# 2. Check containers
echo "2️⃣  Checking containers..."
CONTAINERS=(
  "orderer.coffee-export.com"
  "peer0.commercialbank.coffee-export.com"
  "peer0.nationalbank.coffee-export.com"
  "peer0.ecta.coffee-export.com"
  "peer0.shippingline.coffee-export.com"
  "peer0.custom-authorities.coffee-export.com"
  "couchdb0"
  "couchdb1"
  "couchdb2"
  "couchdb3"
  "couchdb4"
  "cli"
)

for container in "${CONTAINERS[@]}"; do
  if docker ps | grep -q "$container"; then
    pass "$container is running"
  else
    fail "$container is NOT running"
  fi
done
echo ""

# 3. Check peer connectivity
echo "3️⃣  Checking peer connectivity..."
for org in 1 2 3 4 5; do
  setGlobals $org
  if peer channel list > /dev/null 2>&1; then
    pass "Org $org peer is responsive"
  else
    fail "Org $org peer is NOT responsive"
  fi
done
echo ""

# 4. Check channel
echo "4️⃣  Checking channel..."
setGlobals 1
if peer channel list 2>/dev/null | grep -q "coffeechannel"; then
  pass "Channel 'coffeechannel' exists"
else
  warn "Channel 'coffeechannel' does NOT exist (may need to create it)"
fi
echo ""

# 5. Check chaincode
echo "5️⃣  Checking chaincode..."
if peer lifecycle chaincode queryinstalled 2>/dev/null | grep -q "coffee-export"; then
  pass "Chaincode 'coffee-export' is installed"
else
  warn "Chaincode 'coffee-export' is NOT installed (may need to deploy it)"
fi
echo ""

# 6. Check CouchDB connectivity
echo "6️⃣  Checking CouchDB connectivity..."
COUCHDB_PORTS=(5984 6984 7984 8984 9984)
COUCHDB_NAMES=("couchdb0" "couchdb1" "couchdb2" "couchdb3" "couchdb4")

for i in "${!COUCHDB_PORTS[@]}"; do
  PORT=${COUCHDB_PORTS[$i]}
  NAME=${COUCHDB_NAMES[$i]}
  if curl -s http://admin:adminpw@localhost:$PORT/ > /dev/null 2>&1; then
    pass "$NAME (port $PORT) is responsive"
  else
    fail "$NAME (port $PORT) is NOT responsive"
  fi
done
echo ""

# 7. Check orderer connectivity
echo "7️⃣  Checking orderer connectivity..."
if docker exec cli bash -c "
  cd /opt/gopath/src/github.com/hyperledger/fabric/peer &&
  . ./scripts/envVar.sh &&
  peer channel list -o orderer.coffee-export.com:7050 --tls --cafile \$ORDERER_CA > /dev/null 2>&1
" 2>/dev/null; then
  pass "Orderer is responsive"
else
  fail "Orderer is NOT responsive"
fi
echo ""

# 8. Check network connectivity
echo "8️⃣  Checking network connectivity..."
if docker network ls | grep -q "coffee-export-network"; then
  pass "Network 'coffee-export-network' exists"
else
  fail "Network 'coffee-export-network' does NOT exist"
fi
echo ""

# 9. Check disk space
echo "9️⃣  Checking disk space..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
  pass "Disk usage is at ${DISK_USAGE}% (healthy)"
else
  warn "Disk usage is at ${DISK_USAGE}% (may need cleanup)"
fi
echo ""

# 10. Check Docker resources
echo "🔟 Checking Docker resources..."
DOCKER_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" 2>/dev/null | head -1)
if [ -n "$DOCKER_MEMORY" ]; then
  pass "Docker memory usage: $DOCKER_MEMORY"
else
  warn "Could not determine Docker memory usage"
fi
echo ""

# Summary
echo "=========================================="
echo "  Health Check Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
  else
    echo -e "${YELLOW}⚠ Checks passed with warnings${NC}"
    exit 0
  fi
else
  echo -e "${RED}✗ Some checks failed${NC}"
  exit 1
fi
