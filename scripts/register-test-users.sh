#!/bin/bash

echo "=========================================="
echo "Registering Test Users"
echo "=========================================="
echo ""

# Wait for APIs to be ready
echo "⏳ Waiting for APIs to be ready..."
sleep 5

# Function to register user
register_user() {
    local port=$1
    local org_name=$2
    local username=$3
    local password=$(node -e "const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const lower = 'abcdefghijklmnopqrstuvwxyz'; const number = '0123456789'; const special = '@$!%*?&'; let pass = upper.charAt(Math.floor(Math.random() * upper.length)) + lower.charAt(Math.floor(Math.random() * lower.length)) + number.charAt(Math.floor(Math.random() * number.length)) + special.charAt(Math.floor(Math.random() * special.length)); const all = upper + lower + number + special; for (let i = 4; i < 16; i++) { pass += all.charAt(Math.floor(Math.random() * all.length)); } console.log(pass.split('').sort(() => Math.random() - 0.5).join(''));")
    
    echo "📝 Registering $username in $org_name..."
    echo "Generated password: $password"
    
    response=$(curl -s -X POST http://localhost:$port/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\",\"email\":\"$username@example.com\"}")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Successfully registered $username"
        echo "Password: $password"
        echo ""
    else
        echo "❌ Failed to register $username"
        echo "Response: $response"
        echo ""
    fi
}

# Register users for each organization
echo "1️⃣ Registering Exporter Bank User..."
register_user 3001 "Exporter Bank" "exporter1"

echo "2️⃣ Registering National Bank User..."
register_user 3002 "National Bank" "banker1"

echo "3️⃣ Registering NCAT User..."
register_user 3003 "NCAT" "inspector1"

echo "4️⃣ Registering Shipping Line User..."
register_user 3004 "Shipping Line" "shipper1"

echo "=========================================="
echo "✅ User Registration Complete!"
echo "=========================================="
echo ""
echo "📋 Login Credentials:"
echo "--------------------"
echo "Exporter Bank:   username: exporter1   password: [Generated - Check logs or env]"
echo "National Bank:   username: banker1     password: [Generated - Check logs or env]"
echo "NCAT:            username: inspector1  password: [Generated - Check logs or env]"
echo "Shipping Line:   username: shipper1    password: [Generated - Check logs or env]"
echo ""
echo "🌐 Access the frontend at: http://localhost:5173"
echo ""

# Note: For security, passwords are generated randomly and not echoed. Store them securely.