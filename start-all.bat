@echo off
REM ============================================================================
REM Coffee Export Blockchain - Complete System Startup (Windows)
REM 
REM This script starts the entire CBC system:
REM 1. Infrastructure (PostgreSQL, Redis, IPFS via Docker)
REM 2. API Services (7 microservices)
REM 3. Frontend (React/Vite)
REM
REM Usage:
REM   start-all.bat              - Start everything
REM   start-all.bat help         - Show help
REM   start-all.bat stop         - Stop everything
REM ============================================================================

setlocal enabledelayedexpansion

REM Colors (using echo for Windows)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Configuration
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM ============================================================================
REM Main Execution
REM ============================================================================
call :main %*
goto :eof

REM ============================================================================
REM Helper Functions
REM ============================================================================

:print_header
echo(
echo ========================================
echo %~1
echo ========================================
exit /b 0

:print_success
echo [OK] %~1
exit /b 0

:print_error
echo [ERROR] %~1
exit /b 0

:print_warning
echo [WARNING] %~1
exit /b 0

:print_info
echo [INFO] %~1
exit /b 0

REM ============================================================================
REM Check Prerequisites
REM ============================================================================

:check_prerequisites
call :print_header "Checking Prerequisites"

REM Check Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "Docker is not installed or not in PATH"
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
) else (
    call :print_success "Docker is installed"
)

REM Check if Docker is running
docker ps >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "Docker daemon is not running"
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
) else (
    call :print_success "Docker daemon is running"
)

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed"
    pause
    exit /b 1
) else (
    call :print_success "Node.js is installed"
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "npm is not installed"
    pause
    exit /b 1
) else (
    call :print_success "npm is installed"
)

call :print_success "All prerequisites met"
echo.
exit /b 0

REM ============================================================================
REM Start Infrastructure
REM ============================================================================

:start_infrastructure
call :print_header "Step 1/3: Starting Infrastructure Services"
call :print_info "Starting PostgreSQL, Redis, and IPFS via Docker..."
echo.

docker-compose -f docker-compose.postgres.yml up -d
if %errorlevel% neq 0 (
    call :print_error "Failed to start infrastructure services"
    pause
    exit /b 1
)

call :print_success "Infrastructure services started"
echo.
call :print_info "Waiting 45 seconds for infrastructure to be ready..."
timeout /t 45 /nobreak >nul
echo.

REM Verify infrastructure health
call :print_info "Checking infrastructure health..."

docker exec postgres pg_isready -U postgres >nul 2>nul
if %errorlevel% equ 0 (
    call :print_success "PostgreSQL is ready"
) else (
    call :print_warning "PostgreSQL may not be fully ready yet"
)

docker exec redis redis-cli ping >nul 2>nul
if %errorlevel% equ 0 (
    call :print_success "Redis is ready"
) else (
    call :print_warning "Redis may not be fully ready yet"
)

echo.
exit /b 0

REM ============================================================================
REM Start API Services
REM ============================================================================

:start_api_services
call :print_header "Step 2/3: Starting API Services"
call :print_info "Starting all 7 API microservices..."
echo.

REM Check if start-all-apis.bat exists
if not exist "%SCRIPT_DIR%start-all-apis.bat" (
    call :print_error "start-all-apis.bat not found"
    call :print_info "Using Docker Compose to start APIs instead..."
    docker-compose -f docker-compose.apis.yml up -d
    if %errorlevel% neq 0 (
        call :print_error "Failed to start API services"
        pause
        exit /b 1
    )
) else (
    call start-all-apis.bat
    if %errorlevel% neq 0 (
        call :print_warning "API startup had issues, trying Docker Compose..."
        docker-compose -f docker-compose.apis.yml up -d
    )
)

call :print_success "API services started"
echo.
call :print_info "Waiting 30 seconds for APIs to be ready..."
timeout /t 30 /nobreak >nul
echo.
exit /b 0

REM ============================================================================
REM Start Frontend
REM ============================================================================

:start_frontend
call :print_header "Step 3/3: Starting Frontend"

REM Check if frontend is already running on port 5173
netstat -ano | findstr ":5173" >nul 2>nul
if %errorlevel% equ 0 (
    call :print_success "Frontend is already running on port 5173"
    echo.
    exit /b 0
)

call :print_info "Starting React/Vite frontend..."
echo.

if not exist "%SCRIPT_DIR%frontend" (
    call :print_error "Frontend directory not found"
    exit /b 1
)

