@echo off
REM ============================================================================
REM Start All APIs Script (Windows)
REM 
REM This script starts all 7 API services for the CBC (Coffee Export Blockchain)
REM project in parallel with proper logging and error handling.
REM
REM Usage:
REM   start-all-apis.bat              - Start all services
REM   start-all-apis.bat help         - Show help
REM   start-all-apis.bat check        - Check prerequisites
REM   start-all-apis.bat logs         - Show logs
REM   start-all-apis.bat stop         - Stop all services
REM ============================================================================

setlocal enabledelayedexpansion

REM Configuration
set SCRIPT_DIR=%~dp0
set LOG_DIR=%SCRIPT_DIR%logs
set PID_FILE=%SCRIPT_DIR%.api-pids.txt
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set TIMESTAMP=%mydate%_%mytime%

REM API Services Configuration
set "SERVICES[0]=commercial-bank:3001"
set "SERVICES[1]=custom-authorities:3002"
set "SERVICES[2]=ecta:3003"
set "SERVICES[3]=exporter-portal:3004"
set "SERVICES[4]=national-bank:3005"
set "SERVICES[5]=ecx:3006"
set "SERVICES[6]=shipping-line:3007"

REM ============================================================================
REM Helper Functions
REM ============================================================================

:print_header
echo.
echo ================================
echo %~1
echo ================================
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
REM Prerequisite Checks
REM ============================================================================

:check_prerequisites
call :print_header "Checking Prerequisites"

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed"
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    call :print_success "Node.js !NODE_VERSION!"
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "npm is not installed"
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    call :print_success "npm !NPM_VERSION!"
)

REM Check if api directory exists
if not exist "%SCRIPT_DIR%api" (
    call :print_error "API directory not found at %SCRIPT_DIR%api"
    exit /b 1
) else (
    call :print_success "API directory found"
)

REM Check if node_modules exists
if not exist "%SCRIPT_DIR%api\node_modules" (
    call :print_warning "node_modules not found. Run 'npm install' first"
    exit /b 1
) else (
    call :print_success "node_modules found"
)

call :print_success "All prerequisites met"
exit /b 0

REM ============================================================================
REM Port Availability Check
REM ============================================================================

:check_port_available
setlocal
set PORT=%~1
set SERVICE=%~2

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    call :print_error "Port %PORT% (%SERVICE%) is already in use"
    endlocal
    exit /b 1
)

call :print_success "Port %PORT% available for %SERVICE%"
endlocal
exit /b 0

:check_all_ports
call :print_header "Checking Port Availability"

for %%s in (%SERVICES%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%s") do (
        call :check_port_available %%b %%a
        if !errorlevel! neq 0 exit /b 1
    )
)

exit /b 0

REM ============================================================================
REM Environment Setup
REM ============================================================================

:setup_environment
call :print_header "Setting Up Environment"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
call :print_success "Logs directory: %LOG_DIR%"

if exist "%PID_FILE%" del "%PID_FILE%"
call :print_success "PID file created: %PID_FILE%"

exit /b 0

REM ============================================================================
REM Service Start Functions
REM ============================================================================

:start_service
setlocal
set SERVICE=%~1
set PORT=%~2
set SERVICE_DIR=%SCRIPT_DIR%api\%SERVICE%
set LOG_FILE=%LOG_DIR%\%SERVICE%.log

call :print_info "Starting %SERVICE% on port %PORT%..."

if not exist "%SERVICE_DIR%" (
    call :print_error "Service directory not found: %SERVICE_DIR%"
    endlocal
    exit /b 1
)

cd /d "%SERVICE_DIR%"

REM Start service in background
set PORT=%PORT%
set NODE_ENV=development
start "CBC-%SERVICE%" cmd /k npm run dev > "%LOG_FILE%" 2>&1

REM Wait for service to start
timeout /t 2 /nobreak >nul

call :print_success "Started %SERVICE%"
endlocal
exit /b 0

:start_all_services
call :print_header "Starting All API Services"

for %%s in (%SERVICES%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%s") do (
        call :start_service %%a %%b
        if !errorlevel! neq 0 exit /b 1
    )
)

call :print_info "Waiting for services to be ready..."
timeout /t 3 /nobreak >nul

call :print_header "Checking Service Health"
call :check_service_health

