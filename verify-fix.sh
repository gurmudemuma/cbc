#!/bin/bash

# Comprehensive verification script for Export Management fix
echo "=========================================="
echo "Export Management Fix Verification"
echo "=========================================="
echo ""

PASS=0
FAIL=0

# Test 1: Backend Health
echo "Test 1: Backend Health Check"
HEALTH=$(curl -s http://localhost:3001/health)
FABRIC_STATUS=$(echo "$HEALTH" | jq -r '.fabric')

if [ "$FABRIC_STATUS" = "connected" ]; then
    echo "✅ PASS: Backend is healthy and Fabric is connected"
    ((PASS++))
else
    echo "❌ FAIL: Backend issue - Fabric status: $FABRIC_STATUS"
    ((FAIL++))
fi
echo ""

# Test 2: Backend Readiness
echo "Test 2: Backend Readiness Check"
READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ready)

if [ "$READY_STATUS" = "200" ]; then
    echo "✅ PASS: Backend is ready"
    ((PASS++))
else
    echo "❌ FAIL: Backend not ready - Status: $READY_STATUS"
    ((FAIL++))
fi
echo ""

# Test 3: User Registration
echo "Test 3: User Registration (if needed)"
REG_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "username": "verifyuser",
        "password": "V3r1fyUs3r!@#$",
        "email": "verify@test.com",
        "organizationId": "commercialbank-001",
        "role": "exporter"
    }')

REG_SUCCESS=$(echo "$REG_RESPONSE" | jq -r '.success')
if [ "$REG_SUCCESS" = "true" ]; then
    echo "✅ PASS: New user registered successfully"
    ((PASS++))
    TOKEN=$(echo "$REG_RESPONSE" | jq -r '.data.token')
else
    # User might already exist, try login
    echo "ℹ️  Registration skipped (user may exist), trying login..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"testexporter","password":"T3stExp0rt3r!@#$"}')
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .token // empty')
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "✅ PASS: Login successful with existing user"
        ((PASS++))
    else
        echo "❌ FAIL: Could not register or login"
        ((FAIL++))
        TOKEN=""
    fi
fi
echo ""

# Test 4: Exports Endpoint (Direct)
if [ -n "$TOKEN" ]; then
    echo "Test 4: Direct Exports Endpoint"
    EXPORTS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:3001/api/exports)
    
    HTTP_STATUS=$(echo "$EXPORTS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    BODY=$(echo "$EXPORTS_RESPONSE" | sed '/HTTP_STATUS/d')
    
    if [ "$HTTP_STATUS" = "200" ]; then
        SUCCESS=$(echo "$BODY" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            COUNT=$(echo "$BODY" | jq -r '.count')
            echo "✅ PASS: Exports endpoint returns 200 OK (count: $COUNT)"
            ((PASS++))
        else
            echo "❌ FAIL: Response success=false"
            ((FAIL++))
        fi
    else
        echo "❌ FAIL: Unexpected status $HTTP_STATUS"
        echo "   Body: $BODY"
        ((FAIL++))
    fi
    echo ""
    
    # Test 5: Exports Endpoint (Via Proxy)
    echo "Test 5: Exports Endpoint via Vite Proxy"
    PROXY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:5173/api/exporter/exports)
    
    PROXY_STATUS=$(echo "$PROXY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    PROXY_BODY=$(echo "$PROXY_RESPONSE" | sed '/HTTP_STATUS/d')
    
    if [ "$PROXY_STATUS" = "200" ]; then
        PROXY_SUCCESS=$(echo "$PROXY_BODY" | jq -r '.success')
        if [ "$PROXY_SUCCESS" = "true" ]; then
            echo "✅ PASS: Vite proxy correctly routes to backend"
            ((PASS++))
        else
            echo "❌ FAIL: Proxy response success=false"
            ((FAIL++))
        fi
    else
        echo "❌ FAIL: Proxy returned status $PROXY_STATUS"
        ((FAIL++))
    fi
    echo ""
else
    echo "⚠️  SKIP: Tests 4-5 skipped (no auth token)"
    echo ""
fi

# Test 6: Frontend Server
echo "Test 6: Frontend Server Check"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ PASS: Frontend server is running"
    ((PASS++))
else
    echo "❌ FAIL: Frontend server not responding - Status: $FRONTEND_STATUS"
    ((FAIL++))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 All tests passed! Export Management is working correctly."
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. Login with: testexporter / T3stExp0rt3r!@#$"
    echo "3. Navigate to Export Management"
    echo "4. You should see 'No exports found' (not a 500 error)"
    exit 0
else
    echo "⚠️  Some tests failed. Please review the errors above."
    exit 1
fi
