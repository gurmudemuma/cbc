@echo off
echo ========================================
echo Cleaning Up Codebase
echo ========================================
echo.
echo Removing temporary documentation files...
echo.

REM Remove all the temporary troubleshooting docs
del /q "ALL-TASKS-COMPLETED.md" 2>nul
del /q "API-FIXES-SUMMARY.md" 2>nul
del /q "BUILD-AND-DEPLOY-CHECKLIST.md" 2>nul
del /q "BUSINESS-TYPES-IMPLEMENTED.md" 2>nul
del /q "CLEAR-CACHE-NOW.md" 2>nul
del /q "COMPLETE-FIX-SUMMARY.md" 2>nul
del /q "COMPLETE-WORKFLOW-STATUS.md" 2>nul
del /q "DUAL-WRITE-SYSTEM-FIXED.md" 2>nul
del /q "ECTA-ENDPOINTS-FIXED.md" 2>nul
del /q "EMAIL-NOTIFICATION-SETUP.md" 2>nul
del /q "EXPORTER-REGISTRATION-WORKFLOW-ANALYSIS.md" 2>nul
del /q "EXPORTER-WORKFLOW-VERIFICATION.md" 2>nul
del /q "EXPERT-ASSESSMENT-SUMMARY.md" 2>nul
del /q "FINAL-STATUS.md" 2>nul
del /q "FORCE-RELOAD-INSTRUCTIONS.md" 2>nul
del /q "FRESH-START.bat" 2>nul
del /q "FRONTEND-API-PATH-FIX.md" 2>nul
del /q "FRONTEND-ERROR-FIXES.md" 2>nul
del /q "GATEWAY-BUILD-FIX.md" 2>nul
del /q "IMPLEMENTATION-STATUS-UPDATE.md" 2>nul
del /q "IMPORT-ERRORS-FIXED.md" 2>nul
del /q "QUICK-FIX-AND-REBUILD.bat" 2>nul
del /q "QUICK-REFERENCE-WORKFLOW.md" 2>nul
del /q "QUICK-START-GUIDE.md" 2>nul
del /q "READY-TO-BUILD.md" 2>nul
del /q "REBUILD-GATEWAY.bat" 2>nul
del /q "REGISTRATION-FIX.md" 2>nul
del /q "REGISTRATION-GUIDE.md" 2>nul
del /q "REGISTRATION-WORKING.md" 2>nul
del /q "SOLUTION-FOUND.md" 2>nul
del /q "START-SIMPLE.md" 2>nul
del /q "START-COMPLETE-SYSTEM.bat" 2>nul
del /q "STOP-COMPLETE-SYSTEM.bat" 2>nul
del /q "SYSTEM-FULLY-OPERATIONAL.md" 2>nul
del /q "SYSTEM-READY.md" 2>nul
del /q "SYSTEM-STATUS.md" 2>nul
del /q "UNHEALTHY-SERVICES-ANALYSIS.md" 2>nul
del /q "USER-SYNC-STATUS.md" 2>nul
del /q "WORKFLOW-VERIFICATION-COMPLETE.md" 2>nul
del /q "deploy-registration-system.bat" 2>nul
del /q "test-registration.bat" 2>nul
del /q "test-business-types.bat" 2>nul
del /q "FIX-AND-TEST.bat" 2>nul
del /q "FINAL-SOLUTION.md" 2>nul

echo Done!
echo.
echo Moving essential documentation to docs folder...
echo.

REM Move essential docs to docs folder
move /y "HYBRID-SYSTEM-GUIDE.md" "docs\HYBRID-SYSTEM-GUIDE.md" 2>nul
move /y "README-START-HERE.md" "docs\README-START-HERE.md" 2>nul

echo Done!
echo.
echo ========================================
echo Codebase Cleaned!
echo ========================================
echo.
echo Root directory now has:
echo   - README.md (Main documentation)
echo   - START-HYBRID.bat (Start everything)
echo   - STOP-HYBRID.bat (Stop everything)
echo   - REBUILD-FRONTEND.bat (Rebuild frontend)
echo.
echo Documentation moved to docs/:
echo   - docs/HYBRID-SYSTEM-GUIDE.md
echo   - docs/README-START-HERE.md
echo   - docs/USER-SYNC-COMPLETE.md
echo   - docs/USER-SYNC-IMPLEMENTATION.md
echo   - docs/CODEBASE.md
echo   - docs/architecture/system-overview.md
echo.
echo Removed:
echo   - 30+ temporary troubleshooting docs
echo   - Old startup scripts
echo   - Duplicate documentation
echo.
pause
