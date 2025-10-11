# Windows Hosts File Fix for Blockchain Network
# Run as Administrator: Right-click PowerShell -> Run as Administrator
# Then: .\fix-hosts-windows.ps1

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"

# Hosts entries needed for the blockchain network
$entries = @(
    "127.0.0.1 orderer.coffee-export.com",
    "127.0.0.1 peer0.exporterbank.coffee-export.com",
    "127.0.0.1 peer0.nationalbank.coffee-export.com",
    "127.0.0.1 peer0.ncat.coffee-export.com",
    "127.0.0.1 peer0.shippingline.coffee-export.com"
)

Write-Host "Adding blockchain hostnames to hosts file..." -ForegroundColor Cyan

$currentHosts = Get-Content $hostsFile

foreach ($entry in $entries) {
    if ($currentHosts -notcontains $entry) {
        Write-Host "Adding: $entry" -ForegroundColor Green
        Add-Content -Path $hostsFile -Value $entry
    } else {
        Write-Host "Already exists: $entry" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Hosts file updated successfully!" -ForegroundColor Green
Write-Host "`nYou can now run: cd network && ./network.sh createChannel" -ForegroundColor Cyan
