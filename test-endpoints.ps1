# Get auth token
Write-Host "Getting auth token..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"admin","password":"admin123"}'

$token = $loginResponse.token
Write-Host "Token received: $($token.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Test exporter dashboard
Write-Host "Testing /api/exporter/dashboard..." -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/exporter/dashboard" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Dashboard endpoint works" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Dashboard endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
Write-Host ""

# Test ECTA pending exporters
Write-Host "Testing /api/ecta/preregistration/exporters/pending..." -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ecta/preregistration/exporters/pending" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Pending exporters endpoint works" -ForegroundColor Green
    Write-Host "Count: $($response.Count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Pending exporters failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test contract drafts
Write-Host "Testing /api/contracts/drafts..." -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/contracts/drafts" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Contract drafts endpoint works" -ForegroundColor Green
    Write-Host "Count: $($response.Count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Contract drafts failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test document requests
Write-Host "Testing /api/document-requests..." -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/document-requests" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Document requests endpoint works" -ForegroundColor Green
    Write-Host "Count: $($response.Count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Document requests failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test exports
Write-Host "Testing /api/exports..." -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/exports" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Exports endpoint works" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Exports failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testing complete!" -ForegroundColor Cyan
