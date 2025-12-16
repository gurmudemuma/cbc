#!/usr/bin/env bash
# Provision exporter1 and prepare exporter-portal wallet
# This script will:
# 1. Enroll admin identities for orgs (if not already done)
# 2. Register exporter1 user on the blockchain (user-management chaincode)
# 3. Enroll exporter-portal client identity into exporter-portal wallet

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================="
echo "Provisioning exporter1 and exporter-portal client"
echo "=========================================="

pushd "$PROJECT_ROOT" > /dev/null

echo "1) Enrolling admin identities (may be skipped if already done)"
chmod +x "$PROJECT_ROOT/scripts/enroll-admins.sh"
"$PROJECT_ROOT/scripts/enroll-admins.sh"

echo "2) Register exporter1 on blockchain"
DEFAULT_TEST_EXPORTER_PASSWORD="${DEFAULT_TEST_EXPORTER_PASSWORD:-Exporter123!@#}" \
  node "$PROJECT_ROOT/scripts/register-exporter1.js"

echo "3) Enroll exporter-portal client identity into wallet"
node "$PROJECT_ROOT/api/exporter-portal/scripts/provision-client.js"

echo "=========================================="
echo "✅ Provisioning complete. Exporter1 and exporter-portal client are ready (if no errors)"
echo "=========================================="

popd > /dev/null
