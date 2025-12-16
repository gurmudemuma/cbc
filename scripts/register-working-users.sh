#!/bin/bash

echo "=========================================="
echo "Registering Working Test Users"
echo "=========================================="
echo ""

# Wait for APIs to be ready
echo "⏳ Waiting for APIs to be ready..."
sleep 5

# Get commercial bank API container IP
API_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' commercialbank-api 2>/dev/null)

if [ -z "$API_IP" ]; then
    echo "⚠️  WARNING: Commercial Bank API container not found"
    echo ""
    echo "User registration will be skipped."
    echo "Start the APIs first, then run: ./scripts/register-working-users.sh"
    echo ""
    exit 0
fi

echo "Using API at: http://$API_IP:3001"
echo ""

# Function to register user
register_user() {
    local org_name=$1
    local org_id=$2
    local username=$3
    local password=$4
    local email=$5
    local role=$6
    
    echo "📝 Registering $username for $org_name..."
    
    # Use jq to properly encode JSON with special characters
    local json_payload=$(jq -n \
        --arg username "$username" \
        --arg password "$password" \
        --arg email "$email" \
        --arg organizationId "$org_id" \
        --arg role "$role" \
        '{username: $username, password: $password, email: $email, organizationId: $organizationId, role: $role}')
    
    # Always use commercialbank API with container IP
    response=$(curl -s -X POST http://$API_IP:3001/api/auth/register \
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

# Register working test users for each organization
echo "1️⃣ Registering commercialbank User..."
register_user "commercialbank" "commercialbank" "export_user" "Export123!@#" "export@commercialbank.com" "exporter"

echo "2️⃣ Registering National Bank User..."
register_user "National Bank" "nationalbank" "bank_user" "Bank123!@#" "bank@nationalbank.com" "bank"

echo "3️⃣ Registering ECTA User..."
register_user "ECTA" "ecta" "ecta_user" "Ecta123!@#" "ecta@ecta.go.tz" "user"

echo "4️⃣ Registering Shipping Line User..."
register_user "Shipping Line" "shippingline" "ship_user" "Ship123!@#" "ship@shippingline.com" "shipper"

echo "5️⃣ Registering Custom Authorities User..."
register_user "Custom Authorities" "customauthorities" "customs_user" "Customs123!@#" "customs@customs.go.tz" "customs"

echo "=========================================="
echo "✅ User Registration Complete!"
echo "=========================================="
echo ""
echo "📋 Working Login Credentials:"
echo "--------------------"
echo ""
echo "commercialbank (http://localhost:3001):"
echo "  Username: export_user"
echo "  Password: Export123!@#"
echo ""
echo "National Bank (http://localhost:3002):"
echo "  Username: bank_user"
echo "  Password: Bank123!@#"
echo ""
echo "ECTA (http://localhost:3003):"
echo "  Username: ecta_user"
echo "  Password: Ecta123!@#"
echo ""
echo "Shipping Line (http://localhost:3004):"
echo "  Username: ship_user"
echo "  Password: Ship123!@#"
echo ""
echo "Custom Authorities (http://localhost:3005):"
echo "  Username: customs_user"
echo "  Password: Customs123!@#"
echo ""
echo "🌐 Access the frontend at: http://localhost:5173"
