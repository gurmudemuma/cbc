#!/usr/bin/env bash
set -Eeuo pipefail

printf "%s\n" "=========================================="
printf "%s\n" "Registering Test Users - Improved Version"
printf "%s\n\n" "=========================================="

# Utils
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PASSWORDS_FILE="$SCRIPT_DIR/generated-test-user-passwords.txt"
: > "$PASSWORDS_FILE"  # truncate

# Wait helpers
wait_for_http_ok() {
  local url=$1
  local name=$2
  local retries=${3:-30}
  local delay=${4:-2}
  local attempt=1
  until http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url"); do
    :
  done
  while [[ "$http_code" != "200" && $attempt -le $retries ]]; do
    printf "%s\n" "⏳ Waiting for $name ($url) ... attempt $attempt/$retries (got $http_code)"
    sleep "$delay"
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
    attempt=$((attempt+1))
  done
  if [[ "$http_code" != "200" ]]; then
    printf "%s\n\n" "❌ $name not ready: $url (last HTTP $http_code)"
    return 1
  fi
  printf "%s\n" "✅ $name is ready"
}

printf "%s\n" "⏳ Waiting for APIs to be ready..."
# Commercial Bank, National Bank, ECTA, Shipping Line, Custom Authorities must be Fabric-ready
wait_for_http_ok "http://localhost:3001/ready" "Commercial Bank API" || true
wait_for_http_ok "http://localhost:3002/ready" "National Bank API" || true
wait_for_http_ok "http://localhost:3003/ready" "ECTA API" || true
wait_for_http_ok "http://localhost:3004/ready" "Shipping Line API" || true
wait_for_http_ok "http://localhost:3005/ready" "Custom Authorities API" || true
# Exporter Portal health (no Fabric connection required)
wait_for_http_ok "http://localhost:3007/health" "Exporter Portal API" || true
printf "\n"

# Function to register user
register_user() {
    local port=$1
    local org_name=$2
    local username=$3
    local password
    password=$(node -e "const upper='ABCDEFGHIJKLMNOPQRSTUVWXYZ';const lower='abcdefghijklmnopqrstuvwxyz';const number='0123456789';const special='@$!%*?&';let pass=upper[Math.floor(Math.random()*upper.length)]+lower[Math.floor(Math.random()*lower.length)]+number[Math.floor(Math.random()*number.length)]+special[Math.floor(Math.random()*special.length)];const all=upper+lower+number+special;for(let i=4;i<16;i++){pass+=all[Math.floor(Math.random()*all.length)]}console.log(pass.split('').sort(()=>Math.random()-0.5).join(''));")

    printf "%s\n" "📝 Registering $username in $org_name..."
    printf "%s\n" "Generated password: $password"

    # Check API readiness endpoint
    if ! curl -sSf "http://localhost:$port/health" > /dev/null; then
        printf "%s\n\n" "❌ API on port $port is not responding"
        return 1
    fi

    # Perform registration
    response=$(curl -sS -X POST "http://localhost:$port/api/auth/register" \
        -H "Content-Type: application/json" \
        --data-raw "{\"username\":\"$username\",\"password\":\"$password\",\"email\":\"$username@example.com\"}") || true

    if printf "%s" "$response" | grep -q '"success":true'; then
        printf "%s\n" "✅ Successfully registered $username"
        printf "%s\n\n" "Password: $password"
        printf "%s\t%s\n" "$username" "$password" >> "$PASSWORDS_FILE"
        return 0
    elif printf "%s" "$response" | grep -q '"success":false'; then
        # Extract error message
        error_msg=$(printf "%s" "$response" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [[ "$error_msg" == *"already exists"* ]]; then
            printf "%s\n\n" "⚠️  User already exists (skipping)"
            return 0
        else
            printf "%s\n" "❌ Failed to register $username"
            printf "%s\n\n" "Error: $error_msg"
            return 1
        fi
    else
        printf "%s\n" "❌ Failed to register $username (unexpected response)"
        printf "%s\n\n" "Response: $response"
        return 1
    fi
}

# Track results
TOTAL=0
SUCCESS=0
FAILED=0

# Register users for each organization
printf "%s\n" "1️⃣ Registering Exporter Portal User..."
((TOTAL++))
if register_user 3007 "Exporter Portal" "portal1"; then
    ((SUCCESS++))
else
    ((FAILED++))
fi

printf "%s\n" "2️⃣ Registering Commercial Bank User..."
((TOTAL++))
if register_user 3001 "Commercial Bank" "commercial1"; then
    ((SUCCESS++))
else
    ((FAILED++))
fi

printf "%s\n" "3️⃣ Registering National Bank User..."
((TOTAL++))
if register_user 3002 "National Bank" "banker1"; then
    ((SUCCESS++))
else
    ((FAILED++))
fi

printf "%s\n" "4️⃣ Registering ECTA User..."
((TOTAL++))
if register_user 3003 "ECTA" "inspector1"; then
    ((SUCCESS++))
else
    ((FAILED++))
fi

printf "%s\n" "5️⃣ Registering Shipping Line User..."
((TOTAL++))
if register_user 3004 "Shipping Line" "shipper1"; then
    ((SUCCESS++))
else
    ((FAILED++))
fi

printf "%s\n" "6️⃣ Registering Custom Authorities User..."
((TOTAL++))
if register_user 3005 "Custom Authorities" "custom1"; then
    ((SUCCESS++))
else
    ((FAILED++))
fi

printf "%s\n" "=========================================="
printf "%s\n" "Registration Summary"
printf "%s\n" "=========================================="
printf "%s\n" "Total: $TOTAL"
printf "%s\n" "✅ Successful: $SUCCESS"
printf "%s\n\n" "❌ Failed: $FAILED"

if [[ $FAILED -gt 0 ]]; then
    printf "%s\n" "⚠️  Some registrations failed. This may be due to:"
    printf "%s\n" "   1. Blockchain network connectivity issues"
    printf "%s\n" "   2. Peers not properly endorsing transactions"
    printf "%s\n\n" "   3. Chaincode not deployed on all peers"
    printf "%s\n" "Troubleshooting steps:"
    printf "%s\n" "   1. Check API logs: tail -f logs/*.log"
    printf "%s\n" "   2. Verify peers are running: docker ps | grep peer"
    printf "%s\n" "   3. Check peer logs: docker logs peer0.nationalbank.coffee-export.com"
    printf "%s\n\n" "   4. Restart the system: ./start-system.sh --clean"
fi

printf "%s\n" "=========================================="
printf "%s\n" "✅ User Registration Complete!"
printf "%s\n\n" "=========================================="
printf "%s\n" "📋 Test User Credentials:"
printf "%s\n" "--------------------"
printf "%s\n" "Exporter Portal: username: portal1     password: [Generated - Check logs or env]"
printf "%s\n" "Commercial Bank:  username: commercial1 password: [Generated - Check logs or env]"
printf "%s\n" "National Bank:   username: banker1     password: [Generated - Check logs or env]"
printf "%s\n" "ECTA:            username: inspector1  password: [Generated - Check logs or env]"
printf "%s\n" "Shipping Line:   username: shipper1    password: [Generated - Check logs or env]"
printf "%s\n" "Custom Authorities: username: custom1   password: [Generated - Check logs or env]"
printf "%s\n\n" "🌐 Access the frontend at: http://localhost:5173"
printf "%s\n" "Saved passwords -> $PASSWORDS_FILE"
