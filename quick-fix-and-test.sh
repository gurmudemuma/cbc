#!/bin/bash

echo "=========================================="
echo "🔧 Quick Fix: Registering Test Users"
echo "=========================================="
echo ""
echo "✅ Rate limits have been increased from 5 to 100 per 15 minutes"
echo ""
echo "⚠️  IMPORTANT: You must restart all API services for changes to take effect:"
echo ""
echo "In each API terminal window, press Ctrl+C, then run:"
echo "  npm run dev"
echo ""
echo "After restarting APIs, run this script again to register users."
echo ""
read -p "Have you restarted all 4 API services? (y/n): " answer

if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    echo ""
    echo "Please restart APIs first, then run: ./quick-fix-and-test.sh"
    exit 1
fi

echo ""
echo "=========================================="
echo "Registering Test Users"
echo "=========================================="
echo ""

# Wait for APIs to be ready
echo "Waiting for APIs to be ready..."
sleep 3

# Register users
echo "1. Registering Exporter Bank user..."
response=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter_admin",
    "password": "ExporterPass@2024!",
    "email": "admin@exporterbank.com",
    "organizationId": "EXPORTER-BANK-001",
    "role": "exporter"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Exporter Bank user created"
else
    echo "⚠️  Response: $response"
fi
echo ""

echo "2. Registering National Bank user..."
response=$(curl -s -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bank_admin",
    "password": "BankPass@2024!",
    "email": "admin@nationalbank.com",
    "organizationId": "NATIONAL-BANK-001",
    "role": "banker"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ National Bank user created"
else
    echo "⚠️  Response: $response"
fi
echo ""

echo "3. Registering NCAT user..."
response=$(curl -s -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ncat_officer",
    "password": "NcatPass@2024!",
    "email": "officer@ncat.gov",
    "organizationId": "NCAT-001",
    "role": "inspector"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ NCAT user created"
else
    echo "⚠️  Response: $response"
fi
echo ""

echo "4. Registering Shipping Line user..."
response=$(curl -s -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "shipping_admin",
    "password": "ShipPass@2024!",
    "email": "admin@shipping.com",
    "organizationId": "SHIPPING-001",
    "role": "shipper"
  }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Shipping Line user created"
else
    echo "⚠️  Response: $response"
fi
echo ""

echo "=========================================="
echo "✅ Registration Complete - Testing Login"
echo "=========================================="
echo ""

# Test login
echo "Testing Exporter Bank login..."
login_response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter_admin",
    "password": "ExporterPass@2024!"
  }')

if echo "$login_response" | grep -q '"success":true'; then
    echo "✅ Login successful!"
    echo ""
    echo "=========================================="
    echo "🎉 SUCCESS! System is fully operational"
    echo "=========================================="
    echo ""
    echo "You can now:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. Select 'Exporter Bank'"
    echo "3. Login with:"
    echo "   Username: exporter_admin"
    echo "   Password: ExporterPass@2024!"
    echo ""
    echo "All credentials:"
    echo "  Exporter Bank: exporter_admin / ExporterPass@2024!"
    echo "  National Bank: bank_admin / BankPass@2024!"
    echo "  NCAT: ncat_officer / NcatPass@2024!"
    echo "  Shipping Line: shipping_admin / ShipPass@2024!"
    echo ""
else
    echo "❌ Login failed"
    echo "Response: $login_response"
    echo ""
    echo "Please check API logs for errors."
fi
