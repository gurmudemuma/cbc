#!/bin/bash

# ========================================
# Stop All API Services
# ========================================

echo "========================================="
echo "Stopping All API Services"
echo "========================================="

# Function to stop an API service
stop_api() {
  local api_name=$1
  local port=$2
  
  echo ""
  echo "Stopping $api_name..."
  
  # Try to kill by PID file first
  if [ -f "logs/${api_name}.pid" ]; then
    local pid=$(cat "logs/${api_name}.pid")
    if ps -p $pid > /dev/null 2>&1; then
      kill $pid 2>/dev/null || true
      sleep 1
      # Force kill if still running
      if ps -p $pid > /dev/null 2>&1; then
        kill -9 $pid 2>/dev/null || true
      fi
      echo "✅ Stopped $api_name (PID: $pid)"
    else
      echo "⚠️  $api_name process not found"
    fi
    rm -f "logs/${api_name}.pid"
  fi
  
  # Also kill by port if still running
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Killing process on port $port..."
    kill $(lsof -t -i:$port) 2>/dev/null || true
    sleep 1
  fi
}

# Stop all API services
stop_api "exporter-bank" 3001
stop_api "national-bank" 3002
stop_api "ncat" 3003
stop_api "shipping-line" 3004

echo ""
echo "========================================="
echo "All API Services Stopped!"
echo "========================================="
