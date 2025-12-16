#!/bin/bash

##############################################################################
# Hyperledger Fabric TLS Certificate Path Fix Verification
#
# This script verifies that the TLS certificate path fix has been properly
# applied and that the system is ready for deployment.
#
# Usage: ./verify-tls-fix.sh
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}=========================================="
    echo "$1"
    echo "==========================================${NC}"
    echo ""
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

# Main verification
print_header "Hyperledger Fabric TLS Certificate Path Fix Verification"

# Check 1: docker-compose.yml exists
print_header "1. Configuration File Verification"

if [ -f "docker-compose.yml" ]; then
    print_pass "docker-compose.yml exists"
else
    print_fail "docker-compose.yml not found"
    exit 1
fi

# Check 2: Verify path corrections
print_header "2. Path Reference Verification"

CORRECT_PATHS=$(grep -c "./organizations" docker-compose.yml || true)
INCORRECT_PATHS=$(grep -c "./network/organizations" docker-compose.yml || true)

if [ "$CORRECT_PATHS" -gt 0 ]; then
    print_pass "Found $CORRECT_PATHS correct path references (./organizations)"
else
    print_fail "No correct path references found"
fi

if [ "$INCORRECT_PATHS" -eq 0 ]; then
    print_pass "No incorrect path references (./network/organizations)"
else
    print_fail "Found $INCORRECT_PATHS incorrect path references"
fi

# Check 3: Verify critical paths
print_header "3. Critical Path Verification"

CRITICAL_PATHS=(
    "organizations:/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations"
    "organizations/ordererOrganizations/coffee-export.com/orderers/orderer.coffee-export.com"
    "organizations/peerOrganizations/commercialbank.coffee-export.com/peers/peer0.commercialbank.coffee-export.com"
    "organizations/peerOrganizations/nationalbank.coffee-export.com/peers/peer0.nationalbank.coffee-export.com"
    "organizations/peerOrganizations/ecta.coffee-export.com/peers/peer0.ecta.coffee-export.com"
    "organizations/peerOrganizations/shippingline.coffee-export.com/peers/peer0.shippingline.coffee-export.com"
    "organizations/peerOrganizations/custom-authorities.coffee-export.com/peers/peer0.custom-authorities.coffee-export.com"
)

for path in "${CRITICAL_PATHS[@]}"; do
    if grep -q "$path" docker-compose.yml; then
        print_pass "Path verified: $path"
    else
        print_fail "Path missing: $path"
    fi
done

# Check 4: Certificate existence
print_header "4. Certificate File Verification"

CERT_COUNT=$(find ./organizations -name "ca.crt" 2>/dev/null | wc -l)

if [ "$CERT_COUNT" -ge 6 ]; then
    print_pass "Found $CERT_COUNT certificate files (expected: 6)"
else
    print_fail "Found only $CERT_COUNT certificate files (expected: 6)"
fi

# List certificates
print_info "Certificate locations:"
find ./organizations -name "ca.crt" 2>/dev/null | while read cert; do
    echo "  - $cert"
done

# Check 5: File permissions
print_header "5. File Permission Verification"

# Check if certificates are readable
READABLE_CERTS=$(find ./organizations -name "ca.crt" -readable 2>/dev/null | wc -l)

if [ "$READABLE_CERTS" -eq "$CERT_COUNT" ]; then
    print_pass "All $CERT_COUNT certificates are readable"
else
    print_warn "Only $READABLE_CERTS of $CERT_COUNT certificates are readable"
fi

# Check 6: Docker status
print_header "6. Docker Service Status"

if command -v docker &> /dev/null; then
    print_pass "Docker is installed"
    
    # Check if docker daemon is running
    if docker ps &> /dev/null; then
        print_pass "Docker daemon is running"
    else
        print_fail "Docker daemon is not running"
    fi
else
    print_fail "Docker is not installed"
fi

