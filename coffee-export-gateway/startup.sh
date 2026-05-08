#!/bin/sh
set -e

echo "========================================="
echo "  Coffee Export Gateway Startup"
echo "========================================="

# Step 1: Enroll admin from crypto materials
echo ""
echo "[1/2] Enrolling admin from crypto materials..."
node /app/src/scripts/enrollAdminFromCrypto.js || echo "⚠ Admin enrollment skipped or already exists"

# Step 2: Start the application
echo ""
echo "[2/2] Starting application server..."
exec node /app/src/server.js
