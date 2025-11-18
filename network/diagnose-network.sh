#!/bin/bash

# Fabric Network Diagnostic Script
# Identifies and reports network issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
WARN=0

# Test functions
test_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASS++))
}

test_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAIL++))
}

test_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARN++))
}

test_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Diagnostic tests
echo "=========================================="
echo "Fabric Network Diagnostic Report"
echo "=========================================="
echo ""

# 1. Docker Status
echo "1. Docker Status"
echo "---"
if command -v docker &> /dev/null; then
    test_pass "Docker installed"
    if docker ps &> /dev/null; then
        test_pass "Docker daemon running"
    else
        test_fail "Docker daemon not running"
    fi
else
    test_fail "Docker not installed"
fi
echo ""

# 2. Container Status
echo "2. Container Status"
echo "---"
RUNNING=$(docker ps --filter "label=service=hyperledger-fabric" --format "{{.Names}}" 2>/dev/null | wc -l)
TOTAL=$(docker ps -a --filter "label=service=hyperledger-fabric" --format "{{.Names}}" 2>/dev/null | wc -l)

if [ "$RUNNING" -eq 7 ]; then
    test_pass "All 7 containers running ($RUNNING/$TOTAL)"
elif [ "$RUNNING" -gt 0 ]; then
    test_warn "Only $RUNNING/$TOTAL containers running"
else
    test_fail "No Fabric containers running"
fi

# List containers
docker ps --filter "label=service=hyperledger-fabric" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | tail -n +2 | while read line; do
    if [[ $line == *"Up"* ]]; then
        test_info "$line"
    else
        test_warn "$line"
    fi
done
echo ""

# 3. Network Status
echo "3. Network Status"
echo "---"
if docker network inspect coffee-export-network &> /dev/null; then
    test_pass "Network 'coffee-export-network' exists"
    CONNECTED=$(docker network inspect coffee-export-network --format '{{len .Containers}}')
    test_info "Connected containers: $CONNECTED"
else
    test_fail "Network 'coffee-export-network' not found"
fi
echo ""

# 4. Orderer Status
echo "4. Orderer Status"
echo "---"
if docker ps --filter "name=orderer.coffee-export.com" --format "{{.Names}}" | grep -q orderer; then
    test_pass "Orderer container running"
    
    # Check orderer logs
    if docker logs orderer.coffee-export.com 2>/dev/null | grep -q "Starting orderer\|Orderer started\|Raft leader"; then
        test_pass "Orderer initialized"
    else
        test_warn "Orderer may not be fully initialized"
    fi
    
    # Check orderer port
    if docker exec orderer.coffee-export.com netstat -tlnp 2>/dev/null | grep -q 7053; then
        test_pass "Orderer admin port (7053) listening"
    else
        test_warn "Orderer admin port (7053) not listening"
    fi
else
    test_fail "Orderer container not running"
fi
echo ""

# 5. Peer Status
echo "5. Peer Status"
echo "---"
PEERS=("peer0.commercialbank.coffee-export.com" "peer0.nationalbank.coffee-export.com" "peer0.ecta.coffee-export.com" "peer0.shippingline.coffee-export.com" "peer0.customauthorities.coffee-export.com")

for PEER in "${PEERS[@]}"; do
    if docker ps --filter "name=$PEER" --format "{{.Names}}" | grep -q "$PEER"; then
        test_pass "$PEER running"
    else
        test_fail "$PEER not running"
    fi
done
echo ""

# 6. CouchDB Status
echo "6. CouchDB Status"
echo "---"
COUCHDBS=("couchdb0" "couchdb1" "couchdb2" "couchdb3" "couchdb4")

for COUCHDB in "${COUCHDBS[@]}"; do
    if docker ps --filter "name=$COUCHDB" --format "{{.Names}}" | grep -q "$COUCHDB"; then
        test_pass "$COUCHDB running"
    else
        test_fail "$COUCHDB not running"
    fi
done
echo ""

# 7. Certificate Status
echo "7. Certificate Status"
echo "---"
CERT_PATHS=(
    "organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt"
    "organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key"
    "organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com/tls/ca.crt"
)

for CERT in "${CERT_PATHS[@]}"; do
    if [ -f "$CERT" ]; then
        test_pass "Certificate exists: $CERT"
    else
        test_fail "Certificate missing: $CERT"
    fi
done
echo ""

# 8. Channel Status
echo "8. Channel Status"
echo "---"
if [ -f "channel-artifacts/coffeechannel.block" ]; then
    test_pass "Channel block file exists"
else
    test_warn "Channel block file not found"
fi

# Try to list channels on orderer
if docker exec cli osnadmin channel list \
    -o orderer.coffee-export.com:7053 \
    --ca-file organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/msp/tlscacerts/tlsca.coffee-export.com-cert.pem \
    --client-cert organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.crt \
    --client-key organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com/tls/server.key 2>&1 | grep -q "coffeechannel"; then
    test_pass "Channel 'coffeechannel' exists on orderer"
else
    test_warn "Channel 'coffeechannel' not found on orderer"
fi
echo ""

# 9. Connectivity Tests
echo "9. Connectivity Tests"
echo "---"
if docker exec cli ping -c 1 orderer.coffee-export.com &> /dev/null; then
    test_pass "CLI can reach orderer"
else
    test_fail "CLI cannot reach orderer"
fi

if docker exec cli ping -c 1 peer0.commercialbank.coffee-export.com &> /dev/null; then
    test_pass "CLI can reach commercialbank peer"
else
    test_fail "CLI cannot reach commercialbank peer"
fi
echo ""

# 10. Chaincode Status
echo "10. Chaincode Status"
echo "---"
if docker ps --filter "name=dev-peer" --format "{{.Names}}" | grep -q "dev-peer"; then
    test_pass "Chaincode containers running"
else
    test_warn "No chaincode containers running (may not be deployed yet)"
fi
echo ""

# Summary
echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Network appears to be healthy${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy chaincode: ./network.sh deployCC"
    echo "2. Start API: cd ../api && npm start"
    echo "3. Start Frontend: cd ../frontend && npm run dev"
else
    echo -e "${RED}✗ Network has issues that need to be fixed${NC}"
    echo ""
    echo "Recommended actions:"
    echo "1. Check container logs: docker logs <container-name>"
    echo "2. Run recovery script: ./recover-network.sh"
    echo "3. Full reset: ./network.sh down && sleep 10 && ./network.sh up"
fi
echo ""
