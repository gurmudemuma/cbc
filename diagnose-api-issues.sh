#!/bin/bash

echo "🔍 Diagnosing API Issues"
echo "========================"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "1. Checking Node.js and npm versions..."
node --version
npm --version

echo ""
echo "2. Checking if dependencies are installed..."
cd "$PROJECT_ROOT/api"
if [ -d "node_modules" ]; then
    echo "✅ Main API node_modules exists"
else
    echo "❌ Main API node_modules missing"
    echo "Running npm install..."
    npm install
fi

echo ""
echo "3. Checking individual API dependencies..."
for api_dir in "exporter-bank" "national-bank" "ncat" "shipping-line"; do
    echo "Checking $api_dir..."
    cd "$PROJECT_ROOT/api/$api_dir"
    
    if [ -f "package.json" ]; then
        echo "  ✅ package.json exists"
    else
        echo "  ❌ package.json missing"
        continue
    fi
    
    if [ -f ".env" ]; then
        echo "  ✅ .env file exists"
    else
        echo "  ❌ .env file missing"
        if [ -f ".env.example" ]; then
            echo "    Creating .env from .env.example..."
            cp ".env.example" ".env"
        fi
    fi
    
    # Check if TypeScript is available
    if command -v npx &> /dev/null; then
        if npx tsc --version &> /dev/null; then
            echo "  ✅ TypeScript available"
        else
            echo "  ❌ TypeScript not available"
        fi
    fi
done

echo ""
echo "4. Testing a simple API startup (5 second test)..."
cd "$PROJECT_ROOT/api/exporter-bank"

echo "Starting API for 5 seconds to see startup messages..."
timeout 5s npm run dev &
API_PID=$!

sleep 6

if ps -p $API_PID > /dev/null 2>&1; then
    echo "✅ API is still running after 5 seconds"
    kill $API_PID 2>/dev/null || true
else
    echo "❌ API exited within 5 seconds"
fi

echo ""
echo "5. Checking for common issues..."

# Check if ports are blocked
for port in 3001 3002 3003 3004; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️ Port $port is already in use"
    else
        echo "✅ Port $port is available"
    fi
done

echo ""
echo "6. Blockchain connectivity test..."
if docker ps | grep -q "peer0.exporterbank"; then
    echo "✅ Blockchain network is running"
else
    echo "❌ Blockchain network is not running"
    echo "   APIs require blockchain network to be running"
fi

echo ""
echo "🎯 Diagnosis complete!"
echo ""
echo "If APIs are still not starting, the issue is likely:"
echo "1. Missing dependencies (run: cd api && npm install)"
echo "2. Environment configuration issues"
echo "3. TypeScript compilation errors"
echo "4. Blockchain network connectivity"
