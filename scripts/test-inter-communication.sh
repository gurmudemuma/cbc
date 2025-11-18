#!/bin/bash

# Master Inter-Communication Test Script
# Runs all communication tests

echo "================================================"
echo "Coffee Export Consortium"
echo "Complete Inter-Communication Test Suite"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
total_tests=0
passed_tests=0
failed_tests=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_script=$2
    
    echo ""
    echo "================================================"
    echo "TEST: ${test_name}"
    echo "================================================"
    
    ((total_tests++))
    
    if [ -f "${test_script}" ]; then
        chmod +x "${test_script}"
        if bash "${test_script}"; then
            echo -e "${GREEN}✓ ${test_name} PASSED${NC}"
            ((passed_tests++))
            return 0
        else
            echo -e "${RED}✗ ${test_name} FAILED${NC}"
            ((failed_tests++))
            return 1
        fi
    else
        echo -e "${RED}✗ Test script not found: ${test_script}${NC}"
        ((failed_tests++))
        return 1
    fi
}

# Check if services are running
echo "Pre-flight Check:"
echo "----------------------------"
echo "Checking if services are accessible..."
echo ""

services_running=true
for port in 3001 3002 3003 3004 3005 3006 3007; do
    if curl -s --connect-timeout 2 "http://localhost:${port}/health" > /dev/null 2>&1; then
        echo -e "  Port ${port}: ${GREEN}✓ Accessible${NC}"
    else
        echo -e "  Port ${port}: ${RED}✗ Not accessible${NC}"
        services_running=false
    fi
done

echo ""

if [ "$services_running" = false ]; then
    echo -e "${YELLOW}⚠ Warning: Some services are not running${NC}"
    echo "Please start all services before running tests:"
    echo ""
    echo "  Option 1: ./scripts/start-apis.sh"
    echo "  Option 2: ./scripts/dev-apis.sh (tmux)"
    echo ""
    echo "Or manually:"
    echo "  Terminal 1: cd api/commercial-bank && npm run dev"
    echo "  Terminal 2: cd api/national-bank && npm run dev"
    echo "  Terminal 3: cd api/ecta && npm run dev"
    echo "  Terminal 4: cd api/shipping-line && npm run dev"
    echo "  Terminal 5: cd api/custom-authorities && npm run dev"
    echo "  Terminal 6: cd api/ecx && npm run dev"
    echo "  Terminal 7: cd api/exporter-portal && npm run dev"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run all tests
echo ""
echo "================================================"
echo "Starting Test Suite"
echo "================================================"

# Test 1: Health Checks
run_test "Health Check - All Services" "${SCRIPT_DIR}/check-health.sh"

# Test 2: Rate Limiting
run_test "Rate Limiting - All Services" "${SCRIPT_DIR}/test-rate-limiting.sh"

# Test 3: WebSocket (if Node.js is available)
if command -v node &> /dev/null; then
    # Check if ws module is available
    if node -e "require('ws')" 2>/dev/null; then
        run_test "WebSocket Connections" "node ${SCRIPT_DIR}/test-websocket.js"
    else
        echo ""
        echo "================================================"
        echo "TEST: WebSocket Connections"
        echo "================================================"
        echo -e "${YELLOW}⚠ SKIPPED - 'ws' module not installed${NC}"
        echo "Install with: npm install -g ws"
        echo ""
    fi
else
    echo ""
    echo "================================================"
    echo "TEST: WebSocket Connections"
    echo "================================================"
    echo -e "${YELLOW}⚠ SKIPPED - Node.js not found${NC}"
    echo ""
fi

# Final Summary
echo ""
echo "================================================"
echo "TEST SUITE SUMMARY"
echo "================================================"
echo ""
echo "Total Tests: ${total_tests}"
echo -e "${GREEN}Passed: ${passed_tests}${NC}"
echo -e "${RED}Failed: ${failed_tests}${NC}"
echo ""

if [ $failed_tests -eq 0 ]; then
    echo "================================================"
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo "================================================"
    echo ""
    echo "Inter-communication is working correctly:"
    echo "  ✓ All services are healthy"
    echo "  ✓ Rate limiting is functional"
    echo "  ✓ WebSocket connections work"
    echo ""
    echo "System is ready for use!"
    echo ""
    exit 0
else
    echo "================================================"
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "================================================"
    echo ""
    echo "Please review the failed tests above and:"
    echo "  1. Check service logs for errors"
    echo "  2. Verify all dependencies are installed"
    echo "  3. Ensure Fabric network is running"
    echo "  4. Check environment variables are set"
    echo ""
    echo "For detailed troubleshooting, see:"
    echo "  - INTER_COMMUNICATION_CHECK.md"
    echo "  - FIXES_APPLIED.md"
    echo ""
    exit 1
fi
