# PowerShell script to add orderer.coffee-export.com to Windows hosts file
# Run this as Administrator

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$hostname = "orderer.coffee-export.com"
$entry = "127.0.0.1 $hostname"

Write-Host "================================================"
Write-Host "Adding Fabric Orderer to Windows Hosts File"
Write-Host "================================================"
Write-Host ""

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Press Win+X" -ForegroundColor Yellow
    Write-Host "  2. Select 'Windows Terminal (Admin)' or 'PowerShell (Admin)'" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use the manual method:" -ForegroundColor Yellow
    Write-Host "  Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value '127.0.0.1 orderer.coffee-export.com'" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Check if entry already exists
$hostsContent = Get-Content $hostsPath
$exists = $hostsContent | Select-String -Pattern $hostname -Quiet

if ($exists) {
    Write-Host "✅ $hostname already exists in hosts file" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current entry:" -ForegroundColor Cyan
    $hostsContent | Select-String -Pattern $hostname
} else {
    # Create backup
    $backup = "$hostsPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $hostsPath $backup
    Write-Host "📦 Created backup: $backup" -ForegroundColor Yellow
    
    # Add entry
    Add-Content -Path $hostsPath -Value "`n# Hyperledger Fabric Orderer"
    Add-Content -Path $hostsPath -Value $entry
    
    Write-Host "✅ Added $hostname to hosts file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Testing DNS resolution..." -ForegroundColor Cyan
$result = Test-Connection -ComputerName $hostname -Count 1 -Quiet

if ($result) {
    Write-Host "✅ $hostname resolves correctly!" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: $hostname doesn't resolve" -ForegroundColor Yellow
    Write-Host "   You may need to flush DNS cache: ipconfig /flushdns" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================"
Write-Host "✅ Setup Complete!"
Write-Host "================================================"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open Git Bash" -ForegroundColor White
Write-Host "  2. cd /c/cbc" -ForegroundColor White
Write-Host "  3. ./start-system.sh --clean" -ForegroundColor White
Write-Host ""
