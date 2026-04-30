#!/bin/bash

# Test the approve endpoint
# This script tests if the approve endpoint works correctly

EXPORTER_ID="ec789d55-3787-4116-abe9-6da12bbf54b8"
GATEWAY_URL="http://localhost:3000"

echo "Testing approve endpoint..."
echo "Exporter ID: $EXPORTER_ID"
echo ""

# Note: This will fail with 401 if not authenticated
# But it will show if the route exists (404 vs 401)

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"comments": "Test approval"}' \
  "$GATEWAY_URL/api/ecta/preregistration/exporters/$EXPORTER_ID/approve" \
  -v

echo ""
echo "If you see 401 Unauthorized, the route exists but needs authentication"
echo "If you see 404 Not Found, the route doesn't exist"
