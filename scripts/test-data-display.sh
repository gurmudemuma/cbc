#!/bin/bash

# Test script to verify data display on dashboards
# This script tests the complete flow from export creation to dashboard display

set -e

echo "=========================================="
echo "Testing Data Display on Dashboards"
echo "=========================================="
echo ""

# Configuration
GATEWAY_URL="http://localhost:3000"
TOKEN=""
EXPORTER_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Login as exporter
echo "Step 1: Login as exporter..."
LOGIN_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter1",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // .token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id // .user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    print_error "Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Login successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get exporter profile
echo "Step 2: Getting exporter profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$GATEWAY_URL/api/exporter/profile" \
  -H "Authorization: Bearer $TOKEN")

EXPORTER_ID=$(echo $PROFILE_RESPONSE | jq -r '.data.exporterId // .exporterId')

if [ "$EXPORTER_ID" == "null" ] || [ -z "$EXPORTER_ID" ]; then
    print_error "Failed to get exporter profile"
    echo "Response: $PROFILE_RESPONSE"
    exit 1
fi

print_success "Exporter profile retrieved"
echo "Exporter ID: $EXPORTER_ID"
echo ""

# Step 3: Check stats BEFORE creating export
echo "Step 3: Checking stats BEFORE creating export..."
STATS_BEFORE=$(curl -s -X GET "$GATEWAY_URL/api/exports/stats" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_BEFORE=$(echo $STATS_BEFORE | jq -r '.data.totalExports')
VALUE_BEFORE=$(echo $STATS_BEFORE | jq -r '.data.totalValue')

print_info "Stats before:"
echo "  Total Exports: $TOTAL_BEFORE"
echo "  Total Value: $VALUE_BEFORE"
echo ""

# Step 4: Create a new export
echo "Step 4: Creating a new export..."
EXPORT_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coffeeType": "Arabica Grade 1",
    "quantity": 1000,
    "destinationCountry": "Germany",
    "estimatedValue": 50000,
    "currency": "USD",
    "buyerCompanyName": "German Coffee Importers GmbH",
    "buyerCountry": "Germany"
  }')

EXPORT_ID=$(echo $EXPORT_RESPONSE | jq -r '.exportId // .data.export_id')

if [ "$EXPORT_ID" == "null" ] || [ -z "$EXPORT_ID" ]; then
    print_error "Failed to create export"
    echo "Response: $EXPORT_RESPONSE"
    exit 1
fi

print_success "Export created successfully"
echo "Export ID: $EXPORT_ID"
echo ""

# Step 5: Wait a moment for database sync
echo "Step 5: Waiting for database sync..."
sleep 2
print_success "Wait complete"
echo ""

# Step 6: Check stats AFTER creating export
echo "Step 6: Checking stats AFTER creating export..."
STATS_AFTER=$(curl -s -X GET "$GATEWAY_URL/api/exports/stats" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_AFTER=$(echo $STATS_AFTER | jq -r '.data.totalExports')
VALUE_AFTER=$(echo $STATS_AFTER | jq -r '.data.totalValue')

print_info "Stats after:"
echo "  Total Exports: $TOTAL_AFTER"
echo "  Total Value: $VALUE_AFTER"
echo ""

# Step 7: Verify the data increased
echo "Step 7: Verifying data increased..."

if [ "$TOTAL_AFTER" -gt "$TOTAL_BEFORE" ]; then
    print_success "Total exports increased from $TOTAL_BEFORE to $TOTAL_AFTER"
else
    print_error "Total exports did NOT increase (Before: $TOTAL_BEFORE, After: $TOTAL_AFTER)"
    echo "This indicates the export was not saved to PostgreSQL!"
    exit 1
fi

if (( $(echo "$VALUE_AFTER > $VALUE_BEFORE" | bc -l) )); then
    print_success "Total value increased from $VALUE_BEFORE to $VALUE_AFTER"
else
    print_error "Total value did NOT increase (Before: $VALUE_BEFORE, After: $VALUE_AFTER)"
    echo "This indicates the export value was not saved correctly!"
    exit 1
fi

echo ""

# Step 8: Get exports list
echo "Step 8: Getting exports list..."
EXPORTS_LIST=$(curl -s -X GET "$GATEWAY_URL/api/exports" \
  -H "Authorization: Bearer $TOKEN")

EXPORTS_COUNT=$(echo $EXPORTS_LIST | jq -r '.exports | length')

print_info "Exports list retrieved:"
echo "  Count: $EXPORTS_COUNT"
echo ""

# Step 9: Verify the new export is in the list
echo "Step 9: Verifying new export is in the list..."
FOUND_EXPORT=$(echo $EXPORTS_LIST | jq -r ".exports[] | select(.export_id == \"$EXPORT_ID\") | .export_id")

if [ "$FOUND_EXPORT" == "$EXPORT_ID" ]; then
    print_success "New export found in list"
else
    print_error "New export NOT found in list"
    exit 1
fi

echo ""
echo "=========================================="
print_success "ALL TESTS PASSED!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ Login successful"
echo "  ✓ Export created and saved to database"
echo "  ✓ Stats endpoint returns correct data"
echo "  ✓ Dashboard will display real values"
echo ""
echo "The data display on dashboards is working correctly!"
