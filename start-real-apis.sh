#!/bin/bash

echo "🚀 Starting real APIs with database connection..."

# Kill any existing processes
pkill -f "node mock-api.js" 2>/dev/null
pkill -f "npm start" 2>/dev/null

# Start PostgreSQL if not running
docker run -d --name postgres-real --network bridge -p 5432:5432 \
  -e POSTGRES_DB=coffee_export \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  postgres:15-alpine 2>/dev/null || echo "Database already running"

# Start real APIs
cd apis/commercial-bank && PORT=3001 npm start &
cd ../national-bank && PORT=3002 npm start &
cd ../ecta && PORT=3003 npm start &
cd ../ecx && PORT=3004 npm start &
cd ../shipping-line && PORT=3005 npm start &
cd ../custom-authorities && PORT=3006 npm start &

echo "✅ Real APIs started with database connection!"
echo "🌐 Frontend: http://localhost:5173"
echo "💾 Database: PostgreSQL on port 5432"
