#!/bin/bash
# ============================================================================
# Run Organization Migration (Migration 008)
# ============================================================================
# Purpose: Add organization_id to exports table and create organizations table
# Date: 2025-01-02
# ============================================================================

echo ""
echo "============================================================================"
echo "Running Organization Migration (Migration 008)"
echo "============================================================================"
echo ""

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
psql -U postgres -d cbc_db -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to PostgreSQL database"
    echo "Please ensure PostgreSQL is running and credentials are correct"
    exit 1
fi

echo "PostgreSQL connection successful!"
echo ""

# Run the migration
echo "Running migration 008_add_organization_to_exports.sql..."
psql -U postgres -d cbc_db -f api/shared/database/migrations/008_add_organization_to_exports.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================================"
    echo "Migration completed successfully!"
    echo "============================================================================"
    echo ""
    echo "Verifying migration..."
    echo ""
    
    # Verify the migration
    psql -U postgres -d cbc_db -c "SELECT COUNT(*) as total_exports, COUNT(organization_id) as with_org_id FROM exports;"
    echo ""
    psql -U postgres -d cbc_db -c "SELECT organization_id, organization_name, organization_type FROM organizations ORDER BY organization_type, organization_name LIMIT 10;"
    echo ""
    echo "Migration verification complete!"
    echo ""
else
    echo ""
    echo "============================================================================"
    echo "ERROR: Migration failed!"
    echo "============================================================================"
    echo "Please check the error messages above"
    echo ""
    exit 1
fi
