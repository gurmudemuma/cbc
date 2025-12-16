#!/bin/bash

echo "========================================="
echo "Mock Replacement Verification"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 missing"
        return 1
    fi
}

check_not_exists() {
    if [ ! -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 removed (as expected)"
        return 0
    else
        echo -e "${RED}✗${NC} $1 still exists (should be deleted)"
        return 1
    fi
}

check_no_mock() {
    local file=$1
    local count=$(grep -c "Mock\|mock" "$file" 2>/dev/null || echo "0")
    if [ "$count" -eq "0" ]; then
        echo -e "${GREEN}✓${NC} $file - No mock implementations"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $file - Found $count mock references (check if intentional)"
        return 1
    fi
}

echo "1. Checking Modified Files"
echo "---------------------------"
check_file "apis/ecta/src/routes/notifications.routes.ts"
check_file "apis/ecta/src/routes/exporter.routes.ts"
check_file "apis/shared/cache.service.ts"
check_file "apis/shared/metrics.service.ts"
echo ""

echo "2. Checking Deleted Files"
echo "--------------------------"
check_not_exists "mock-api.js"
echo ""

echo "3. Checking New Files"
echo "---------------------"
check_file "apis/shared/database/migrations/006_create_notifications_tables.sql"
check_file "MOCK_REPLACEMENT_SUMMARY.md"
echo ""

echo "4. Checking for Remaining Mocks"
echo "--------------------------------"
check_no_mock "apis/ecta/src/routes/notifications.routes.ts"
check_no_mock "apis/ecta/src/routes/exporter.routes.ts"
echo ""

echo "5. Checking Dependencies"
echo "------------------------"
if grep -q "prom-client" apis/package.json; then
    echo -e "${GREEN}✓${NC} prom-client added to package.json"
else
    echo -e "${RED}✗${NC} prom-client missing from package.json"
fi

if grep -q "redis" apis/package.json; then
    echo -e "${GREEN}✓${NC} redis present in package.json"
else
    echo -e "${RED}✗${NC} redis missing from package.json"
fi

if grep -q "pg" apis/package.json; then
    echo -e "${GREEN}✓${NC} pg present in package.json"
else
    echo -e "${RED}✗${NC} pg missing from package.json"
fi
echo ""

echo "6. Checking Import Statements"
echo "------------------------------"
if grep -q "import { createClient, RedisClientType } from 'redis'" apis/shared/cache.service.ts; then
    echo -e "${GREEN}✓${NC} Real Redis import in cache.service.ts"
else
    echo -e "${RED}✗${NC} Redis import not found in cache.service.ts"
fi

if grep -q "import { Counter, Histogram, Gauge, Registry, register } from 'prom-client'" apis/shared/metrics.service.ts; then
    echo -e "${GREEN}✓${NC} Real Prometheus import in metrics.service.ts"
else
    echo -e "${RED}✗${NC} Prometheus import not found in metrics.service.ts"
fi
echo ""

echo "========================================="
echo "Verification Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. cd apis && npm install"
echo "2. Run database migrations"
echo "3. Restart services: docker-compose restart"
echo "4. Test endpoints with Postman"
echo ""
