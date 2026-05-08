@echo off
REM Quick Start Script for Coffee Export Gateway (Windows)
REM This script sets up and starts the gateway for testing

echo ==========================================
echo Coffee Export Gateway - Quick Start
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo + Node.js version: %NODE_VERSION%
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X npm is not installed.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo + npm version: %NPM_VERSION%
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo + Dependencies installed
    echo.
) else (
    echo + Dependencies already installed
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo + .env file created
    echo ! Please update .env with your configuration
    echo.
) else (
    echo + .env file exists
    echo.
)

REM Create wallets directory if it doesn't exist
if not exist "wallets" (
    echo Creating wallets directory...
    mkdir wallets
    echo + Wallets directory created
    echo.
)

REM Check if admin is enrolled
if not exist "wallets\admin" (
    echo Enrolling admin user...
    echo ! Make sure your Fabric network is running!
    echo.
    pause
    call npm run enroll-admin
    echo.
) else (
    echo + Admin already enrolled
    echo.
)

echo ==========================================
echo Starting Coffee Export Gateway...
echo ==========================================
echo.
echo Gateway will be available at: http://localhost:3000
echo Health check: http://localhost:3000/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
call npm start
