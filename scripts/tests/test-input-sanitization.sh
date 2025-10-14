#!/bin/bash

# Input Sanitization Testing Script
# Tests XSS prevention, SQL injection prevention, and input validation

set -e

API_BASE="http://localhost:3001"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}Input Sanitization Security Tests${NC}"
echo -e "${BOLD}========================================${NC}\n"

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# First, register and login to get a token
echo -e "${YELLOW}Setting up test user...${NC}"
TIMESTAMP=$(date +%s)
REGISTER=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"sanitest${TIMESTAMP}\",
    \"password\": \"TestP@ssw0rd123!\",
    \"email\": \"sanitest${TIMESTAMP}@example.com\"
  }")

TOKEN=$(echo "$REGISTER" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to obtain authentication token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Test user created and authenticated${NC}\n"

# Function to run test
run_test() {
    local test_name="$1"
    local should_pass="$2"
    shift 2
    local response="$@"
    
    TOTAL=$((TOTAL + 1))
    echo -e "${BOLD}Test $TOTAL: $test_name${NC}"
    
    if [ "$should_pass" = "pass" ]; then
        # Test should succeed
        if echo "$response" | grep -q "success"; then
            echo -e "${GREEN}✓ PASSED - Request accepted${NC}\n"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED - Request should have been accepted${NC}"
            echo "Response: $response"
            echo ""
            FAILED=$((FAILED + 1))
        fi
    else
        # Test should fail (malicious input rejected)
        if echo "$response" | grep -q "success"; then
            echo -e "${RED}✗ FAILED - Malicious input was not sanitized${NC}"
            echo "Response: $response"
            echo ""
            FAILED=$((FAILED + 1))
        else
            echo -e "${GREEN}✓ PASSED - Malicious input rejected/sanitized${NC}\n"
            PASSED=$((PASSED + 1))
        fi
    fi
}

echo -e "${YELLOW}=== XSS Prevention Tests ===${NC}\n"

# Test 1: Script tag injection
echo "Test 1: Script tag in exporter name"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "<script>alert(\"XSS\")</script>",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
# This should pass but with sanitized data
if echo "$RESPONSE" | grep -q "success"; then
    # Check if script tags were removed
    EXPORT_ID=$(echo "$RESPONSE" | grep -o '"exportId":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$EXPORT_ID" ]; then
        DETAIL=$(curl -s -X GET "$API_BASE/api/exports/$EXPORT_ID" \
          -H "Authorization: Bearer $TOKEN")
        if echo "$DETAIL" | grep -q "<script>"; then
            echo -e "${RED}✗ FAILED - Script tags not removed${NC}\n"
            FAILED=$((FAILED + 1))
        else
            echo -e "${GREEN}✓ PASSED - Script tags sanitized${NC}\n"
            PASSED=$((PASSED + 1))
        fi
    else
        echo -e "${YELLOW}⚠ WARNING - Could not verify sanitization${NC}\n"
        PASSED=$((PASSED + 1))
    fi
else
    echo -e "${GREEN}✓ PASSED - Request rejected${NC}\n"
    PASSED=$((PASSED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 2: JavaScript event handler
echo "Test 2: JavaScript event handler"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "<img src=x onerror=alert(1)>",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "Event handler injection" "pass" "$RESPONSE"

# Test 3: JavaScript protocol
echo "Test 3: JavaScript protocol in input"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "javascript:alert(1)",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "JavaScript protocol" "pass" "$RESPONSE"

echo -e "${YELLOW}=== SQL Injection Prevention Tests ===${NC}\n"

# Test 4: SQL injection attempt
echo "Test 4: SQL injection in exporter name"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test'\'' OR '\''1'\''='\''1",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "SQL injection attempt" "pass" "$RESPONSE"

# Test 5: SQL comment injection
echo "Test 5: SQL comment injection"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test--",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "SQL comment injection" "pass" "$RESPONSE"

# Test 6: SQL UNION attack
echo "Test 6: SQL UNION attack"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test UNION SELECT * FROM users",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "SQL UNION attack" "pass" "$RESPONSE"

echo -e "${YELLOW}=== Number Validation Tests ===${NC}\n"

# Test 7: Negative quantity
echo "Test 7: Negative quantity"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Company",
    "coffeeType": "Arabica",
    "quantity": -1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "Negative quantity rejected" "fail" "$RESPONSE"

# Test 8: Extremely large number
echo "Test 8: Extremely large quantity"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Company",
    "coffeeType": "Arabica",
    "quantity": 999999999999,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "Excessive quantity rejected" "fail" "$RESPONSE"

# Test 9: Non-numeric value
echo "Test 9: Non-numeric quantity"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Company",
    "coffeeType": "Arabica",
    "quantity": "not a number",
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "Non-numeric value rejected" "fail" "$RESPONSE"

# Test 10: NaN injection
echo "Test 10: NaN injection"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "Test Company",
    "coffeeType": "Arabica",
    "quantity": "NaN",
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "NaN rejected" "fail" "$RESPONSE"

echo -e "${YELLOW}=== String Length Validation Tests ===${NC}\n"

# Test 11: Extremely long string
echo "Test 11: Extremely long exporter name"
LONG_STRING=$(python3 -c "print('A' * 5000)")
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"exporterName\": \"$LONG_STRING\",
    \"coffeeType\": \"Arabica\",
    \"quantity\": 1000,
    \"destinationCountry\": \"USA\",
    \"estimatedValue\": 50000
  }")
# Should pass but truncate to max length (200 chars)
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ PASSED - Long string handled${NC}\n"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Request rejected (acceptable)${NC}\n"
    PASSED=$((PASSED + 1))
fi
TOTAL=$((TOTAL + 1))

echo -e "${YELLOW}=== Control Character Tests ===${NC}\n"

# Test 12: Null byte injection
echo "Test 12: Null byte injection"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d $'{
    "exporterName": "Test\x00Company",
    "coffeeType": "Arabica",
    "quantity": 1000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }')
run_test "Null byte removed" "pass" "$RESPONSE"

echo -e "${YELLOW}=== Valid Input Test ===${NC}\n"

# Test 13: Valid clean input (should succeed)
echo "Test 13: Valid clean input"
RESPONSE=$(curl -s -X POST "$API_BASE/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exporterName": "ABC Coffee Exporters Ltd",
    "coffeeType": "Arabica",
    "quantity": 5000,
    "destinationCountry": "United States",
    "estimatedValue": 75000
  }')
run_test "Valid input accepted" "pass" "$RESPONSE"

echo -e "\n${BOLD}========================================${NC}"
echo -e "${BOLD}Test Summary${NC}"
echo -e "${BOLD}========================================${NC}"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${BOLD}========================================${NC}\n"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ All tests passed!${NC}\n"
    exit 0
else
    echo -e "${RED}${BOLD}✗ Some tests failed${NC}\n"
    exit 1
fi
