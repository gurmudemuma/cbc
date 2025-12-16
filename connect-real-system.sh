#!/bin/bash

echo "🔗 Connecting to real Hyperledger Fabric network..."

# Stop mocks
pkill -f "node mock-api.js"

# Start real APIs with Fabric connection
cd apis/commercial-bank && npm start &
cd ../national-bank && npm start &
cd ../ecta && npm start &
cd ../ecx && npm start &
cd ../shipping-line && npm start &
cd ../custom-authorities && npm start &

# Start Fabric network
cd ../../network && ./start-network.sh

echo "✅ Real system connected!"