exit /b 0

REM ============================================================================
REM Health Check Functions
REM ============================================================================

:check_service_health
setlocal enabledelayedexpansion

for %%s in (%SERVICES%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%s") do (
        set SERVICE=%%a
        set PORT=%%b
        
        REM Try to connect to health endpoint
        powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:!PORT!/health' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { Write-Host '[OK] !SERVICE! is healthy' } } catch { Write-Host '[ERROR] !SERVICE! is not responding' }" 2>nul
    )
)

endlocal
exit /b 0

REM ============================================================================
REM Stop Functions
REM ============================================================================

:stop_all_services
call :print_header "Stopping All Services"

REM Kill all node processes started by this script
taskkill /FI "WINDOWTITLE eq CBC-*" /T /F >nul 2>&1

call :print_success "All services stopped"
exit /b 0

REM ============================================================================
REM Log Functions
REM ============================================================================

:show_logs
call :print_header "Service Logs"

if not exist "%LOG_DIR%" (
    call :print_error "No logs directory found"
    exit /b 1
)

for %%f in ("%LOG_DIR%\*.log") do (
    call :print_info "=== %%~nf ==="
    type "%%f"
    echo.
)

exit /b 0

REM ============================================================================
REM Help Function
REM ============================================================================

:show_help
echo.
echo CBC API Services Startup Script
echo.
echo Usage:
echo     start-all-apis.bat [COMMAND]
echo.
echo Commands:
echo     (no args)       Start all API services
echo     help            Show this help message
echo     check           Check prerequisites
echo     logs            Show recent logs
echo     stop            Stop all services
echo     restart         Restart all services
echo     health          Check service health
echo.
echo Services:
echo     Commercial Bank API    - http://localhost:3001
echo     Custom Authorities API - http://localhost:3002
echo     ECTA API              - http://localhost:3003
echo     Exporter Portal API   - http://localhost:3004
echo     National Bank API     - http://localhost:3005
echo     ECX API               - http://localhost:3006
echo     Shipping Line API     - http://localhost:3007
echo.
echo Examples:
echo     start-all-apis.bat
echo     start-all-apis.bat check
echo     start-all-apis.bat logs
echo     start-all-apis.bat stop
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
    exit /b 0
)

if "%COMMAND%"=="check" (
    call :check_prerequisites
    if !errorlevel! neq 0 exit /b 1
    call :check_all_ports
    exit /b !errorlevel!
)

if "%COMMAND%"=="logs" (
    call :show_logs
    exit /b 0
)

if "%COMMAND%"=="stop" (
    call :stop_all_services
    exit /b 0
)

if "%COMMAND%"=="restart" (
    call :stop_all_services
    timeout /t 2 /nobreak >nul
    call :setup_environment
    call :check_prerequisites
    if !errorlevel! neq 0 exit /b 1
    call :check_all_ports
    if !errorlevel! neq 0 exit /b 1
    call :start_all_services
    exit /b !errorlevel!
)

if "%COMMAND%"=="health" (
    call :check_service_health
    exit /b 0
)

if "%COMMAND%"=="start" (
    call :print_header "CBC API Services Startup"
    call :print_info "Starting all API services..."
    echo.
    
    call :check_prerequisites
    if !errorlevel! neq 0 exit /b 1
    echo.
    
    call :check_all_ports
    if !errorlevel! neq 0 exit /b 1
    echo.
    
    call :setup_environment
    echo.
    
    call :start_all_services
    if !errorlevel! neq 0 exit /b 1
    echo.
    
    call :print_header "All Services Started Successfully"
    call :print_info "Services are running on the following ports:"
    echo   commercial-bank: http://localhost:3001
    echo   custom-authorities: http://localhost:3002
    echo   ecta: http://localhost:3003
    echo   exporter-portal: http://localhost:3004
    echo   national-bank: http://localhost:3005
    echo   ecx: http://localhost:3006
    echo   shipping-line: http://localhost:3007
    echo.
    call :print_info "View logs: start-all-apis.bat logs"
    call :print_info "Stop services: start-all-apis.bat stop"
    echo.
    call :print_success "Ready to accept requests!"
    exit /b 0
)

call :print_error "Unknown command: %COMMAND%"
call :show_help
exit /b 1

REM Run main function
call :main %*
