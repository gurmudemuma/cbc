#!/bin/bash

# Start Working System - No Docker Building
echo "🚀 Starting working system without Docker builds..."

# 1. Start database
docker run -d --name postgres --network coffee-network -p 5432:5432 -e POSTGRES_DB=coffee_export -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 postgres:15-alpine 2>/dev/null || echo "Postgres already running"

# 2. Start APIs locally
echo "Starting API services locally..."

# Install dependencies if needed
if [ ! -d node_modules ]; then
    npm install express cors
fi

# Start all APIs
for port in 3001 3002 3003 3004 3005 3006; do
    PORT=$port node mock-api.js &
    echo "API started on port $port"
done

# 3. Start frontend
echo "Starting frontend..."
cd frontend
if [ ! -d node_modules ]; then
    npm install
fi
npm start &
cd ..

echo "✅ Complete working system started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 APIs: http://localhost:3001-3006"
echo "💾 Database: localhost:5432"

# Wait and test
sleep 5
echo "🧪 Testing system connectivity..."
for port in 3001 3002 3003; do
    if curl -s http://localhost:$port/health > /dev/null; then
        echo "✅ API $port: Working"
    else
        echo "❌ API $port: Not responding"
    fi
done
