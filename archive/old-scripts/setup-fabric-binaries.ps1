# Download Hyperledger Fabric binaries
$ErrorActionPreference = "Stop"

$FABRIC_VERSION = "2.5.0"
$CA_VERSION = "1.5.5"
$ARCH = "windows-amd64"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Downloading Fabric Binaries" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create bin directory
if (!(Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

# Download URLs
$FABRIC_URL = "https://github.com/hyperledger/fabric/releases/download/v$FABRIC_VERSION/hyperledger-fabric-$ARCH-$FABRIC_VERSION.tar.gz"
$CA_URL = "https://github.com/hyperledger/fabric-ca/releases/download/v$CA_VERSION/hyperledger-fabric-ca-$ARCH-$CA_VERSION.tar.gz"

Write-Host "Downloading Fabric binaries v$FABRIC_VERSION..." -ForegroundColor Yellow

try {
    # Download Fabric binaries
    $fabricFile = "fabric-binaries.tar.gz"
    Invoke-WebRequest -Uri $FABRIC_URL -OutFile $fabricFile
    
    Write-Host "Extracting Fabric binaries..." -ForegroundColor Yellow
    tar -xzf $fabricFile -C .
    Remove-Item $fabricFile
    
    Write-Host "✓ Fabric binaries installed" -ForegroundColor Green
    
    # Download CA binaries
    Write-Host "Downloading Fabric CA binaries v$CA_VERSION..." -ForegroundColor Yellow
    $caFile = "ca-binaries.tar.gz"
    Invoke-WebRequest -Uri $CA_URL -OutFile $caFile
    
    Write-Host "Extracting CA binaries..." -ForegroundColor Yellow
    tar -xzf $caFile -C .
    Remove-Item $caFile
    
    Write-Host "✓ Fabric CA binaries installed" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " Installation Complete!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Installed binaries:" -ForegroundColor White
    Get-ChildItem bin\*.exe | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
    
} catch {
    Write-Host "ERROR: Failed to download binaries" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
