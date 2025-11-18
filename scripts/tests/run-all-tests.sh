#!/bin/bash

# Master Test Runner
# Runs all security tests and generates a report

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}========================================${NC}"
echo -e "${BOLD}${BLUE}Coffee Export Blockchain${NC}"
echo -e "${BOLD}${BLUE}Security Test Suite${NC}"
echo -e "${BOLD}${BLUE}========================================${NC}\n"

# Check if services are running
echo -e "${YELLOW}Checking if services are running...${NC}"
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${RED}✗ commercialbank API is not running on port 3001${NC}"
    echo -e "${YELLOW}Please start the service with:${NC}"
    echo -e "  cd api/commercial-bank && npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ commercialbank API is running${NC}\n"

# Create test results directory
RESULTS_DIR="test-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/test-report-$TIMESTAMP.txt"

echo -e "${BOLD}Test Results will be saved to: $REPORT_FILE${NC}\n"

# Initialize report
{
    echo "========================================="
    echo "Security Test Report"
    echo "========================================="
    echo "Date: $(date)"
    echo "Environment: Development"
    echo "========================================="
    echo ""
} > "$REPORT_FILE"

# Test 1: Authentication Tests
echo -e "${BOLD}${YELLOW}Running Authentication Tests...${NC}"
echo "=========================================" >> "$REPORT_FILE"
echo "1. AUTHENTICATION TESTS" >> "$REPORT_FILE"
echo "=========================================" >> "$REPORT_FILE"

if ./test-authentication.sh 2>&1 | tee -a "$REPORT_FILE"; then
    AUTH_RESULT="${GREEN}✓ PASSED${NC}"
    AUTH_EXIT=0
else
    AUTH_RESULT="${RED}✗ FAILED${NC}"
    AUTH_EXIT=1
fi
echo "" >> "$REPORT_FILE"

# Test 2: Input Sanitization Tests
echo -e "\n${BOLD}${YELLOW}Running Input Sanitization Tests...${NC}"
echo "=========================================" >> "$REPORT_FILE"
echo "2. INPUT SANITIZATION TESTS" >> "$REPORT_FILE"
echo "=========================================" >> "$REPORT_FILE"

if ./test-input-sanitization.sh 2>&1 | tee -a "$REPORT_FILE"; then
    SANIT_RESULT="${GREEN}✓ PASSED${NC}"
    SANIT_EXIT=0
else
    SANIT_RESULT="${RED}✗ FAILED${NC}"
    SANIT_EXIT=1
fi
echo "" >> "$REPORT_FILE"

# Generate summary
echo -e "\n${BOLD}${BLUE}========================================${NC}"
echo -e "${BOLD}${BLUE}Test Suite Summary${NC}"
echo -e "${BOLD}${BLUE}========================================${NC}"

{
    echo ""
    echo "========================================="
    echo "OVERALL SUMMARY"
    echo "========================================="
} >> "$REPORT_FILE"

echo -e "${BOLD}1. Authentication Tests:${NC} $AUTH_RESULT"
echo "1. Authentication Tests: $([ $AUTH_EXIT -eq 0 ] && echo 'PASSED' || echo 'FAILED')" >> "$REPORT_FILE"

echo -e "${BOLD}2. Input Sanitization Tests:${NC} $SANIT_RESULT"
echo "2. Input Sanitization Tests: $([ $SANIT_EXIT -eq 0 ] && echo 'PASSED' || echo 'FAILED')" >> "$REPORT_FILE"

echo -e "${BOLD}${BLUE}========================================${NC}\n"
echo "=========================================" >> "$REPORT_FILE"

# Overall result
TOTAL_EXIT=$((AUTH_EXIT + SANIT_EXIT))

if [ $TOTAL_EXIT -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ ALL TEST SUITES PASSED!${NC}\n"
    echo "OVERALL RESULT: ALL TESTS PASSED" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "All security measures are working correctly." >> "$REPORT_FILE"
else
    echo -e "${RED}${BOLD}✗ SOME TEST SUITES FAILED${NC}\n"
    echo "OVERALL RESULT: SOME TESTS FAILED" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Please review the failures above and fix the issues." >> "$REPORT_FILE"
fi

echo -e "${BOLD}Full report saved to: $REPORT_FILE${NC}\n"

# Display next steps
echo -e "${BOLD}${YELLOW}Next Steps:${NC}"
if [ $TOTAL_EXIT -eq 0 ]; then
    echo -e "1. ${GREEN}✓${NC} All security tests passed"
    echo -e "2. Review the test report: ${BOLD}$REPORT_FILE${NC}"
    echo -e "3. Continue with remaining security fixes (encryption, rate limiting)"
    echo -e "4. Deploy to staging environment for further testing"
else
    echo -e "1. ${RED}✗${NC} Review failed tests in: ${BOLD}$REPORT_FILE${NC}"
    echo -e "2. Fix the identified issues"
    echo -e "3. Re-run tests: ${BOLD}./run-all-tests.sh${NC}"
fi

echo ""
exit $TOTAL_EXIT
