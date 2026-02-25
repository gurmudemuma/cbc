@echo off
echo ========================================
echo Database Setup Script
echo ========================================
echo.
echo This script will:
echo   1. Start PostgreSQL container
echo   2. Wait for PostgreSQL to be ready
echo   3. Run all database migrations
echo   4. Verify table creation
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" exit /b 0

echo.
echo [1/5] Starting PostgreSQL container...
docker-compose -f docker-compose-hybrid.yml up -d postgres
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to start PostgreSQL
    exit /b 1
)
echo ✓ PostgreSQL container started

echo.
echo [2/5] Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak > nul
:wait_postgres
docker exec coffee-postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   Waiting...
    timeout /t 2 /nobreak > nul
    goto wait_postgres
)
echo ✓ PostgreSQL is ready

echo.
echo [3/5] Running database migrations...

echo   - Running init.sql...
docker exec -i coffee-postgres psql -U postgres -d coffee_export_db < cbc\services\shared\database\init.sql
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to run init.sql
    exit /b 1
)

echo   - Running 002_add_sync_tables.sql...
docker exec -i coffee-postgres psql -U postgres -d coffee_export_db < cbc\services\shared\database\migrations\002_add_sync_tables.sql
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to run 002_add_sync_tables.sql
    exit /b 1
)

echo   - Running 003_add_reconciliation_tables.sql...
docker exec -i coffee-postgres psql -U postgres -d coffee_export_db < cbc\services\shared\database\migrations\003_add_reconciliation_tables.sql
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to run 003_add_reconciliation_tables.sql
    exit /b 1
)

echo   - Running 004_add_phase4_tables.sql...
docker exec -i coffee-postgres psql -U postgres -d coffee_export_db < cbc\services\shared\database\migrations\004_add_phase4_tables.sql
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to run 004_add_phase4_tables.sql
    exit /b 1
)

echo ✓ All migrations completed

echo.
echo [4/5] Verifying table creation...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "\dt" > temp_tables.txt
findstr /C:"exporter_profiles" temp_tables.txt >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Tables not found
    del temp_tables.txt
    exit /b 1
)
del temp_tables.txt
echo ✓ Tables verified

echo.
echo [5/5] Checking table count...
docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
echo.

echo ========================================
echo Database Setup Complete!
echo ========================================
echo.
echo Database: coffee_export_db
echo User: postgres
echo Port: 5432
echo Tables: 23 (expected)
echo.
echo You can now:
echo   1. Connect: psql -U postgres -d coffee_export_db
echo   2. List tables: docker exec -it coffee-postgres psql -U postgres -d coffee_export_db -c "\dt"
echo   3. Start other services: docker-compose -f docker-compose-hybrid.yml up -d
echo.
pause
