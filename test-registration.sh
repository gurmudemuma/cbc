#!/bin/bash

# Get ECTA token
echo "Getting ECTA token..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ecta1","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:20}..."

# Register contract
echo ""
echo "Registering contract 557336f2-b4d5-48bb-96fe-cd1a57780071..."
curl -v -X POST http://localhost:3000/api/ecta/contracts/557336f2-b4d5-48bb-96fe-cd1a57780071/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"notes":"Test registration from script"}'

echo ""
