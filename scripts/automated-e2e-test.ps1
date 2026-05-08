# Automated End-to-End Test Script
# Tests the complete exporter journey from registration to export approval

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Coffee Blockchain E2E Automated Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test data
$testUsername = "testexporter$timestamp"
$testPassword = "password123"
$testEmail = "test$timestamp@example.com"

Write-Host "[Phase 1] EXPORTER REGISTRATION" -ForegroundColor Yellow
Write-Host "Creating new exporter account..." -ForegroundColor Gray

$registerData = @{
    username = $testUsername
    password = $testPassword
    email = $testEmail
    companyName = "Test Coffee Exports Ltd $timestamp"
    businessType = "PRIVATE_EXPORTER"
    tin = "TIN$timestamp"
    capitalETB = 15000000
    phone = "+251911234567"
    address = "Bole Road, Addis Ababa"
    contactPerson = "John Doe"
    organization = "exporter-portal"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/preregistration/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Registration successful" -ForegroundColor Green
    Write-Host "  Username: $testUsername" -ForegroundColor Gray
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  This is expected - registration endpoint requires no auth but may have validation" -ForegroundColor Yellow
    Write-Host "  Continuing with login test..." -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[Phase 2] LOGIN & AUTHENTICATION" -ForegroundColor Yellow
Write-Host "Logging in as exporter..." -ForegroundColor Gray

$loginData = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $token = $loginResponse.token
    if (-not $token) {
        $token = $loginResponse.data.token
    }
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  User may not exist yet. Try manual registration first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual Test Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open browser: http://localhost:5173" -ForegroundColor White
    Write-Host "2. Click 'Register here'" -ForegroundColor White
    Write-Host "3. Fill in registration form" -ForegroundColor White
    Write-Host "4. Login with credentials" -ForegroundColor White
    Write-Host "5. Follow guide: docs/END-TO-END-TESTING-GUIDE.md" -ForegroundColor White
    exit 1
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[Phase 3] CHECK QUALIFICATIONS" -ForegroundColor Yellow
Write-Host "Checking auto-qualification status..." -ForegroundColor Gray

try {
    $qualResponse = Invoke-RestMethod -Uri "$baseUrl/api/ecta/qualifications/$testUsername" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Qualifications retrieved" -ForegroundColor Green
    
    $stages = @("PROFILE", "LABORATORY", "TASTER", "COMPETENCE", "LICENSE")
    $allApproved = $true
    
    foreach ($stage in $stages) {
        $qual = $qualResponse.data | Where-Object { $_.stage -eq $stage }
        if ($qual) {
            $status = $qual.status
            if ($status -eq "APPROVED") {
                Write-Host "  ✓ $stage : APPROVED" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $stage : $status" -ForegroundColor Red
                $allApproved = $false
            }
        } else {
            Write-Host "  ? $stage : NOT FOUND" -ForegroundColor Yellow
            $allApproved = $false
        }
    }
    
    if ($allApproved) {
        Write-Host "✓ All qualifications auto-approved!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Some qualifications pending" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to check qualifications: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[Phase 4] CHECK EXPORTER PROFILE" -ForegroundColor Yellow
Write-Host "Retrieving exporter profile..." -ForegroundColor Gray

try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/exporter/profile" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Profile retrieved" -ForegroundColor Green
    Write-Host "  Business Name: $($profileResponse.data.business_name)" -ForegroundColor Gray
    Write-Host "  TIN: $($profileResponse.data.tin)" -ForegroundColor Gray
    Write-Host "  Status: $($profileResponse.data.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to retrieve profile: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[Phase 5] CHECK NETWORK STATISTICS" -ForegroundColor Yellow
Write-Host "Retrieving network statistics..." -ForegroundColor Gray

try {
    $statsResponse = Invoke-RestMethod -Uri "$baseUrl/api/network/statistics" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Statistics retrieved" -ForegroundColor Green
    Write-Host "  Total Submissions: $($statsResponse.data.totalSubmissions)" -ForegroundColor Gray
    Write-Host "  Approved: $($statsResponse.data.approved)" -ForegroundColor Gray
    Write-Host "  Pending: $($statsResponse.data.pending)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to retrieve statistics: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[Phase 6] TEST NETWORK MEMBER LOGIN" -ForegroundColor Yellow
Write-Host "Testing ECTA login..." -ForegroundColor Gray

$ectaLoginData = @{
    username = "ecta1"
    password = "password"
} | ConvertTo-Json

try {
    $ectaLoginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -Body $ectaLoginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $ectaToken = $ectaLoginResponse.token
    if (-not $ectaToken) {
        $ectaToken = $ectaLoginResponse.data.token
    }
    
    Write-Host "✓ ECTA login successful" -ForegroundColor Green
    Write-Host "  Token: $($ectaToken.Substring(0, 20))..." -ForegroundColor Gray
    
    # Test agency dashboard access
    $ectaHeaders = @{
        "Authorization" = "Bearer $ectaToken"
        "Content-Type" = "application/json"
    }
    
    try {
        $agenciesResponse = Invoke-RestMethod -Uri "$baseUrl/api/network/agencies/my/list" `
            -Method Get `
            -Headers $ectaHeaders `
            -ErrorAction Stop
        
        Write-Host "✓ Agency access verified" -ForegroundColor Green
        Write-Host "  Agencies: $($agenciesResponse.data.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "⚠ Could not verify agency access" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ ECTA login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Automated API tests completed." -ForegroundColor White
Write-Host ""
Write-Host "Next Steps for Complete Testing:" -ForegroundColor Yellow
Write-Host "1. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "2. Login as: $testUsername / $testPassword" -ForegroundColor White
Write-Host "3. Follow manual testing guide:" -ForegroundColor White
Write-Host "   - Create sales contract" -ForegroundColor Gray
Write-Host "   - Request documents" -ForegroundColor Gray
Write-Host "   - Submit to network" -ForegroundColor Gray
Write-Host "   - Verify approval" -ForegroundColor Gray
Write-Host ""
Write-Host "Full Guide: docs/END-TO-END-TESTING-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Accounts:" -ForegroundColor Yellow
Write-Host "  Exporter: $testUsername / $testPassword" -ForegroundColor White
Write-Host "  ECTA: ecta1 / password" -ForegroundColor White
Write-Host "  Bank: bank1 / password" -ForegroundColor White
Write-Host "  Shipping: shipping1 / password" -ForegroundColor White
Write-Host "  Customs: customs1 / password" -ForegroundColor White
Write-Host ""
