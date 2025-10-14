#!/bin/bash

# Health Check Script for Exporter Bank API
# This script verifies the API and Fabric connectivity

echo "=================================="
echo "Exporter Bank API Health Check"
echo "=================================="
echo ""

# Check if the API is running
echo "1. Checking API server..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API server is running"
    echo ""
    echo "Health Status:"
    curl -s http://localhost:3001/health | jq '.'
    echo ""
else
    echo "❌ API server is not responding on port 3001"
    echo "   Please start the API with: npm run dev"
    exit 1
fi

# Check readiness (Fabric connection)
echo ""
echo "2. Checking Fabric connectivity..."
READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ready)

if [ "$READY_STATUS" = "200" ]; then
    echo "✅ Fabric network is connected"
else
    echo "❌ Fabric network is NOT connected (Status: $READY_STATUS)"
    echo "   Please ensure:"
    echo "   - Fabric network is running (docker ps)"
    echo "   - Channel and chaincode are deployed"
    echo "   - Environment variables are correctly set"
fi

echo ""
echo "=================================="
echo "Health Check Complete"
echo "=================================="
