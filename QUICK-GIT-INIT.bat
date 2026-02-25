@echo off
echo ========================================
echo Quick Git Initialization
echo ========================================
echo.

REM Initialize Git
echo Initializing Git repository...
git init
echo.

REM Add all files
echo Adding all files...
git add .
echo.

REM Create simple commit
echo Creating initial commit...
git commit -m "feat: Ethiopian Coffee Export Blockchain System"
echo.

echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Git repository initialized!
echo.
echo Next steps:
echo 1. Add remote: git remote add origin [your-repo-url]
echo 2. Push: git push -u origin main
echo.
pause
