#!/bin/bash

# ========================================
# Coffee Blockchain Consortium
# API Services Builder & Starter
# ========================================

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to print a header
print_header() {
  echo ""
  echo "========================================"
  echo "$1"
  echo "========================================"
}

# Check if blockchain is running
print_header "Checking if blockchain network is running..."
if ! docker ps | grep -q "hyperledger"; then
  echo "❌ Blockchain network is not running. Please start it first."
  exit 1
fi
echo "✅ Blockchain network is running"

# Check and start Redis
print_header "Checking Redis Server..."
if ! pgrep -x "redis-server" > /dev/null; then
  echo "🔄 Starting Redis server..."
  redis-server --daemonize yes
  sleep 2
  if pgrep -x "redis-server" > /dev/null; then
    echo "✅ Redis server started successfully"
  else
    echo "❌ Failed to start Redis server"
    echo "Please install Redis or start it manually: redis-server"
    exit 1
  fi
else
  echo "✅ Redis server is already running"
fi

# Build and start services
print_header "Building API Services"

# Commercial Bank API
print_header "Building Commercial Bank API..."
echo "Compiling TypeScript for Commercial Bank API..."
if ! (cd "$PROJECT_ROOT/api/commercial-bank" && npm run build); then
  echo "❌ Failed to build Commercial Bank API"
  exit 1
fi
echo "✅ commercialbank API built successfully"

# National Bank API
print_header "Building National Bank API..."
echo "Compiling TypeScript for National Bank API..."
if ! (cd "$PROJECT_ROOT/api/national-bank" && npm run build); then
  echo "❌ Failed to build National Bank API"
  exit 1
fi
echo "✅ National Bank API built successfully"

# ECTA API (Ethiopian Coffee & Tea Authority)
print_header "Building ECTA API..."
echo "Compiling TypeScript for ECTA API..."
if ! (cd "$PROJECT_ROOT/api/ecta" && npm run build); then
  echo "❌ Failed to build ECTA API"
  exit 1
fi
echo "✅ ECTA API built successfully"

# ECX API (Ethiopian Commodity Exchange)
print_header "Building ECX API..."
echo "Compiling TypeScript for ECX API..."
if ! (cd "$PROJECT_ROOT/api/ecx" && npm run build); then
  echo "❌ Failed to build ECX API"
  exit 1
fi
echo "✅ ECX API built successfully"

# Exporter Portal API
print_header "Building Exporter Portal API..."
echo "Compiling TypeScript for Exporter Portal API..."
if ! (cd "$PROJECT_ROOT/api/exporter-portal" && npm run build); then
  echo "❌ Failed to build Exporter Portal API"
  exit 1
fi
echo "✅ Exporter Portal API built successfully"

# Shipping Line API
print_header "Building Shipping Line API..."
echo "Compiling TypeScript for Shipping Line API..."
if ! (cd "$PROJECT_ROOT/api/shipping-line" && npm run build); then
  echo "❌ Failed to build Shipping Line API"
  exit 1
fi
echo "✅ Shipping Line API built successfully"

# Custom Authorities API
print_header "Building Custom Authorities API..."
echo "Compiling TypeScript for Custom Authorities API..."
if ! (cd "$PROJECT_ROOT/api/custom-authorities" && npm run build); then
  echo "❌ Failed to build Custom Authorities API"
  exit 1
fi
echo "✅ Custom Authorities API built successfully"

print_header "Starting API Services in Development Mode"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Commercial Bank API
LOG_FILE="$PROJECT_ROOT/logs/commercial-bank.log"
PID_FILE="$PROJECT_ROOT/logs/commercial-bank.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/commercial-bank" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 Commercial Bank API started in dev mode. Log: $LOG_FILE"

# National Bank API
LOG_FILE="$PROJECT_ROOT/logs/national-bank.log"
PID_FILE="$PROJECT_ROOT/logs/national-bank.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/national-bank" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 National Bank API started in dev mode. Log: $LOG_FILE"

# ECTA API (Ethiopian Coffee & Tea Authority)
LOG_FILE="$PROJECT_ROOT/logs/ecta.log"
PID_FILE="$PROJECT_ROOT/logs/ecta.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/ecta" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 ECTA API started in dev mode. Log: $LOG_FILE"

# ECX API (Ethiopian Commodity Exchange)
LOG_FILE="$PROJECT_ROOT/logs/ecx.log"
PID_FILE="$PROJECT_ROOT/logs/ecx.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/ecx" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 ECX API started in dev mode. Log: $LOG_FILE"

# Exporter Portal API
LOG_FILE="$PROJECT_ROOT/logs/exporter-portal.log"
PID_FILE="$PROJECT_ROOT/logs/exporter-portal.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/exporter-portal" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 Exporter Portal API started in dev mode. Log: $LOG_FILE"

# Shipping Line API
LOG_FILE="$PROJECT_ROOT/logs/shipping-line.log"
PID_FILE="$PROJECT_ROOT/logs/shipping-line.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/shipping-line" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 Shipping Line API started in dev mode. Log: $LOG_FILE"

# Custom Authorities API
LOG_FILE="$PROJECT_ROOT/logs/custom-authorities.log"
PID_FILE="$PROJECT_ROOT/logs/custom-authorities.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/custom-authorities" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 Custom Authorities API started in dev mode. Log: $LOG_FILE"

print_header "All APIs have been started!"

echo ""
echo "Services Status:"
echo "  📦 Redis Server: localhost:6379 (caching)"
echo "  🏦 Commercial Bank API: http://localhost:3001"
echo "  🏦 National Bank (NBE) API: http://localhost:3002"
echo "  🏛️  ECTA API: http://localhost:3003 (License, Quality, Contract)"
echo "  🚢 Shipping Line API: http://localhost:3004"
echo "  🛃 Customs API: http://localhost:3005"
echo "  📊 ECX API: http://localhost:3006 (Lot Verification)"
echo "  👤 Exporter Portal API: http://localhost:3007"
echo ""
echo "Logs are available in: $PROJECT_ROOT/logs/"
echo ""
echo "To stop Redis: redis-cli shutdown"
echo ""
