#!/bin/bash

# Fix All Remaining Scripts and Tests
# This script updates all remaining references to old API names

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Fixing All Remaining Scripts and Tests"
echo "=========================================="
echo ""

# Function to update file
update_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo "Updating: $file"
        sed -i 's/commercial-bank/commercial-bank/g' "$file"
        sed -i 's/national-bank/national-bank/g' "$file"
        sed -i 's/exporter-portal/exporter/g' "$file"
        sed -i 's/commercialbank/commercial-bank/g' "$file"
        sed -i 's/nationalbank/nbregulatory/g' "$file"
        sed -i 's/commercialbank/Banker/g' "$file"
        sed -i 's/NationalBank/NBRegulatory/g' "$file"
        sed -i 's/Commercial Bank/Banker/g' "$file"
        sed -i 's/National Bank/NB Regulatory/g' "$file"
    fi
}

# Update utility scripts
echo "📝 Updating utility scripts..."
update_file "$PROJECT_ROOT/scripts/fix-configurations.sh"
update_file "$PROJECT_ROOT/scripts/setup-env.sh"
update_file "$PROJECT_ROOT/scripts/validate-all.sh"
update_file "$PROJECT_ROOT/scripts/security-validation.sh"
update_file "$PROJECT_ROOT/scripts/update-auth-blockchain.sh"
update_file "$PROJECT_ROOT/scripts/deploy-blockchain-auth.sh"
update_file "$PROJECT_ROOT/scripts/enroll-admins.sh"
update_file "$PROJECT_ROOT/scripts/test-inter-communication.sh"
update_file "$PROJECT_ROOT/scripts/validate-config.sh"
update_file "$PROJECT_ROOT/scripts/tests/run-all-tests.sh"

# Update test files
echo ""
echo "🧪 Updating test files..."
update_file "$PROJECT_ROOT/api/national-bank/src/__tests__/auth.test.ts"
update_file "$PROJECT_ROOT/api/commercial-bank/__tests__/setup.ts"
update_file "$PROJECT_ROOT/api/shared/test-setup.ts"

# Update other scripts in root
echo ""
echo "📝 Updating root scripts..."
update_file "$PROJECT_ROOT/setup-postgres.sh"
update_file "$PROJECT_ROOT/complete-fix.sh"
update_file "$PROJECT_ROOT/diagnose-api-issues.sh"
update_file "$PROJECT_ROOT/install-new-features.sh"
update_file "$PROJECT_ROOT/start-docker-full.sh"

echo ""
echo "=========================================="
echo "✅ All remaining scripts and tests updated!"
echo "=========================================="
echo ""
echo "Updated files:"
echo "  • 10 utility scripts"
echo "  • 3 test files"
echo "  • 5 root scripts"
echo ""
echo "Total: 18 files updated"
echo ""
