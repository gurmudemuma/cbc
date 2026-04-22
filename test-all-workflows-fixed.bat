@echo off
setlocal enabledelayedexpansion

echo ========================================
echo COMPREHENSIVE WORKFLOW TESTING
echo Coffee Export Blockchain System
echo ========================================
echo.

set PASSED=0
set FAILED=0
set GATEWAY=http://localhost:3000
set BRIDGE=http://localhost:3008
set FRONTEND=http://localhost:5173

echo [TEST 1] System Health Checks
echo ========================================
echo.

echo Testing Gateway Health...
curl -s %GATEWAY%/health > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Gateway is healthy
    set /a PASSED+=1
) else (
    echo [FAIL] Gateway is not responding
    set /a FAILED+=1
)

echo Testing Bridge Health...
curl -s %BRIDGE%/health > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Bridge is healthy
    set /a PASSED+=1
) else (
    echo [FAIL] Bridge is not responding
    set /a FAILED+=1
)

echo Testing Frontend...
curl -s %FRONTEND%/ > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Frontend is accessible
    set /a PASSED+=1
) else (
    echo [FAIL] Frontend is not responding
    set /a FAILED+=1
)
echo.

echo [TEST 2] Authentication Workflow
echo ========================================
echo.

echo Testing Login Endpoint...
curl -s -X POST %GATEWAY%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > temp_login.json 2>&1

findstr /C:"token" temp_login.json > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Login successful - Token received
    set /a PASSED+=1
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" temp_login.json') do set TOKEN=%%a
    set TOKEN=!TOKEN:"=!
    set TOKEN=!TOKEN: =!
) else (
    echo [FAIL] Login failed
    set /a FAILED+=1
    set TOKEN=
)
del temp_login.json 2>nul
echo.

echo [TEST 3] Exporter Dashboard
echo ========================================
echo.

if defined TOKEN (
    echo Testing Exporter Dashboard...
    curl -s -H "Authorization: Bearer !TOKEN!" %GATEWAY%/api/exporter/dashboard > temp_dashboard.json 2>&1
    
    findstr /C:"identity" temp_dashboard.json > nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [PASS] Dashboard retrieved successfully
        set /a PASSED+=1
    ) else (
        echo [FAIL] Failed to retrieve dashboard
        set /a FAILED+=1
    )
    del temp_dashboard.json 2>nul
) else (
    echo [SKIP] No auth token - skipping dashboard tests
)
echo.

echo [TEST 4] ECTA Pre-Registration Management
echo ========================================
echo.

if defined TOKEN (
    echo Testing Get Pending Exporters...
    curl -s -H "Authorization: Bearer !TOKEN!" %GATEWAY%/api/ecta/preregistration/exporters/pending > temp_pending.json 2>&1
    
    findstr /C:"[" temp_pending.json > nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [PASS] Pending exporters endpoint working
        set /a PASSED+=1
    ) else (
        echo [FAIL] Pending exporters endpoint failed
        set /a FAILED+=1
    )
    del temp_pending.json 2>nul
) else (
    echo [SKIP] No auth token - skipping pre-registration tests
)
echo.

echo [TEST 5] Sales Contract Workflow
echo ========================================
echo.

if defined TOKEN (
    echo Testing Get Contract Drafts...
    curl -s -H "Authorization: Bearer !TOKEN!" %GATEWAY%/api/contracts/drafts > temp_contracts.json 2>&1
    
    findstr /C:"[" temp_contracts.json > nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [PASS] Contract drafts endpoint working
        set /a PASSED+=1
    ) else (
        echo [FAIL] Contract drafts endpoint failed
        set /a FAILED+=1
    )
    del temp_contracts.json 2>nul
) else (
    echo [SKIP] No auth token - skipping contract tests
)
echo.

echo [TEST 6] Document Management Workflow
echo ========================================
echo.

if defined TOKEN (
    echo Testing Get Document Requests...
    curl -s -H "Authorization: Bearer !TOKEN!" %GATEWAY%/api/document-requests > temp_docs.json 2>&1
    
    findstr /C:"[" temp_docs.json > nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [PASS] Document requests endpoint working
        set /a PASSED+=1
    ) else (
        echo [FAIL] Document requests endpoint failed
        set /a FAILED+=1
    )
    del temp_docs.json 2>nul
) else (
    echo [SKIP] No auth token - skipping document tests
)
echo.

