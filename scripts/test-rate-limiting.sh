#!/bin/bash

# Rate Limiting Test Script
# Tests that rate limiting is working correctly on all APIs

echo "================================================"
echo "Coffee Export Consortium - Rate Limiting Test"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test rate limiting on a service
test_rate_limiting() {
    local service_name=$1
    local port=$2
    local url="http://localhost:${port}/api/auth/login"
    
    echo "Testing ${service_name} (port ${port})"
    echo "----------------------------"
    echo "Sending 10 requests to auth endpoint..."
    echo ""
    
    local blocked=0
    local success=0
    
    for i in {1..10}; do
        echo -n "Request $i: "
        
        response=$(curl -s -w "\n%{http_code}" -X POST "${url}" \
            -H "Content-Type: application/json" \
            -d '{"username":"test","password":"test"}' \
            2>/dev/null)
        
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "429" ]; then
            echo -e "${YELLOW}429 Too Many Requests${NC} ✓"
            ((blocked++))
        elif [ "$http_code" = "401" ] || [ "$http_code" = "400" ]; then
            echo -e "${BLUE}${http_code} (Auth failed - expected)${NC}"
            ((success++))
        else
            echo -e "${RED}${http_code} (Unexpected)${NC}"
        fi
        
        sleep 0.5
    done
    
    echo ""
    echo "Results:"
    echo "  Successful requests: $success"
    echo "  Rate limited: $blocked"
    
    if [ $blocked -gt 0 ]; then
        echo -e "  ${GREEN}✓ Rate limiting is working!${NC}"
        echo ""
        return 0
    else
        echo -e "  ${RED}✗ Rate limiting may not be working${NC}"
        echo ""
        return 1
    fi
}

# Test all services
echo "Testing Rate Limiting on All Services:"
echo "======================================"
echo ""

failed=0

test_rate_limiting "commercialbank API" 3001 || ((failed++))
test_rate_limiting "National Bank API" 3002 || ((failed++))
test_rate_limiting "ECTA API" 3003 || ((failed++))
test_rate_limiting "Shipping Line API" 3004 || ((failed++))

# Summary
echo "================================================"
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ Rate limiting working on all services!${NC}"
    echo "================================================"
    echo ""
    echo "Note: Rate limits are:"
    echo "  - Auth endpoints: 5 requests per 15 minutes"
    echo "  - API endpoints: 100 requests per 15 minutes"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $failed service(s) may have rate limiting issues${NC}"
    echo "================================================"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify express-rate-limit is installed"
    echo "2. Check rate limiter configuration in index.ts"
    echo "3. Ensure rate limiters are applied to routes"
    echo ""
    exit 1
fi
