#!/bin/bash

echo "🧪 Testing Blockchain Functionality"
echo "==================================="

echo ""
echo "1. Testing coffee-export chaincode..."
echo "Query: queryAllCoffee"
docker exec cli peer chaincode query -C coffeechannel -n coffee-export -c '{"function":"queryAllCoffee","Args":[]}'

echo ""
echo "2. Testing user-management chaincode..."
echo "Query: queryAllUsers"
docker exec cli peer chaincode query -C coffeechannel -n user-management -c '{"function":"queryAllUsers","Args":[]}'

echo ""
echo "3. Checking Docker containers..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(peer0|orderer|cli)"

echo ""
echo "4. Testing chaincode installation..."
docker exec cli peer lifecycle chaincode queryinstalled

echo ""
echo "🎉 Blockchain test complete!"
echo ""
echo "If you see empty arrays [] for the queries, that's normal - it means the blockchain is working but no data has been added yet."
