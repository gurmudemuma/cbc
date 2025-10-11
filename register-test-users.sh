#!/bin/bash

# Script to register test users for all organizations
# Run this AFTER all API services are running

echo "=========================================="
echo "Registering Test Users"
echo "=========================================="
echo ""

# Wait for APIs to be ready
echo "Waiting for APIs to be ready..."
sleep 5

# Register Exporter Bank User
echo "1. Registering Exporter Bank user..."
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "exporter_admin",
    "password": "ExporterPass@2024!",
    "email": "admin@exporterbank.com",
    "organizationId": "EXPORTER-BANK-001",
    "role": "exporter"
  }' \
  -s | grep -q "success" && echo "✅ Exporter Bank user created" || echo "⚠️  User may already exist"
echo ""

# Register National Bank User
echo "2. Registering National Bank user..."
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bank_admin",
    "password": "BankPass@2024!",
    "email": "admin@nationalbank.com",
    "organizationId": "NATIONAL-BANK-001",
    "role": "banker"
  }' \
  -s | grep -q "success" && echo "✅ National Bank user created" || echo "⚠️  User may already exist"
echo ""

# Register NCAT User
echo "3. Registering NCAT user..."
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ncat_officer",
    "password": "NcatPass@2024!",
    "email": "officer@ncat.gov",
    "organizationId": "NCAT-001",
    "role": "inspector"
  }' \
  -s | grep -q "success" && echo "✅ NCAT user created" || echo "⚠️  User may already exist"
echo ""

# Register Shipping Line User
echo "4. Registering Shipping Line user..."
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "shipping_admin",
    "password": "ShipPass@2024!",
    "email": "admin@shipping.com",
    "organizationId": "SHIPPING-001",
    "role": "shipper"
  }' \
  -s | grep -q "success" && echo "✅ Shipping Line user created" || echo "⚠️  User may already exist"
echo ""

echo "=========================================="
echo "✅ Test User Registration Complete"
echo "=========================================="
echo ""
echo "You can now login to the frontend (http://localhost:5173) with:"
echo ""
echo "Exporter Bank:"
echo "  Username: exporter_admin"
echo "  Password: ExporterPass@2024!"
echo ""
echo "National Bank:"
echo "  Username: bank_admin"
echo "  Password: BankPass@2024!"
echo ""
echo "NCAT:"
echo "  Username: ncat_officer"
echo "  Password: NcatPass@2024!"
echo ""
echo "Shipping Line:"
echo "  Username: shipping_admin"
echo "  Password: ShipPass@2024!"
echo ""
