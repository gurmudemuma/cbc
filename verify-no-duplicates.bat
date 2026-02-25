@echo off
echo ============================================
echo Verifying No Code Duplicates
echo ============================================
echo.

echo Checking for duplicate files...
echo.

echo [1] Checking for backup files...
dir /s /b *.backup *.old *.new *.copy *.duplicate 2>nul | find /c /v ""
if %errorlevel% equ 0 (
    echo   Found backup files:
    dir /s /b *.backup *.old *.new *.copy *.duplicate 2>nul
) else (
    echo   ✓ No backup files found
)

echo.
echo [2] Checking for duplicate Dockerfiles...
set dockerfile_count=0
for /r "cbc\services" %%f in (Dockerfile*) do (
    set /a dockerfile_count+=1
)
echo   Found %dockerfile_count% Dockerfile(s) in cbc/services
echo   Expected: 9 (one per service + ecta, esw, exporter-portal)

echo.
echo [3] Checking for duplicate startup scripts...
dir /b start*.bat 2>nul | find /c /v ""
echo   Startup scripts found (should be 1-2):
dir /b start*.bat 2>nul

echo.
echo [4] Checking for duplicate documentation...
dir /b *FIX*.md *ISSUE*.md *DUPLICATE*.md 2>nul | find /c /v ""
if %errorlevel% equ 0 (
    echo   Found potential duplicate docs:
    dir /b *FIX*.md *ISSUE*.md *DUPLICATE*.md 2>nul
) else (
    echo   ✓ No duplicate documentation found
)

echo.
echo [5] Checking service structure...
echo   Services in cbc/services/:
dir /b /ad "cbc\services" 2>nul | findstr /v "shared"

echo.
echo [6] Checking for duplicate database files...
dir /s /b init.sql 2>nul | find /c /v ""
echo   init.sql files found (should be 1):
dir /s /b init.sql 2>nul

echo.
echo ============================================
echo Verification Complete
echo ============================================
echo.
echo If you see any unexpected duplicates above,
echo run cleanup-duplicates.bat to remove them.
echo.
pause
