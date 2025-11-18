#!/bin/bash

# Health Check Script for All APIs
# Tests inter-communication by checking all service health endpoints

echo "================================================"
echo "Coffee Export Consortium - Health Check"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check health endpoint
check_health() {
    local service_name=$1
    local port=$2
    local url="http://localhost:${port}/health"
    
    echo -n "Checking ${service_name} (port ${port})... "
    
    # Make request with timeout
    response=$(curl -s -w "\n%{http_code}" --connect-timeout 5 --max-time 10 "${url}" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        echo "  Response: $body"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  HTTP Code: $http_code"
        echo "  Response: $body"
        return 1
    fi
}

# Check all services
echo "Testing API Health Endpoints:"
echo "----------------------------"
echo ""

failed=0

check_health "Commercial Bank API" 3001 || ((failed++))
echo ""

check_health "National Bank (NBE) API" 3002 || ((failed++))
echo ""

check_health "ECTA API" 3003 || ((failed++))
echo ""

check_health "Shipping Line API" 3004 || ((failed++))
echo ""

check_health "Customs API" 3005 || ((failed++))
echo ""

check_health "ECX API" 3006 || ((failed++))
echo ""

check_health "Exporter Portal API" 3007 || ((failed++))
echo ""

# Summary
echo "================================================"
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy!${NC}"
    echo "================================================"
    exit 0
else
    echo -e "${RED}✗ $failed service(s) failed health check${NC}"
    echo "================================================"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure all services are running"
    echo "2. Check if ports are not already in use"
    echo "3. Review service logs for errors"
    echo "4. Verify Fabric network is running"
    exit 1
fi
