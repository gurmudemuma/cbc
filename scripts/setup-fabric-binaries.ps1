# Download Hyperledger Fabric Binaries for Windows
# Version 2.5.0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Downloading Fabric Binaries v2.5.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$FABRIC_VERSION = "2.5.0"
$CA_VERSION = "1.5.5"

# Create bin directory
if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
    Write-Host "Created bin directory" -ForegroundColor Green
}

# Download URLs
$FABRIC_URL = "https://github.com/hyperledger/fabric/releases/download/v$FABRIC_VERSION/hyperledger-fabric-windows-amd64-$FABRIC_VERSION.tar.gz"
$CA_URL = "https://github.com/hyperledger/fabric-ca/releases/download/v$CA_VERSION/hyperledger-fabric-ca-windows-amd64-$CA_VERSION.tar.gz"

Write-Host "Downloading Fabric binaries..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $FABRIC_URL -OutFile "fabric-binaries.tar.gz"
    Write-Host "Downloaded Fabric binaries" -ForegroundColor Green
} catch {
    Write-Host "Failed to download Fabric binaries" -ForegroundColor Red
    exit 1
}

Write-Host "Downloading Fabric CA binaries..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $CA_URL -OutFile "fabric-ca-binaries.tar.gz"
    Write-Host "Downloaded Fabric CA binaries" -ForegroundColor Green
} catch {
    Write-Host "Failed to download Fabric CA binaries" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Extracting binaries..." -ForegroundColor Yellow

# Extract using tar (available in Windows 10+)
tar -xzf fabric-binaries.tar.gz
tar -xzf fabric-ca-binaries.tar.gz

Write-Host "Extracted binaries" -ForegroundColor Green

# Cleanup
Remove-Item fabric-binaries.tar.gz
Remove-Item fabric-ca-binaries.tar.gz

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Fabric binaries installed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Binaries installed in: bin/" -ForegroundColor Cyan
Write-Host ""
