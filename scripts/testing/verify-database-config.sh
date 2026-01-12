#!/bin/bash

# Database Configuration Verification Script
# This script verifies all database and data flow configurations

set -e

echo "=========================================="
echo "Database Configuration Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

# Function to print status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $1"
        ((FAILED++))
    fi
}

# Function to check if port is open
check_port() {
    nc -z localhost $1 2>/dev/null
}

# Function to check if file exists
check_file() {
    [ -f "$1" ]
}

echo "1. Checking Docker Containers..."
echo "=================================="

# Check PostgreSQL
docker ps | grep -q "postgres" && echo -e "${GREEN}✓${NC} PostgreSQL container running" || echo -e "${RED}✗${NC} PostgreSQL container NOT running"
check_port 5432
check_status "PostgreSQL port 5432 accessible"

# Check Redis
docker ps | grep -q "redis" && echo -e "${GREEN}✓${NC} Redis container running" || echo -e "${RED}✗${NC} Redis container NOT running"
check_port 6379
check_status "Redis port 6379 accessible"

# Check IPFS
docker ps | grep -q "ipfs" && echo -e "${GREEN}✓${NC} IPFS container running" || echo -e "${RED}✗${NC} IPFS container NOT running"
check_port 5001
check_status "IPFS port 5001 accessible"

echo ""
echo "2. Checking Docker Network..."
echo "=============================="

docker network ls | grep -q "coffee-export-network" && echo -e "${GREEN}✓${NC} coffee-export-network exists" || echo -e "${RED}✗${NC} coffee-export-network NOT found"

echo ""
echo "3. Checking API Environment Files..."
echo "====================================="

APIS=("commercial-bank" "custom-authorities" "ecta" "ecx" "exporter-portal" "national-bank" "shipping-line")

for api in "${APIS[@]}"; do
    env_file="/home/gu-da/cbc/api/$api/.env"
    
    if check_file "$env_file"; then
        # Check if using localhost
        if grep -q "DB_HOST=localhost" "$env_file"; then
            echo -e "${GREEN}✓${NC} $api: DB_HOST=localhost"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} $api: DB_HOST not set to localhost"
            ((FAILED++))
        fi
        
        # Check Redis host
        if grep -q "REDIS_HOST=localhost" "$env_file"; then
            echo -e "${GREEN}✓${NC} $api: REDIS_HOST=localhost"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} $api: REDIS_HOST not set to localhost"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗${NC} $api: .env file not found"
        ((FAILED++))
    fi
done

echo ""
echo "4. Checking Database Migrations..."
echo "=================================="

MIGRATIONS=(
    "001_create_ecta_preregistration_tables.sql"
    "002_create_documents_table.sql"
    "003_create_audit_log_table.sql"
    "004_create_exports_table.sql"
    "005_create_users_table.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    migration_file="/home/gu-da/cbc/api/shared/database/migrations/$migration"
    if check_file "$migration_file"; then
        echo -e "${GREEN}✓${NC} $migration exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $migration NOT found"
        ((FAILED++))
    fi
done

echo ""
echo "5. Checking Database Configuration Files..."
echo "==========================================="

config_files=(
    "/home/gu-da/cbc/api/shared/database/db.config.ts"
    "/home/gu-da/cbc/api/shared/database/pool.ts"
    "/home/gu-da/cbc/api/shared/database/init.sql"
)

for config_file in "${config_files[@]}"; do
    if check_file "$config_file"; then
        echo -e "${GREEN}✓${NC} $(basename $config_file) exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $(basename $config_file) NOT found"
        ((FAILED++))
    fi
done

echo ""
echo "6. Checking Documentation Files..."
echo "=================================="

docs=(
    "/home/gu-da/cbc/DATABASE_CONFIGURATION_AUDIT_COMPLETE.md"
    "/home/gu-da/cbc/DATABASE_QUICK_REFERENCE.md"
    "/home/gu-da/cbc/DATA_FLOW_VALIDATION_COMPLETE.md"
    "/home/gu-da/cbc/DATABASE_AND_DATAFLOW_SUMMARY.md"
)

for doc in "${docs[@]}"; do
    if check_file "$doc"; then
        echo -e "${GREEN}✓${NC} $(basename $doc) exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $(basename $doc) NOT found"
        ((FAILED++))
    fi
done

echo ""
echo "7. Testing Database Connectivity..."
echo "===================================="

# Test PostgreSQL
if command -v psql &> /dev/null; then
    if psql -h localhost -U postgres -d coffee_export_db -c "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL connection successful"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} PostgreSQL connection failed"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} psql not installed, skipping PostgreSQL test"
fi

# Test Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli -h localhost ping &>/dev/null; then
        echo -e "${GREEN}✓${NC} Redis connection successful"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Redis connection failed"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} redis-cli not installed, skipping Redis test"
fi

# Test IPFS
if curl -s http://localhost:5001/api/v0/id &>/dev/null; then
    echo -e "${GREEN}✓${NC} IPFS connection successful"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} IPFS connection failed"
    ((FAILED++))
fi

echo ""
echo "8. Checking Database Tables..."
echo "=============================="

if command -v psql &> /dev/null; then
    TABLES=$(psql -h localhost -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    if [ "$TABLES" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Database has $TABLES tables"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} No tables found in database"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} psql not installed, skipping table check"
fi

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start API services: npm start (in each API directory)"
    echo "2. Test API health: curl http://localhost:3001/health"
    echo "3. Check logs for any errors"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure Docker containers are running: docker-compose -f docker-compose.postgres.yml up -d"
    echo "2. Check container logs: docker logs <container_name>"
    echo "3. Verify .env files have correct configuration"
    echo "4. Review DATABASE_CONFIGURATION_AUDIT_COMPLETE.md for detailed troubleshooting"
    echo ""
    exit 1
fi
