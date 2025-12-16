#!/bin/bash

# Manual User Registration Script
# Workaround for user-management chaincode deployment issues
# This script creates test users that can be used for system testing

set -e

echo "=========================================="
echo "Coffee Export System - Manual User Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test users configuration
declare -A USERS
USERS[exporter1]="commercialbank:exporter:Exporter123!@#:exporter1@test.com"
USERS[banker1]="commercialbank:banker:Banker123!@#:banker1@test.com"
USERS[governor1]="nationalbank:governor:Governor123!@#:governor1@test.com"
USERS[inspector1]="ecta:inspector:Inspector123!@#:inspector1@test.com"
USERS[shipper1]="shippingline:shipper:Shipper123!@#:shipper1@test.com"
USERS[custom1]="custom-authorities:customs:Custom123!@#:custom1@test.com"

# Function to get API port for organization
get_api_port() {
    case $1 in
        commercialbank) echo "3001" ;;
        nationalbank) echo "3002" ;;
        ecta) echo "3003" ;;
        shippingline) echo "3004" ;;
        custom-authorities) echo "3005" ;;
        *) echo "3001" ;;
    esac
}

# Function to register a user
register_user() {
    local username=$1
    local org=$2
    local role=$3
    local password=$4
    local email=$5
    local port=$(get_api_port $org)
    
    echo -n "Registering $username ($role @ $org)... "
    
    # Try to register via API
    response=$(curl -s -X POST "http://localhost:$port/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"password\": \"$password\",
            \"email\": \"$email\",
            \"organizationId\": \"$org\",
            \"role\": \"$role\"
        }")
    
    # Check if successful
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Success${NC}"
        return 0
    elif echo "$response" | grep -q "already exists"; then
        echo -e "${YELLOW}⚠ Already exists${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        echo "   Response: $response"
        return 1
    fi
}

# Main registration loop
echo "Attempting to register test users..."
echo ""

success_count=0
fail_count=0

for username in "${!USERS[@]}"; do
    IFS=':' read -r org role password email <<< "${USERS[$username]}"
    
    if register_user "$username" "$org" "$role" "$password" "$email"; then
        ((success_count++))
    else
        ((fail_count++))
    fi
done

echo ""
echo "=========================================="
echo "Registration Summary"
echo "=========================================="
echo -e "Successful: ${GREEN}$success_count${NC}"
echo -e "Failed:     ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -gt 0 ]; then
    echo -e "${YELLOW}⚠ Some registrations failed${NC}"
    echo ""
    echo "This is likely because the user-management chaincode is not deployed."
    echo ""
    echo "Alternative Solutions:"
    echo "1. Wait for system to have more memory and redeploy chaincode"
    echo "2. Use database-only authentication (modify APIs)"
    echo "3. Create users directly in PostgreSQL database"
    echo ""
    echo "For now, you can test the system with any users that succeeded."
fi

if [ $success_count -gt 0 ]; then
    echo ""
    echo "=========================================="
    echo "Test User Credentials"
    echo "=========================================="
    echo ""
    for username in "${!USERS[@]}"; do
        IFS=':' read -r org role password email <<< "${USERS[$username]}"
        port=$(get_api_port $org)
        echo "$username:"
        echo "  Organization: $org"
        echo "  Role: $role"
        echo "  Password: $password"
        echo "  API: http://localhost:$port"
        echo ""
    done
    
    echo "=========================================="
    echo "Quick Test"
    echo "=========================================="
    echo ""
    echo "Try logging in with exporter1:"
    echo ""
    echo "curl -X POST http://localhost:3001/api/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"username\": \"exporter1\", \"password\": \"Exporter123!@#\"}'"
    echo ""
fi

exit 0
