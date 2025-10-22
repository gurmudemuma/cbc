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

# Build and start services
print_header "Building API Services"

# Exporter Bank API
print_header "Building Exporter Bank API..."
echo "Compiling TypeScript for Exporter Bank API..."
if ! (cd "$PROJECT_ROOT/api/exporter-bank" && npm run build); then
  echo "❌ Failed to build Exporter Bank API"
  exit 1
fi
echo "✅ Exporter Bank API built successfully"

# National Bank API
print_header "Building National Bank API..."
echo "Compiling TypeScript for National Bank API..."
if ! (cd "$PROJECT_ROOT/api/national-bank" && npm run build); then
  echo "❌ Failed to build National Bank API"
  exit 1
fi
echo "✅ National Bank API built successfully"

# NCAT API
print_header "Building NCAT API..."
echo "Compiling TypeScript for NCAT API..."
if ! (cd "$PROJECT_ROOT/api/ncat" && npm run build); then
  echo "❌ Failed to build NCAT API"
  exit 1
fi
echo "✅ NCAT API built successfully"

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

# Exporter Bank API
LOG_FILE="$PROJECT_ROOT/logs/exporter-bank.log"
PID_FILE="$PROJECT_ROOT/logs/exporter-bank.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/exporter-bank" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 Exporter Bank API started in dev mode. Log: $LOG_FILE"

# National Bank API
LOG_FILE="$PROJECT_ROOT/logs/national-bank.log"
PID_FILE="$PROJECT_ROOT/logs/national-bank.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/national-bank" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 National Bank API started in dev mode. Log: $LOG_FILE"

# NCAT API
LOG_FILE="$PROJECT_ROOT/logs/ncat.log"
PID_FILE="$PROJECT_ROOT/logs/ncat.pid"
kill "$(cat $PID_FILE)" 2>/dev/null
(cd "$PROJECT_ROOT/api/ncat" && ts-node-dev --respawn --transpile-only src/index.ts &> "$LOG_FILE") &
echo $! > "$PID_FILE"
echo "🚀 NCAT API started in dev mode. Log: $LOG_FILE"

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
echo "API Services Status:"
echo "  🏦 Exporter Bank API: http://localhost:3001"
echo "  🏦 National Bank API: http://localhost:3002"
echo "  🏛️  NCAT API: http://localhost:3003"
echo "  🚢 Shipping Line API: http://localhost:3004"
echo "  🛃 Custom Authorities API: http://localhost:3005"
echo ""
echo "Logs are available in: $PROJECT_ROOT/logs/"
echo ""
