@echo off
REM ========================================
REM Coffee Blockchain - Windows Installation Script
REM Compatible with Windows Command Prompt
REM ========================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Coffee Blockchain - Dependency Installation
echo ========================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Current directory: %cd%
echo.

REM Check if npm is installed
echo Checking for npm installation...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo 1. Download the LTS version
    echo 2. Run the installer
    echo 3. Restart Command Prompt
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

REM Display npm version
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo.

REM Step 1: Set registry
echo [Step 1/6] Setting npm registry...
call npm config set registry https://registry.npmjs.org/
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to set registry
    pause
    exit /b 1
)
echo Registry set successfully
echo.

REM Step 2: Configure timeouts
echo [Step 2/6] Configuring npm timeout settings...
call npm config set fetch-timeout 120000
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
echo Timeout settings configured
echo.

REM Step 3: Clean cache
echo [Step 3/6] Cleaning npm cache...
call npm cache clean --force
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Cache clean had issues, continuing anyway...
)
echo.

REM Step 4: Remove old node_modules if exists
echo [Step 4/6] Checking for old node_modules...
if exist "node_modules" (
    echo Removing old node_modules directory...
    rmdir /s /q node_modules 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Could not remove old node_modules, continuing...
    )
)
echo.

REM Step 5: Install dependencies
echo [Step 5/6] Installing dependencies...
echo This may take 5-15 minutes depending on your internet speed...
echo.
call npm ci --legacy-peer-deps --no-audit --no-fund

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Installation failed
    echo ========================================
    echo.
    echo Troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Disable antivirus temporarily
    echo 3. Check Windows Firewall settings
    echo 4. Try again in a few minutes
    echo.
    echo For more help, see: WINDOWS_INSTALLATION_GUIDE.md
    echo.
    pause
    exit /b 1
)

REM Step 6: Verify installation
echo.
echo [Step 6/6] Verifying installation...
call npm list --depth=0 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Verification had issues, but installation may still be OK
) else (
    echo Installation verified successfully
)

echo.
echo ========================================
echo SUCCESS: Dependencies installed!
echo ========================================
echo.
echo Next steps:
echo 1. For frontend development:
echo    cd frontend
echo    npm run dev
echo.
echo 2. For building:
echo    npm run build
echo.
echo 3. For testing:
echo    npm test
echo.
pause
exit /b 0