cd /d "%SCRIPT_DIR%frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    call :print_warning "node_modules not found, installing dependencies..."
    call npm install
    if %errorlevel% neq 0 (
        call :print_error "Failed to install frontend dependencies"
        cd /d "%SCRIPT_DIR%"
        exit /b 1
    )
)

REM Start frontend in a new window
start "CBC Frontend" cmd /k npm run dev

cd /d "%SCRIPT_DIR%"

call :print_success "Frontend started in new window"
echo.
call :print_info "Waiting 15 seconds for frontend to be ready..."
timeout /t 15 /nobreak >nul
echo.
exit /b 0

REM ============================================================================
REM Show Summary
REM ============================================================================

:show_summary
call :print_header "System Startup Complete!"
echo.
call :print_success "All services are running!"
echo.

echo Access Points:
echo   Frontend:              http://localhost:5173
echo.
echo   API Services:
echo   Commercial Bank:       http://localhost:3001
echo   Custom Authorities:    http://localhost:3002
echo   ECTA:                  http://localhost:3003
echo   Exporter Portal:       http://localhost:3004
echo   National Bank:         http://localhost:3005
echo   ECX:                   http://localhost:3006
echo   Shipping Line:         http://localhost:3007
echo.
echo   Infrastructure:
echo   PostgreSQL:            localhost:5432
echo   Redis:                 localhost:6379
echo   IPFS:                  localhost:5001
echo.

echo Useful Commands:
echo   View API logs:         docker-compose -f docker-compose.apis.yml logs -f
echo   View infrastructure:   docker-compose -f docker-compose.postgres.yml logs -f
echo   Stop everything:       start-all.bat stop
echo   Check status:          docker ps
echo.

call :print_success "System is ready for use!"
echo.
exit /b 0

REM ============================================================================
REM Stop All Services
REM ============================================================================

:stop_all
call :print_header "Stopping All Services"
echo.

call :print_info "Stopping frontend..."
taskkill /FI "WINDOWTITLE eq CBC Frontend*" /T /F >nul 2>nul
call :print_success "Frontend stopped"

call :print_info "Stopping API services..."
docker-compose -f docker-compose.apis.yml down
call :print_success "API services stopped"

call :print_info "Stopping infrastructure..."
docker-compose -f docker-compose.postgres.yml down
call :print_success "Infrastructure stopped"

echo.
call :print_success "All services stopped"
echo.
exit /b 0

REM ============================================================================
REM Show Help
REM ============================================================================

:show_help
echo.
echo Coffee Export Blockchain - Complete System Startup
echo.
echo Usage:
echo     start-all.bat              Start entire system
echo     start-all.bat help         Show this help
echo     start-all.bat stop         Stop all services
echo.
echo What it does:
echo     1. Starts infrastructure (PostgreSQL, Redis, IPFS)
echo     2. Starts all 7 API microservices
echo     3. Starts frontend (React/Vite)
echo.
echo Prerequisites:
echo     - Docker Desktop (running)
echo     - Node.js 18+
echo     - npm
echo.
echo Services:
echo     Frontend:              http://localhost:5173
echo     Commercial Bank API:   http://localhost:3001
echo     Custom Authorities:    http://localhost:3002
echo     ECTA API:              http://localhost:3003
echo     Exporter Portal:       http://localhost:3004
echo     National Bank API:     http://localhost:3005
echo     ECX API:               http://localhost:3006
echo     Shipping Line API:     http://localhost:3007
echo.
exit /b 0

REM ============================================================================
REM Main Script
REM ============================================================================

:main
set COMMAND=%~1
if "%COMMAND%"=="" set COMMAND=start

if "%COMMAND%"=="help" (
    call :show_help
    pause
    exit /b 0
)

if "%COMMAND%"=="stop" (
    call :stop_all
    pause
    exit /b 0
)

if "%COMMAND%"=="start" (
    call :print_header "Coffee Export Blockchain - System Startup"
    call :print_info "Starting entire system..."
    echo.
    
    call :check_prerequisites
    if %errorlevel% neq 0 exit /b 1
    
    call :start_infrastructure
    if %errorlevel% neq 0 exit /b 1
    
    call :start_api_services
    if %errorlevel% neq 0 exit /b 1
    
    call :start_frontend
    if %errorlevel% neq 0 exit /b 1
    
    call :show_summary
    
    pause
    exit /b 0
)

call :print_error "Unknown command: %COMMAND%"
call :show_help
pause
exit /b 1

REM End of script
