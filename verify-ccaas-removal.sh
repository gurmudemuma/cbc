#!/bin/bash

# CCAAS Removal Verification Script
# This script verifies that all CCAAS infrastructure has been removed

echo "========================================="
echo "CCAAS Removal Verification"
echo "========================================="
echo ""

ERRORS=0

# Check 1: Verify CCAAS builder removed from core.yaml
echo "[1/6] Checking config/core.yaml..."
if grep -q "ccaas_builder" /home/gu-da/cbc/config/core.yaml; then
    echo "  ❌ FAILED: CCAAS builder still in core.yaml"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASSED: CCAAS builder removed from core.yaml"
fi

# Check 2: Verify CCAAS env var removed from docker-compose.yml
echo "[2/6] Checking docker-compose.yml..."
if grep -q "CHAINCODE_AS_A_SERVICE_BUILDER_CONFIG" /home/gu-da/cbc/docker-compose.yml; then
    echo "  ❌ FAILED: CCAAS env var still in docker-compose.yml"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASSED: CCAAS env var removed from docker-compose.yml"
fi

# Check 3: Verify connection.json files removed
echo "[3/6] Checking connection.json files..."
if [ -f "/home/gu-da/cbc/chaincode/coffee-export/connection.json" ] || \
   [ -f "/home/gu-da/cbc/chaincode/user-management/connection.json" ]; then
    echo "  ❌ FAILED: connection.json files still exist"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASSED: connection.json files removed"
fi

# Check 4: Verify Dockerfile.external files removed
echo "[4/6] Checking Dockerfile.external files..."
if [ -f "/home/gu-da/cbc/chaincode/coffee-export/Dockerfile.external" ] || \
   [ -f "/home/gu-da/cbc/chaincode/user-management/Dockerfile.external" ]; then
    echo "  ❌ FAILED: Dockerfile.external files still exist"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASSED: Dockerfile.external files removed"
fi

# Check 5: Verify docker-compose-chaincode.yml removed
echo "[5/6] Checking docker-compose-chaincode.yml..."
if [ -f "/home/gu-da/cbc/docker-compose-chaincode.yml" ]; then
    echo "  ❌ FAILED: docker-compose-chaincode.yml still exists"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASSED: docker-compose-chaincode.yml removed"
fi

# Check 6: Verify builders/ccaas directory removed
echo "[6/6] Checking builders/ccaas directory..."
if [ -d "/home/gu-da/cbc/builders/ccaas" ]; then
    echo "  ❌ FAILED: builders/ccaas directory still exists"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASSED: builders/ccaas directory removed"
fi

echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED"
    echo "CCAAS infrastructure successfully removed"
else
    echo "❌ $ERRORS CHECK(S) FAILED"
    echo "Some CCAAS artifacts remain"
fi
echo "========================================="

exit $ERRORS
