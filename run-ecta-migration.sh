#!/bin/bash

# ECTA Database Migration Script
# This script runs the 006_fix_exports_status_values.sql migration

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ECTA Database Migration - Fix Exports Status Values     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your database credentials"
    exit 1
fi

# Load environment variables
source .env

# Set default values if not in .env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-coffee_export_db}
DB_USER=${DB_USER:-postgres}

echo "📋 Migration Details:"
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   User: $DB_USER"
echo ""

# Confirm before proceeding
read -p "⚠️  This will modify your database schema. Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🔄 Running migration..."
echo ""

# Run the migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f api/shared/database/migrations/006_fix_exports_status_values.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Verification queries:"
    echo ""
    
    # Run verification queries
    echo "1. Checking status constraint..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT constraint_name FROM information_schema.check_constraints WHERE constraint_name = 'exports_status_check';"
    
    echo ""
    echo "2. Checking new columns..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'exports' AND column_name LIKE '%approved%' ORDER BY column_name;"
    
    echo ""
    echo "3. Checking quality_certificates table..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d quality_certificates"
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   Migration Complete - Ready for Testing                  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "1. Restart your ECTA API: cd api/ecta && npm start"
    echo "2. Test approval/rejection flows"
    echo "3. Verify data persistence in database"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above and fix any issues."
    echo ""
    exit 1
fi

