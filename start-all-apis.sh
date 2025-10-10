#!/bin/bash

# ========================================
# Start All API Services
# ========================================

echo "========================================="
echo "Starting All API Services"
echo "========================================="

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to start an API service
start_api() {
  local api_name=$1
  local api_dir=$2
  local port=$3
  
  echo ""
  echo "Starting $api_name on port $port..."
  
  # Kill existing process if running
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Port $port is already in use. Killing existing process..."
    kill $(lsof -t -i:$port) 2>/dev/null || true
    sleep 2
  fi
  
  # Start the service in background
  cd "$api_dir" && npm run dev > "../../logs/${api_name}.log" 2>&1 &
  local pid=$!
  echo $pid > "logs/${api_name}.pid"
  
  echo "✅ $api_name started (PID: $pid)"
  echo "   Log: logs/${api_name}.log"
}

# Start all API services
start_api "exporter-bank" "api/exporter-bank" 3001
sleep 3

start_api "national-bank" "api/national-bank" 3002
sleep 3

start_api "ncat" "api/ncat" 3003
sleep 3

start_api "shipping-line" "api/shipping-line" 3004
sleep 3

echo ""
echo "========================================="
echo "All API Services Started!"
echo "========================================="
echo ""
echo "Service Status:"
echo "  - Exporter Bank API:  http://localhost:3001/health"
echo "  - National Bank API:  http://localhost:3002/health"
echo "  - NCAT API:           http://localhost:3003/health"
echo "  - Shipping Line API:  http://localhost:3004/health"
echo ""
echo "To view logs:"
echo "  tail -f logs/exporter-bank.log"
echo "  tail -f logs/national-bank.log"
echo "  tail -f logs/ncat.log"
echo "  tail -f logs/shipping-line.log"
echo ""
echo "To stop all services:"
echo "  ./stop-all-apis.sh"
echo ""

# Wait a bit and check if services are responding
sleep 5
echo "Checking service health..."
for port in 3001 3002 3003 3004; do
  if curl -s http://localhost:$port/health > /dev/null 2>&1; then
    echo "✅ Port $port is responding"
  else
    echo "⚠️  Port $port is not responding yet (may still be starting)"
  fi
done

echo ""
echo "Done! All services are starting up."
