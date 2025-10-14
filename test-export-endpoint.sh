#!/bin/bash

# Test script for Export Management endpoint
echo "=================================="
echo "Testing Export Management Endpoint"
echo "=================================="
echo ""

# Step 1: Check backend health
echo "1. Checking backend health..."
HEALTH=$(curl -s http://localhost:3001/health)
FABRIC_STATUS=$(echo "$HEALTH" | jq -r '.fabric')

if [ "$FABRIC_STATUS" = "connected" ]; then
    echo "✅ Backend is healthy and Fabric is connected"
else
    echo "❌ Backend issue: Fabric status = $FABRIC_STATUS"
    exit 1
fi

echo ""

# Step 2: Login to get a token
echo "2. Attempting login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"exporter1","password":"aT*7L7Q?y4ZP&Q0i"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "⚠️  Login failed (this is expected if user doesn't exist)"
    echo "   Response: $LOGIN_RESPONSE"
    echo ""
    echo "3. Testing /api/exports without auth (should get 401)..."
    EXPORTS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3001/api/exports)
    HTTP_STATUS=$(echo "$EXPORTS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    BODY=$(echo "$EXPORTS_RESPONSE" | sed '/HTTP_STATUS/d')
    
    if [ "$HTTP_STATUS" = "401" ]; then
        echo "✅ Correctly returns 401 Unauthorized"
        echo "   Message: $(echo "$BODY" | jq -r '.message')"
    else
        echo "❌ Unexpected status: $HTTP_STATUS"
        echo "   Body: $BODY"
    fi
else
    echo "✅ Login successful, token obtained"
    echo ""
    
    # Step 3: Test /api/exports with auth
    echo "3. Testing /api/exports with authentication..."
    EXPORTS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:3001/api/exports)
    
    HTTP_STATUS=$(echo "$EXPORTS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    BODY=$(echo "$EXPORTS_RESPONSE" | sed '/HTTP_STATUS/d')
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Successfully retrieved exports"
        COUNT=$(echo "$BODY" | jq -r '.count')
        echo "   Export count: $COUNT"
    elif [ "$HTTP_STATUS" = "503" ]; then
        echo "⚠️  Service unavailable (Fabric not connected)"
        echo "   Message: $(echo "$BODY" | jq -r '.message')"
    else
        echo "❌ Unexpected status: $HTTP_STATUS"
        echo "   Body: $BODY"
    fi
fi

echo ""
echo "=================================="
echo "Test Complete"
echo "=================================="
