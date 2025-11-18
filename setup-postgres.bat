@echo off
REM PostgreSQL Setup Script for Coffee Export System (Windows)
REM This script automates the setup of PostgreSQL databases and migrations

setlocal enabledelayedexpansion

echo.
echo ========================================
echo PostgreSQL Setup for Coffee Export
echo ========================================
echo.

REM Check if Docker is running
echo Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Start PostgreSQL services
echo Starting PostgreSQL services...
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d postgres-national-bank postgres-exporter-portal pgadmin
echo [OK] PostgreSQL services started
echo.

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak

REM Check National Bank PostgreSQL
echo Checking National Bank PostgreSQL connection...
for /L %%i in (1,1,30) do (
    docker exec postgres-national-bank pg_isready -U nationalbank -d national_bank_db >nul 2>&1
    if errorlevel 0 (
        echo [OK] National Bank PostgreSQL is ready
        goto national_bank_ready
    )
    timeout /t 1 /nobreak
)
echo [ERROR] National Bank PostgreSQL failed to start
exit /b 1

:national_bank_ready
echo Checking Exporter Portal PostgreSQL connection...
for /L %%i in (1,1,30) do (
    docker exec postgres-exporter-portal pg_isready -U exporter_portal -d exporter_portal_db >nul 2>&1
    if errorlevel 0 (
        echo [OK] Exporter Portal PostgreSQL is ready
        goto exporter_portal_ready
    )
    timeout /t 1 /nobreak
)
echo [ERROR] Exporter Portal PostgreSQL failed to start
exit /b 1

:exporter_portal_ready
echo.

REM Setup National Bank API
echo Setting up National Bank API...
cd api\national-bank

if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created
)

echo Installing dependencies...
call npm install >nul 2>&1
echo [OK] Dependencies installed

echo Generating Prisma Client...
call npm run prisma:generate >nul 2>&1
echo [OK] Prisma Client generated

echo Running database migrations...
call npm run prisma:migrate:deploy >nul 2>&1
echo [OK] Database migrations completed

cd ..\..

echo.

REM Setup Exporter Portal API
echo Setting up Exporter Portal API...
cd api\exporter-portal

if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created
)

echo Installing dependencies...
call npm install >nul 2>&1
echo [OK] Dependencies installed

echo Generating Prisma Client...
call npm run prisma:generate >nul 2>&1
echo [OK] Prisma Client generated

echo Running database migrations...
call npm run prisma:migrate:deploy >nul 2>&1
echo [OK] Database migrations completed

cd ..\..

echo.

REM Summary
echo ========================================
echo [OK] PostgreSQL Setup Complete!
echo ========================================
echo.

echo Database Connection Details:
echo   National Bank:
echo     Host: localhost:5432
echo     User: nationalbank
echo     Password: nationalbank_dev_password
echo     Database: national_bank_db
echo.
echo   Exporter Portal:
echo     Host: localhost:5433
echo     User: exporter_portal
echo     Password: exporter_portal_dev_password
echo     Database: exporter_portal_db
echo.

echo Next Steps:
echo   1. Start National Bank API:
echo      cd api\national-bank ^&^& npm run dev
echo.
echo   2. Start Exporter Portal API (in another terminal):
echo      cd api\exporter-portal ^&^& npm run dev
echo.
echo   3. (Optional) Open pgAdmin:
echo      http://localhost:5050
echo      Email: admin@coffee-export.local
echo      Password: admin
echo.

echo Useful Commands:
echo   View database with Prisma Studio (National Bank):
echo     cd api\national-bank ^&^& npm run prisma:studio
echo.
echo   View database with Prisma Studio (Exporter Portal):
echo     cd api\exporter-portal ^&^& npm run prisma:studio
echo.
echo   Stop PostgreSQL services:
echo     docker-compose -f docker-compose.yml -f docker-compose.override.yml down
echo.

pause
