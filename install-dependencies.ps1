# PowerShell Script for npm installation
# Windows-compatible installation script

Write-Host ""
Write-Host "========================================"
Write-Host "Coffee Blockchain - Dependency Installation"
Write-Host "========================================"
Write-Host ""

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "[1/5] npm version: $npmVersion"
} catch {
    Write-Host "ERROR: npm is not installed or not in PATH"
    Write-Host "Please install Node.js from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/5] Setting npm registry to official registry..."
npm config set registry https://registry.npmjs.org/
Write-Host "Registry set to: https://registry.npmjs.org/"
Write-Host ""

Write-Host "[3/5] Configuring npm timeout settings..."
npm config set fetch-timeout 120000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
Write-Host "Timeout settings configured"
Write-Host ""

Write-Host "[4/5] Cleaning npm cache..."
npm cache clean --force
Write-Host "Cache cleaned"
Write-Host ""

Write-Host "[5/5] Installing dependencies..."
Write-Host "This may take several minutes..."
Write-Host ""

# Change to the script directory
Set-Location -Path $PSScriptRoot

# Run npm ci
npm ci --legacy-peer-deps --no-audit --no-fund

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "SUCCESS: Dependencies installed!"
    Write-Host "========================================"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
} else {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "ERROR: Installation failed"
    Write-Host "========================================"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
