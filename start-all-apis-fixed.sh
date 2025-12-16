#!/bin/bash

echo "Starting all API services..."

# Kill any existing processes
pkill -f "node src/index.js" 2>/dev/null
sleep 1

# Start each API with proper PORT environment variable
cd /home/gu-da/cbc/apis/commercial-bank && PORT=3001 node src/index.js > /tmp/api-3001.log 2>&1 &
cd /home/gu-da/cbc/apis/national-bank && PORT=3002 node src/index.js > /tmp/api-3002.log 2>&1 &
cd /home/gu-da/cbc/apis/shipping-line && PORT=3003 node src/index.js > /tmp/api-3003.log 2>&1 &
cd /home/gu-da/cbc/apis/ecx && PORT=3004 node src/index.js > /tmp/api-3004.log 2>&1 &
cd /home/gu-da/cbc/apis/ecta && PORT=3005 node src/index.js > /tmp/api-3005.log 2>&1 &
cd /home/gu-da/cbc/apis/custom-authorities && PORT=3006 node src/index.js > /tmp/api-3006.log 2>&1 &

# Wait for startup
sleep 3

# Check status
echo ""
echo "API Status:"
for port in 3001 3002 3003 3004 3005 3006; do
  response=$(curl -s -m 2 http://localhost:$port/health 2>/dev/null)
  if [ $? -eq 0 ]; then
    service=$(echo $response | jq -r '.service // "unknown"' 2>/dev/null)
    echo "✅ Port $port: $service"
  else
    echo "❌ Port $port: Not responding"
  fi
done

echo ""
echo "Logs available at: /tmp/api-*.log"
