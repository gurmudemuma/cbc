@echo off
REM Windows Batch Script for npm installation
REM Compatible with Windows Command Prompt and PowerShell

echo.
echo ========================================
echo Coffee Blockchain - Dependency Installation
echo ========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Checking npm version...
call npm --version
echo.

echo [2/5] Setting npm registry to official registry...
call npm config set registry https://registry.npmjs.org/
echo Registry set to: https://registry.npmjs.org/
echo.

echo [3/5] Configuring npm timeout settings...
call npm config set fetch-timeout 120000
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
echo Timeout settings configured
echo.

echo [4/5] Cleaning npm cache...
call npm cache clean --force
echo Cache cleaned
echo.

echo [5/5] Installing dependencies...
echo This may take several minutes...
echo.

cd /d "%~dp0"
call npm ci --legacy-peer-deps --no-audit --no-fund

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Dependencies installed!
    echo ========================================
    echo.
    pause
    exit /b 0
) else (
    echo.
    echo ========================================
    echo ERROR: Installation failed
    echo ========================================
    echo.
    pause
    exit /b 1
)
