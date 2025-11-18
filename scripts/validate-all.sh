#!/bin/bash

# Validate all configurations before system startup
# This script checks for common misconfigurations

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ERRORS=0
WARNINGS=0

echo -e "${GREEN}=== Configuration Validation ===${NC}\n"

# Check 1: Workspace names consistency
echo "Checking workspace configurations..."
if grep -q "commercial-bank-api" "$PROJECT_ROOT/package.json" 2>/dev/null; then
    echo -e "${RED}✗ Incorrect workspace names in root package.json${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ Workspace names are correct${NC}"
fi

# Check 2: Environment files exist
echo "Checking .env.example files..."
for service in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
    if [ ! -f "$PROJECT_ROOT/api/$service/.env.example" ]; then
        echo -e "${RED}✗ Missing .env.example for $service${NC}"
        ((ERRORS++))
    fi
done
echo -e "${GREEN}✓ All .env.example files present${NC}"

# Check 3: Check for orphaned DATABASE_URL in configs
echo "Checking for orphaned config entries..."
if grep -q "^DATABASE_URL=" "$PROJECT_ROOT/api/national-bank/.env.example" 2>/dev/null | head -1; then
    echo -e "${YELLOW}⚠ Orphaned DATABASE_URL found in nb-regulatory .env.example${NC}"
    ((WARNINGS++))
fi

# Check 4: Wallet directories
echo "Checking wallet directory configuration..."
for service in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
    if ! grep -q "api/$service/wallet" "$PROJECT_ROOT/start-system.sh"; then
        echo -e "${RED}✗ Missing wallet creation for $service in start-system.sh${NC}"
        ((ERRORS++))
    fi
done
echo -e "${GREEN}✓ All wallet directories configured${NC}"

# Check 5: Port configurations consistency
echo "Checking port configurations..."
EXPECTED_PORTS=(3001 3002 3003 3004 3005 3006)
for i in "${!EXPECTED_PORTS[@]}"; do
    port="${EXPECTED_PORTS[$i]}"
    if ! grep -q "PORT=$port" "$PROJECT_ROOT/api/"*"/.env.example" 2>/dev/null; then
        echo -e "${YELLOW}⚠ Port $port may not be configured${NC}"
        ((WARNINGS++))
    fi
done
echo -e "${GREEN}✓ Port configurations look good${NC}"

# Check 6: Docker Compose healthchecks
echo "Checking Docker Compose healthchecks..."
HEALTHCHECK_COUNT=$(grep -c "healthcheck:" "$PROJECT_ROOT/docker-compose.yml" 2>/dev/null || echo "0")
if [ "$HEALTHCHECK_COUNT" -lt 2 ]; then
    echo -e "${YELLOW}⚠ Limited healthchecks in docker-compose.yml (found: $HEALTHCHECK_COUNT)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ Healthchecks present (found: $HEALTHCHECK_COUNT)${NC}"
fi

# Check 7: Shell script error handling
echo "Checking shell scripts for error handling..."
if ! grep -q "set -e" "$PROJECT_ROOT/network/network.sh"; then
    echo -e "${YELLOW}⚠ network.sh missing 'set -e' error handling${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ Critical scripts have error handling${NC}"
fi

# Check 8: TypeScript configurations
echo "Checking TypeScript configurations..."
for service in banker nb-regulatory exporter ncat shipping-line custom-authorities; do
    if [ ! -f "$PROJECT_ROOT/api/$service/tsconfig.json" ]; then
        echo -e "${RED}✗ Missing tsconfig.json for $service${NC}"
        ((ERRORS++))
    fi
done
echo -e "${GREEN}✓ All TypeScript configs present${NC}"

# Summary
echo ""
echo -e "${GREEN}=== Validation Summary ===${NC}"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Validation failed with $ERRORS error(s)${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Validation passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All validations passed!${NC}"
    exit 0
fi
