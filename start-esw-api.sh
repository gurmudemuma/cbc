#!/bin/bash
# Start ESW API Server (Port 3008)

echo "========================================"
echo "Starting ESW API Server"
echo "========================================"

cd api/esw

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting ESW API on port 3008..."
npm run dev
