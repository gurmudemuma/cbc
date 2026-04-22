# Test with exporter1 credentials
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing with Exporter User" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get auth token for exporter1
Write-Host "Logging in as exporter1..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"exporter1","password":"password123"}'

$token = $loginResponse.token
Write-Host "[PASS] Login successful" -ForegroundColor Green
Write-Host "User: $($loginResponse.user.username) | Role: $($loginResponse.user.role)" -ForegroundColor Gray
Write-Host ""

# Test exporter dashboard
Write-Host "Testing /api/exporter/dashboard..." -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/exporter/dashboard" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Dashboard endpoint works" -ForegroundColor Green
    Write-Host "Exporter: $($response.identity.businessName)" -ForegroundColor Gray
    Write-Host "Status: $($response.compliance.profileStatus)" -ForegroundColor Gray
    Write-Host "Qualified: $($response.compliance.isFullyQualified)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Dashboard endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test qualification status
Write-Host "Testing /api/exporter/qualification-status..." -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/exporter/qualification-status" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Qualification status endpoint works" -ForegroundColor Green
    Write-Host "Overall Status: $($response.overallStatus)" -ForegroundColor Gray
    Write-Host "Profile Complete: $($response.profile.complete)" -ForegroundColor Gray
    Write-Host "Laboratory Certified: $($response.laboratory.certified)" -ForegroundColor Gray
    Write-Host "Taster Verified: $($response.taster.verified)" -ForegroundColor Gray
    Write-Host "Competence Valid: $($response.competenceCertificate.valid)" -ForegroundColor Gray
    Write-Host "License Valid: $($response.exportLicense.valid)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Qualification status failed: $($_.Exception.Message)" -ForegroundColor Red
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
    Write-Host "Drafts Count: $($response.drafts.Count)" -ForegroundColor Gray
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
    Write-Host "Requests Count: $($response.Count)" -ForegroundColor Gray
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
    Write-Host "Exports Count: $($response.count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Exports failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
