#!/bin/bash

echo "🚀 Starting APIs - Simple Method"
echo "================================"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$PROJECT_ROOT/logs"

# Kill existing processes
echo "Stopping existing API processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "ts-node-dev" 2>/dev/null || true
sleep 3

echo "Starting APIs individually..."

# Start each API from its own directory
cd "$PROJECT_ROOT/api/exporter-bank"
echo "Starting Exporter Bank API (port 3001)..."
nohup npm run dev > "$PROJECT_ROOT/logs/exporter-bank.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/exporter-bank.pid"

cd "$PROJECT_ROOT/api/national-bank"
echo "Starting National Bank API (port 3002)..."
nohup npm run dev > "$PROJECT_ROOT/logs/national-bank.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/national-bank.pid"

cd "$PROJECT_ROOT/api/ncat"
echo "Starting NCAT API (port 3003)..."
nohup npm run dev > "$PROJECT_ROOT/logs/ncat.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/ncat.pid"

cd "$PROJECT_ROOT/api/shipping-line"
echo "Starting Shipping Line API (port 3004)..."
nohup npm run dev > "$PROJECT_ROOT/logs/shipping-line.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/shipping-line.pid"

cd "$PROJECT_ROOT"

echo ""
echo "Waiting for APIs to initialize..."
sleep 10

echo ""
echo "Checking API status..."
API_COUNT=0
for port in 3001 3002 3003 3004; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ API on port $port is running"
        ((API_COUNT++))
    else
        echo "❌ API on port $port is not running"
    fi
done

echo ""
if [ $API_COUNT -eq 4 ]; then
    echo "🎉 All APIs are running successfully!"
else
    echo "⚠️ $API_COUNT/4 APIs are running"
    echo ""
    echo "Check logs for details:"
    echo "  tail -f logs/exporter-bank.log"
    echo "  tail -f logs/national-bank.log" 
    echo "  tail -f logs/ncat.log"
    echo "  tail -f logs/shipping-line.log"
fi

echo ""
echo "API endpoints:"
echo "  Exporter Bank: http://localhost:3001"
echo "  National Bank: http://localhost:3002"
echo "  NCAT:          http://localhost:3003"
echo "  Shipping Line: http://localhost:3004"
