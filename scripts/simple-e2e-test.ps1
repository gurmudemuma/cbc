# Simple End-to-End Test - Following Manual Testing Steps
# This script tests the critical path: Registration -> Login -> Check Qualifications

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "Simple E2E Test - Critical Path" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$testUsername = "testexp$timestamp"
$testPassword = "Test123!"
$testEmail = "test$timestamp@example.com"

Write-Host "Test Account:" -ForegroundColor Yellow
Write-Host "  Username: $testUsername" -ForegroundColor Gray
Write-Host "  Password: $testPassword" -ForegroundColor Gray
Write-Host "  Email: $testEmail" -ForegroundColor Gray
Write-Host ""

# Step 1: Register
Write-Host "[1/5] Registering new exporter..." -ForegroundColor Yellow

$registerData = @{
    username = $testUsername
    email = $testEmail
    password = $testPassword
    companyName = "Test Coffee Exports Ltd"
    businessType = "PRIVATE_EXPORTER"
    tin = ($timestamp.ToString().Substring(3, 10))
    address = "Bole Road, Building 123"
    city = "Addis Ababa"
    region = "Addis Ababa"
    contactPerson = "John Doe"
    phone = "+251911234567"
    capitalETB = 15000000
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"
    
    Write-Host "  SUCCESS: Registration completed" -ForegroundColor Green
    Write-Host "  Message: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $_" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  Error: $($errorDetails.error)" -ForegroundColor Red
    if ($errorDetails.reason) {
        Write-Host "  Reason: $($errorDetails.reason)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Step 2: Login
Write-Host "[2/5] Logging in as exporter..." -ForegroundColor Yellow

$loginData = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "  SUCCESS: Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check Qualifications
Write-Host "[3/5] Checking auto-qualification status..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $qualifications = Invoke-RestMethod -Uri "$baseUrl/api/ecta/qualifications/status" `
        -Method Get `
        -Headers $headers
    
    Write-Host "  SUCCESS: Qualifications retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Qualification Status:" -ForegroundColor Cyan
    
    $stages = @("profile_certificate", "laboratory_certificate", "taster_certificate", "competence_certificate", "export_license")
    $allApproved = $true
    
    foreach ($stage in $stages) {
        $stageData = $qualifications | Where-Object { $_.stage -eq $stage }
        if ($stageData) {
            $status = $stageData.status
            $color = if ($status -eq "APPROVED") { "Green" } else { "Red" }
            Write-Host "    $stage : $status" -ForegroundColor $color
            if ($status -ne "APPROVED") {
                $allApproved = $false
            }
        } else {
            Write-Host "    $stage : NOT FOUND" -ForegroundColor Red
            $allApproved = $false
        }
    }
    
    Write-Host ""
    if ($allApproved) {
        Write-Host "  ALL STAGES APPROVED - Auto-qualification successful!" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Not all stages approved" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAILED: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Check Database
Write-Host "[4/5] Verifying database records..." -ForegroundColor Yellow

try {
    $dbCheck = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM users WHERE username = '$testUsername';"
    $userCount = [int]($dbCheck.Trim())
    
    if ($userCount -eq 1) {
        Write-Host "  SUCCESS: User record found in database" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: User record not found or duplicate" -ForegroundColor Yellow
    }
    
    $profileCheck = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM exporter_profiles WHERE user_id = '$testUsername';"
    $profileCount = [int]($profileCheck.Trim())
    
    if ($profileCount -eq 1) {
        Write-Host "  SUCCESS: Exporter profile found in database" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Exporter profile not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAILED: $_" -ForegroundColor Red
}

Write-Host ""

# Step 5: Frontend Access Test
Write-Host "[5/5] Testing frontend accessibility..." -ForegroundColor Yellow

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "  SUCCESS: Frontend accessible at http://localhost:5173" -ForegroundColor Green
    }
} catch {
    Write-Host "  FAILED: Frontend not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "2. Login with:" -ForegroundColor White
Write-Host "   Organization: Exporter Portal" -ForegroundColor Gray
Write-Host "   Username: $testUsername" -ForegroundColor Gray
Write-Host "   Password: $testPassword" -ForegroundColor Gray
Write-Host "3. Verify all 5 qualifications show APPROVED" -ForegroundColor White
Write-Host "4. Continue with sales contract creation" -ForegroundColor White
Write-Host ""
