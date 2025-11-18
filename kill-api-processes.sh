#!/bin/bash

echo "🔪 Killing API Processes on Ports 3001-3004"
echo "============================================="

# Function to kill process on a specific port
kill_port() {
    local port=$1
    echo "Checking port $port..."
    
    # Find process using the port
    local pid=$(lsof -t -i:$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        echo "  Found process $pid using port $port"
        echo "  Killing process..."
        kill -9 $pid 2>/dev/null
        sleep 1
        
        # Verify it's killed
        if lsof -t -i:$port >/dev/null 2>&1; then
            echo "  ❌ Failed to kill process on port $port"
        else
            echo "  ✅ Successfully killed process on port $port"
        fi
    else
        echo "  ✅ Port $port is free"
    fi
}

# Kill processes on API ports
for port in 3001 3002 3003 3004; do
    kill_port $port
done

echo ""
echo "🧹 Cleaning up background processes..."

# Kill any npm/node processes that might be related to our APIs
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "ts-node-dev" 2>/dev/null || true
pkill -f "banker" 2>/dev/null || true
pkill -f "nb-regulatory" 2>/dev/null || true
pkill -f "exporter" 2>/dev/null || true
pkill -f "ncat.*api" 2>/dev/null || true
pkill -f "shipping-line" 2>/dev/null || true

sleep 2

echo ""
echo "✅ Port cleanup complete!"
echo ""
echo "Now you can start the APIs:"
echo "  cd /c/cbc/api/commercial-bank && npm run dev"
echo "  cd /c/cbc/api/national-bank && npm run dev"
echo "  cd /c/cbc/api/exporter && npm run dev"
echo "  cd /c/cbc/api/ncat && npm run dev"
echo "  cd /c/cbc/api/shipping-line && npm run dev"
echo "  cd /c/cbc/api/custom-authorities && npm run dev"