# Check 7: Docker Compose status
print_header "7. Docker Compose Status"

if command -v docker-compose &> /dev/null; then
    print_pass "Docker Compose is installed"
    
    # Validate docker-compose.yml syntax
    if docker-compose config > /dev/null 2>&1; then
        print_pass "docker-compose.yml syntax is valid"
    else
        print_fail "docker-compose.yml has syntax errors"
    fi
else
    print_fail "Docker Compose is not installed"
fi

# Check 8: Container status
print_header "8. Container Status"

if docker ps &> /dev/null; then
    RUNNING_PEERS=$(docker ps 2>/dev/null | grep -c "peer0\." || true)
    RUNNING_ORDERER=$(docker ps 2>/dev/null | grep -c "orderer\." || true)
    RUNNING_CLI=$(docker ps 2>/dev/null | grep -c "cli" || true)
    
    if [ "$RUNNING_PEERS" -gt 0 ]; then
        print_pass "Found $RUNNING_PEERS peer containers running"
    else
        print_info "No peer containers currently running (expected if not started)"
    fi
    
    if [ "$RUNNING_ORDERER" -gt 0 ]; then
        print_pass "Found orderer container running"
    else
        print_info "Orderer container not running (expected if not started)"
    fi
else
    print_info "Docker not accessible (containers may not be running)"
fi

# Check 9: Volume mount verification
print_header "9. Volume Mount Verification"

if docker ps &> /dev/null; then
    # Check if any peer container is running
    PEER_CONTAINER=$(docker ps 2>/dev/null | grep "peer0.commercialbank" | awk '{print $1}' | head -1)
    
    if [ -n "$PEER_CONTAINER" ]; then
        # Check volume mounts
        MOUNTS=$(docker inspect "$PEER_CONTAINER" 2>/dev/null | grep -c "organizations" || true)
        
        if [ "$MOUNTS" -gt 0 ]; then
            print_pass "Peer container has organizations volume mounts"
        else
            print_warn "Could not verify peer container volume mounts"
        fi
    else
        print_info "No running peer container to verify (expected if not started)"
    fi
else
    print_info "Docker not accessible (skipping container verification)"
fi

# Check 10: Configuration consistency
print_header "10. Configuration Consistency Check"

# Count orderer references
ORDERER_REFS=$(grep -c "ordererOrganizations" docker-compose.yml || true)
if [ "$ORDERER_REFS" -ge 2 ]; then
    print_pass "Orderer configuration references found ($ORDERER_REFS)"
else
    print_warn "Orderer configuration references may be incomplete"
fi

# Count peer references
PEER_REFS=$(grep -c "peerOrganizations" docker-compose.yml || true)
if [ "$PEER_REFS" -ge 10 ]; then
    print_pass "Peer configuration references found ($PEER_REFS)"
else
    print_warn "Peer configuration references may be incomplete"
fi

# Count API references
API_REFS=$(grep -c "commercialbank-api\|national-bank-api\|ecta-api\|shipping-line-api\|custom-authorities-api" docker-compose.yml || true)
if [ "$API_REFS" -ge 5 ]; then
    print_pass "API service references found ($API_REFS)"
else
    print_warn "API service references may be incomplete"
fi

# Summary
print_header "Verification Summary"

TOTAL=$((PASSED + FAILED + WARNINGS))

echo -e "${GREEN}Passed:${NC}  $PASSED"
echo -e "${RED}Failed:${NC}  $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "Total:   $TOTAL"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "✓ All critical checks passed!"
    echo "System is ready for deployment."
    echo "==========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. docker-compose down"
    echo "2. docker-compose up -d"
    echo "3. sleep 30"
    echo "4. docker exec -it cli peer lifecycle chaincode queryinstalled"
    exit 0
else
    echo -e "${RED}=========================================="
    echo "✗ Some checks failed!"
    echo "Please review the errors above."
    echo "==========================================${NC}"
    exit 1
fi
