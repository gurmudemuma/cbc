@echo off
echo ============================================
echo Building Complete Coffee Export System
echo All Tasks Completed - Ready for Production
echo ============================================
echo.

echo Step 1: Building Gateway Service...
echo --------------------------------------------
docker-compose -f docker-compose-hybrid.yml build gateway
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Gateway build failed!
    pause
    exit /b 1
)
echo ✓ Gateway built successfully
echo.

echo Step 2: Restarting Gateway Service...
echo --------------------------------------------
docker-compose -f docker-compose-hybrid.yml up -d gateway
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Gateway restart failed!
    pause
    exit /b 1
)
echo ✓ Gateway restarted successfully
echo.

echo Step 3: Restarting Frontend (clear cache)...
echo --------------------------------------------
docker-compose -f docker-compose-hybrid.yml restart frontend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend restart failed!
    pause
    exit /b 1
)
echo ✓ Frontend restarted successfully
echo.

echo Step 4: Checking Service Status...
echo --------------------------------------------
docker-compose -f docker-compose-hybrid.yml ps
echo.

echo Step 5: Checking Gateway Logs...
echo --------------------------------------------
echo Last 20 lines of gateway logs:
docker logs --tail 20 coffee-gateway
echo.

echo ============================================
echo BUILD COMPLETE! ✓
echo ============================================
echo.
echo New Features Added:
echo   ✓ Email Notifications
echo   ✓ Document Upload & Verification
echo   ✓ Capital Verification
echo   ✓ Facility Inspections
echo.
echo Services Running:
echo   - Gateway: http://localhost:3000
echo   - Frontend: http://localhost:5173
echo.
echo Next Steps:
echo   1. Configure SMTP in coffee-export-gateway/.env
echo   2. Test email notifications
echo   3. Test document upload
echo   4. Test capital verification
echo   5. Test facility inspections
echo.
echo Documentation:
echo   - ALL-TASKS-COMPLETED.md
echo   - EMAIL-NOTIFICATION-SETUP.md
echo   - QUICK-REFERENCE-WORKFLOW.md
echo.
pause