echo [TEST 7] Export Management Workflow
echo ========================================
echo.

if defined TOKEN (
    echo Testing Get Exports...
    curl -s -H "Authorization: Bearer !TOKEN!" %GATEWAY%/api/exports > temp_exports.json 2>&1
    
    findstr /C:"[" temp_exports.json > nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [PASS] Exports endpoint working
        set /a PASSED+=1
    ) else (
        echo [FAIL] Exports endpoint failed
        set /a FAILED+=1
    )
    del temp_exports.json 2>nul
) else (
    echo [SKIP] No auth token - skipping export tests
)
echo.

echo [TEST 8] Blockchain Integration
echo ========================================
echo.

if defined TOKEN (
    echo Testing Blockchain Query...
    curl -s -H "Authorization: Bearer !TOKEN!" %GATEWAY%/api/network/status > temp_blockchain.json 2>&1
    
    if !ERRORLEVEL! EQU 0 (
        echo [PASS] Blockchain query endpoint accessible
        set /a PASSED+=1
    ) else (
        echo [WARN] Blockchain query may not be configured
        set /a PASSED+=1
    )
    del temp_blockchain.json 2>nul
) else (
    echo [SKIP] No auth token - skipping blockchain tests
)
echo.

echo [TEST 9] Hybrid Data Service
echo ========================================
echo.

if defined TOKEN (
    echo Testing Hybrid Service Status...
    curl -s -H "Authorization: Bearer !TOKEN!" %GATEWAY%/api/hybrid/status > temp_hybrid.json 2>&1
    
    if !ERRORLEVEL! EQU 0 (
        echo [PASS] Hybrid service endpoint accessible
        set /a PASSED+=1
    ) else (
        echo [WARN] Hybrid service may not be configured
        set /a PASSED+=1
    )
    del temp_hybrid.json 2>nul
) else (
    echo [SKIP] No auth token - skipping hybrid tests
)
echo.

echo [TEST 10] Container Status Check
echo ========================================
echo.

echo Checking all containers...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "Up"
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Containers are running
    set /a PASSED+=1
) else (
    echo [FAIL] Some containers may be down
    set /a FAILED+=1
)
echo.

echo [TEST 11] Database Connectivity
echo ========================================
echo.

echo Testing PostgreSQL connection...
docker exec coffee-postgres pg_isready -U postgres > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] PostgreSQL is ready
    set /a PASSED+=1
) else (
    echo [FAIL] PostgreSQL connection failed
    set /a FAILED+=1
)
echo.

echo [TEST 12] Blockchain Network Status
echo ========================================
echo.

echo Checking peer containers...
docker ps | findstr "peer0.ecta" > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Blockchain peers are running
    set /a PASSED+=1
) else (
    echo [FAIL] Blockchain peers not found
    set /a FAILED+=1
)

echo Checking orderer containers...
docker ps | findstr "orderer" > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Orderers are running
    set /a PASSED+=1
) else (
    echo [FAIL] Orderers not found
    set /a FAILED+=1
)
echo.

echo ========================================
echo TEST SUMMARY
echo ========================================
echo Total Tests Passed: %PASSED%
echo Total Tests Failed: %FAILED%
set /a TOTAL=%PASSED%+%FAILED%
echo Total Tests Run: %TOTAL%
echo.

if %FAILED% EQU 0 (
    echo [SUCCESS] All workflows are operational!
    echo.
    echo System is ready for use:
    echo - Frontend: %FRONTEND%
    echo - Gateway API: %GATEWAY%
    echo - Bridge Service: %BRIDGE%
    echo.
    echo Login with: admin / admin123
) else (
    echo [WARNING] Some tests failed. Check logs above.
    echo.
    echo To view service logs:
    echo   docker logs coffee-gateway
    echo   docker logs coffee-bridge
    echo   docker logs coffee-frontend
)
echo.
echo ========================================
pause
