@echo off
REM ============================================================================
REM Run Organization Migration (Migration 008)
REM ============================================================================
REM Purpose: Add organization_id to exports table and create organizations table
REM Date: 2025-01-02
REM ============================================================================

echo.
echo ============================================================================
echo Running Organization Migration (Migration 008)
echo ============================================================================
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL connection...
psql -U postgres -d coffee_export_db -c "SELECT version();" > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot connect to PostgreSQL database
    echo Please ensure PostgreSQL is running and credentials are correct
    echo.
    echo Trying to start PostgreSQL service...
    net start postgresql-x64-14 > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Could not start PostgreSQL service automatically
        echo Please start PostgreSQL manually and run this script again
    )
    pause
    exit /b 1
)

echo PostgreSQL connection successful!
echo.

REM Run the migration
echo Running migration 008_add_organization_to_exports.sql...
psql -U postgres -d coffee_export_db -f api/shared/database/migrations/008_add_organization_to_exports.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================================
    echo Migration completed successfully!
    echo ============================================================================
    echo.
    echo Verifying migration...
    echo.
    
    REM Verify the migration
    psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) as total_exports, COUNT(organization_id) as with_org_id FROM exports;"
    echo.
    psql -U postgres -d coffee_export_db -c "SELECT organization_id, organization_name, organization_type FROM organizations ORDER BY organization_type, organization_name LIMIT 10;"
    echo.
    echo Migration verification complete!
    echo.
) else (
    echo.
    echo ============================================================================
    echo ERROR: Migration failed!
    echo ============================================================================
    echo Please check the error messages above
    echo.
)

echo.
echo Press any key to exit...
pause > nul
