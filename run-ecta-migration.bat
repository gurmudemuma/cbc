@echo off
REM ECTA Database Migration Script for Windows
REM This script runs the 006_fix_exports_status_values.sql migration

echo ================================================================
echo    ECTA Database Migration - Fix Exports Status Values
echo ================================================================
echo.

REM Check if .env file exists
if not exist .env (
    echo Error: .env file not found
    echo Please create a .env file with your database credentials
    pause
    exit /b 1
)

REM Load environment variables from .env
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_PORT" set DB_PORT=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set PGPASSWORD=%%b
)

REM Set default values if not in .env
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=5432
if not defined DB_NAME set DB_NAME=coffee_export_db
if not defined DB_USER set DB_USER=postgres

echo Migration Details:
echo    Database: %DB_NAME%
echo    Host: %DB_HOST%:%DB_PORT%
echo    User: %DB_USER%
echo.

REM Confirm before proceeding
set /p CONFIRM="This will modify your database schema. Continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Migration cancelled
    pause
    exit /b 1
)

echo.
echo Running migration...
echo.

REM Run the migration
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f api\shared\database\migrations\006_fix_exports_status_values.sql

if %ERRORLEVEL% equ 0 (
    echo.
    echo Migration completed successfully!
    echo.
    echo Verification queries:
    echo.
    
    echo 1. Checking status constraint...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT constraint_name FROM information_schema.check_constraints WHERE constraint_name = 'exports_status_check';"
    
    echo.
    echo 2. Checking new columns...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'exports' AND column_name LIKE '%%approved%%' ORDER BY column_name;"
    
    echo.
    echo 3. Checking quality_certificates table...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\d quality_certificates"
    
    echo.
    echo ================================================================
    echo    Migration Complete - Ready for Testing
    echo ================================================================
    echo.
    echo Next steps:
    echo 1. Restart your ECTA API: cd api\ecta ^&^& npm start
    echo 2. Test approval/rejection flows
    echo 3. Verify data persistence in database
    echo.
) else (
    echo.
    echo Migration failed!
    echo Please check the error messages above and fix any issues.
    echo.
)

pause

