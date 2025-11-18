#!/bin/bash

echo "=========================================="
echo "Registering Test Users"
echo "=========================================="
echo ""

# Wait for APIs to be ready
echo "⏳ Waiting for APIs to be ready..."
sleep 5

# Function to register user
# Note: All registrations go through Commercial Bank API (port 3001)
register_user() {
    local org_name=$1
    local username=$2
    local password=$3
    local email=$4
    
    echo "📝 Registering $username for $org_name..."
    
    # The API will use default values for organizationId and role
    local json_payload=$(jq -n \
        --arg username "$username" \
        --arg password "$password" \
        --arg email "$email" \
        '{username: $username, password: $password, email: $email}')
    
    # Use Commercial Bank API (3001) for registration
    response=$(curl -s -X POST http://localhost:3001/api/auth/register \
        -H "Content-Type: application/json" \
        -d "$json_payload")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Successfully registered $username"
    else
        echo "❌ Failed to register $username"
        echo "Response: $response"
    fi
    echo ""
}

# Register test users with simplified format
echo "1️⃣ Registering Test User 1..."
register_user "Test Org" "testuser1" "Test123!@#" "test1@example.com"

echo "2️⃣ Registering Test User 2..."
register_user "Test Org" "testuser2" "Test123!@#" "test2@example.com"

echo "3️⃣ Registering Admin User..."
register_user "Admin" "admin" "Admin123!@#" "admin@example.com"

echo "=========================================="
echo "✅ User Registration Complete!"
echo "=========================================="
echo ""
echo "📋 Login Credentials:"
echo "--------------------"
echo ""
echo "Test User 1:"
echo "  Username: testuser1"
echo "  Password: Test123!@#"
echo ""
echo "Test User 2:"
echo "  Username: testuser2"
echo "  Password: Test123!@#"
echo ""
echo "Admin User:"
echo "  Username: admin"
echo "  Password: Admin123!@#"
echo ""
echo "🌐 Access the frontend at: http://localhost:5173"
echo ""
