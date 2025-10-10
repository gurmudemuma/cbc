#!/bin/bash

# Authentication Testing Script
# Tests JWT secret validation, password requirements, and authentication flows

set -e

API_BASE="http://localhost:3001"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}Authentication Security Tests${NC}"
echo -e "${BOLD}========================================${NC}\n"

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Function to run test
run_test() {
    local test_name="$1"
    local expected_result="$2"
    shift 2
    local response="$@"
    
    TOTAL=$((TOTAL + 1))
    echo -e "${BOLD}Test $TOTAL: $test_name${NC}"
    
    if echo "$response" | grep -q "$expected_result"; then
        echo -e "${GREEN}✓ PASSED${NC}\n"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        echo ""
        FAILED=$((FAILED + 1))
    fi
}

echo -e "${YELLOW}=== Password Validation Tests ===${NC}\n"

# Test 1: Password too short (should fail)
echo "Test 1: Reject password < 12 characters"
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser1",
    "password": "Short1!",
    "email": "test1@example.com"
  }')
run_test "Password too short" "Password must be between 12 and 128 characters" "$RESPONSE"

# Test 2: Password without uppercase (should fail)
echo "Test 2: Reject password without uppercase"
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "password": "lowercase123!",
    "email": "test2@example.com"
  }')
run_test "No uppercase letter" "uppercase" "$RESPONSE"

# Test 3: Password without special character (should fail)
echo "Test 3: Reject password without special character"
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser3",
    "password": "NoSpecial123",
    "email": "test3@example.com"
  }')
run_test "No special character" "special character" "$RESPONSE"

# Test 4: Common weak password (should fail)
echo "Test 4: Reject common weak password"
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser4",
    "password": "Password123!",
    "email": "test4@example.com"
  }')
run_test "Common password" "too common" "$RESPONSE"

# Test 5: Sequential characters (should fail)
echo "Test 5: Reject sequential characters"
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser5",
    "password": "Abc123456789!",
    "email": "test5@example.com"
  }')
run_test "Sequential characters" "sequential" "$RESPONSE"

# Test 6: Repeated characters (should fail)
echo "Test 6: Reject repeated characters"
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser6",
    "password": "Aaa123456789!",
    "email": "test6@example.com"
  }')
run_test "Repeated characters" "repeated" "$RESPONSE"

# Test 7: Strong password (should succeed)
echo "Test 7: Accept strong password"
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser${TIMESTAMP}\",
    \"password\": \"MyStr0ng!P@ssw0rd\",
    \"email\": \"test${TIMESTAMP}@example.com\"
  }")
run_test "Strong password accepted" "success" "$RESPONSE"

# Extract token for further tests
TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Token obtained: ${TOKEN:0:20}...${NC}\n"
    
    echo -e "${YELLOW}=== Authentication Flow Tests ===${NC}\n"
    
    # Test 8: Login with correct credentials
    echo "Test 8: Login with correct credentials"
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"testuser${TIMESTAMP}\",
        \"password\": \"MyStr0ng!P@ssw0rd\"
      }")
    run_test "Successful login" "success" "$LOGIN_RESPONSE"
    
    # Test 9: Login with wrong password
    echo "Test 9: Login with wrong password"
    WRONG_LOGIN=$(curl -s -X POST "$API_BASE/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"testuser${TIMESTAMP}\",
        \"password\": \"WrongPassword123!\"
      }")
    run_test "Wrong password rejected" "Invalid credentials" "$WRONG_LOGIN"
    
    # Test 10: Access protected endpoint with token
    echo "Test 10: Access protected endpoint with valid token"
    PROTECTED=$(curl -s -X GET "$API_BASE/api/exports" \
      -H "Authorization: Bearer $TOKEN")
    run_test "Protected endpoint access" "success" "$PROTECTED"
    
    # Test 11: Access protected endpoint without token
    echo "Test 11: Access protected endpoint without token"
    NO_TOKEN=$(curl -s -X GET "$API_BASE/api/exports")
    run_test "No token rejected" "No token provided" "$NO_TOKEN"
    
    # Test 12: Token refresh
    echo "Test 12: Token refresh"
    REFRESH=$(curl -s -X POST "$API_BASE/api/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"token\": \"$TOKEN\"}")
    run_test "Token refresh" "success" "$REFRESH"
    
else
    echo -e "${RED}✗ Failed to obtain token, skipping authentication flow tests${NC}\n"
    FAILED=$((FAILED + 6))
    TOTAL=$((TOTAL + 6))
fi

echo -e "${YELLOW}=== JWT Secret Validation Tests ===${NC}\n"

# Test 13: Service should have started (if this script runs, it means JWT_SECRET is set)
echo "Test 13: Service started with JWT_SECRET"
HEALTH=$(curl -s -X GET "$API_BASE/health")
run_test "Service running" "ok" "$HEALTH"

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
