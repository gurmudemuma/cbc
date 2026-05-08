#!/bin/bash
# Test dashboard data consistency

echo "=========================================="
echo "Testing Dashboard Data Consistency"
echo "=========================================="
echo ""

# Get auth token for exporter1
echo "1. Getting auth token for exporter1..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"exporter1","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "[ERROR] Failed to get auth token"
  exit 1
fi

echo "[OK] Got token: ${TOKEN:0:20}..."
echo ""

# Test dashboard endpoint
echo "2. Testing /api/exporter/dashboard endpoint..."
DASHBOARD=$(curl -s -X GET http://localhost:3000/api/exporter/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Dashboard Response:"
echo "$DASHBOARD" | jq '.' 2>/dev/null || echo "$DASHBOARD"
echo ""

# Check if data is present
echo "3. Validating dashboard data..."
if echo "$DASHBOARD" | grep -q "identity"; then
  echo "[OK] Identity data present"
else
  echo "[ERROR] Identity data missing"
fi

if echo "$DASHBOARD" | grep -q "compliance"; then
  echo "[OK] Compliance data present"
else
  echo "[ERROR] Compliance data missing"
fi

if echo "$DASHBOARD" | grep -q "contact"; then
  echo "[OK] Contact data present"
else
  echo "[ERROR] Contact data missing"
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
