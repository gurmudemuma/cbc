#!/bin/bash

echo "🔄 Checking Existing Users Before Registration"
echo "==============================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to check if user exists
check_user_exists() {
    local port=$1
    local username=$2

    response=$(curl -s -X GET http://localhost:$port/api/auth/check-username \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\"}" 2>/dev/null)

    if echo "$response" | grep -q '"exists":true'; then
        return 0  # User exists
    else
        return 1  # User doesn't exist
    fi
}

# Function to register user only if doesn't exist
register_user_if_not_exists() {
    local port=$1
    local org_name=$2
    local username=$3

    if check_user_exists $port $username; then
        echo "✅ $username already exists in $org_name - skipping registration"
        return 0
    else
        echo "📝 $username doesn't exist in $org_name - registering..."
        return 1
    fi
}

# Check each user before registration
echo "🔍 Checking existing users..."
echo ""

users_to_register=()

# Check commercialbank
if ! check_user_exists 3001 "exporter1"; then
    users_to_register+=("3001:commercialbank:exporter1")
fi

# Check National Bank
if ! check_user_exists 3002 "banker1"; then
    users_to_register+=("3002:National Bank:banker1")
fi

# Check ECTA
if ! check_user_exists 3003 "inspector1"; then
    users_to_register+=("3003:ECTA:inspector1")
fi

# Check Shipping Line
if ! check_user_exists 3004 "shipper1"; then
    users_to_register+=("3004:Shipping Line:shipper1")
fi

echo ""
if [ ${#users_to_register[@]} -eq 0 ]; then
    echo "✅ All users already exist! No registration needed."
    echo ""
    echo "📋 Current Users:"
    echo "  commercialbank: exporter1 (port 3001)"
    echo "  National Bank: banker1 (port 3002)"
    echo "  ECTA: inspector1 (port 3003)"
    echo "  Shipping Line: shipper1 (port 3004)"
else
    echo "🔧 ${#users_to_register[@]} users need to be registered:"
    for user_info in "${users_to_register[@]}"; do
        IFS=':' read -r port org username <<< "$user_info"
        echo "  - $username in $org (port $port)"
    done

    echo ""
    echo "Run the original registration script to create missing users:"
    echo "  ./register-test-users.sh"
fi

echo ""
echo "🌐 Test login at: http://localhost:5173"
