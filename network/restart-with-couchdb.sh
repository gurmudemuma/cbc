#!/bin/bash

# Script to restart Fabric network with CouchDB

echo "=========================================="
echo "Restarting Fabric Network with CouchDB"
echo "=========================================="
echo ""

# Stop existing network
echo "1. Stopping existing network..."
cd /home/gu-da/cbc/network/docker
docker-compose down
echo "✅ Network stopped"
echo ""

# Clean up chaincode containers
echo "2. Cleaning up chaincode containers..."
docker rm -f $(docker ps -aq --filter "name=dev-peer") 2>/dev/null || true
echo "✅ Chaincode containers cleaned"
echo ""

# Start network with CouchDB
echo "3. Starting network with CouchDB..."
docker-compose up -d
echo "✅ Network starting..."
echo ""

# Wait for CouchDB to be ready
echo "4. Waiting for CouchDB containers to be ready..."
sleep 10

# Check CouchDB status
echo ""
echo "5. Checking CouchDB status..."
for port in 5984 6984 7984 8984; do
    if curl -s http://localhost:$port/_up | grep -q "ok"; then
        echo "✅ CouchDB on port $port is ready"
    else
        echo "⚠️  CouchDB on port $port is starting..."
    fi
done

echo ""
echo "6. Checking peer containers..."
docker ps --filter "name=peer0" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=========================================="
echo "Network Restart Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Wait 30 seconds for all containers to fully start"
echo "2. Recreate the channel (if needed)"
echo "3. Redeploy chaincode"
echo "4. Restart backend APIs"
echo ""
echo "CouchDB Web UIs:"
echo "- commercialbank: http://localhost:5984/_utils (admin/adminpw)"
echo "- National Bank: http://localhost:6984/_utils (admin/adminpw)"
echo "- ECTA: http://localhost:7984/_utils (admin/adminpw)"
echo "- Shipping Line: http://localhost:8984/_utils (admin/adminpw)"
