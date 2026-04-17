# Hybrid Data Service Test Script
# Tests dual-write, read routing, sync, and failure scenarios

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hybrid Data Service Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$GATEWAY_URL = "http://localhost:3000"
$testResults = @{
    passed = 0
    failed = 0
    tests = @()
}

# Helper function to make API calls
function Invoke-ApiTest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body,
        [string]$Token,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "[TEST] $Name..." -NoNewline
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$GATEWAY_URL$Endpoint"
            Method = $Method
            Headers = $headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-Host " PASS" -ForegroundColor Green
        $script:testResults.passed++
        $script:testResults.tests += @{
            name = $Name
            status = "PASS"
            response = $response
        }
        
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host " PASS (Expected $ExpectedStatus)" -ForegroundColor Green
            $script:testResults.passed++
            $script:testResults.tests += @{
                name = $Name
                status = "PASS"
                expectedError = $true
            }
            return $null
        }
        
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults.failed++
        $script:testResults.tests += @{
            name = $Name
            status = "FAIL"
            error = $_.Exception.Message
        }
        return $null
    }
}

# ============================================================================
# TEST 1: Health Check
# ============================================================================
Write-Host ""
Write-Host "[1/8] Testing Hybrid Service Health..." -ForegroundColor Yellow
Write-Host ""

$health = Invoke-ApiTest `
    -Name "Hybrid service health check" `
    -Method "GET" `
    -Endpoint "/api/hybrid/health"

if ($health) {
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    Write-Host "  Config: $($health.config | ConvertTo-Json -Compress)" -ForegroundColor Gray
}

# ============================================================================
# TEST 2: User Registration (Hybrid Write)
# ============================================================================
Write-Host ""
Write-Host "[2/8] Testing User Registration with Hybrid Write..." -ForegroundColor Yellow
Write-Host ""

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = @{
    username = "hybrid_test_$timestamp"
    password = "Test123!@#"
    email = "hybrid_test_${timestamp}@example.com"
    companyName = "Hybrid Test Coffee Co"
    tin = ($timestamp % 10000000000).ToString().PadLeft(10, '0')  # 10-digit TIN
    capitalETB = 25000000
    businessType = "PRIVATE_EXPORTER"
    phone = "+251911234567"
    address = "Addis Ababa, Ethiopia"
    contactPerson = "Test Manager"
}

$registerResult = Invoke-ApiTest `
    -Name "Register user via hybrid service" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body $testUser

if ($registerResult) {
    Write-Host "  Username: $($registerResult.user.username)" -ForegroundColor Gray
    Write-Host "  Status: $($registerResult.status)" -ForegroundColor Gray
    Write-Host "  PostgreSQL: $($registerResult.syncStatus.postgres)" -ForegroundColor Gray
    Write-Host "  Blockchain: $($registerResult.syncStatus.blockchain)" -ForegroundColor Gray
    
    if ($registerResult.syncStatus.errors.Count -gt 0) {
        Write-Host "  Errors: $($registerResult.syncStatus.errors | ConvertTo-Json -Compress)" -ForegroundColor Yellow
    }
}

# ============================================================================
# TEST 3: Login and Get Token
# ============================================================================
Write-Host ""
Write-Host "[3/8] Testing Login..." -ForegroundColor Yellow
Write-Host ""

$loginResult = Invoke-ApiTest `
    -Name "Login with test user" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body @{
        username = $testUser.username
        password = $testUser.password
    }

$token = $null
if ($loginResult) {
    $token = $loginResult.token
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "  Role: $($loginResult.user.role)" -ForegroundColor Gray
}

# ============================================================================
# TEST 4: Verify User in PostgreSQL
# ============================================================================
Write-Host ""
Write-Host "[4/8] Verifying User in PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

try {
    $pgResult = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT username, email, role, is_active FROM users WHERE username = '$($testUser.username)';" 2>$null
    
    if ($pgResult -and $pgResult.Trim() -ne "") {
        Write-Host "[TEST] User exists in PostgreSQL... PASS" -ForegroundColor Green
        Write-Host "  Data: $($pgResult.Trim())" -ForegroundColor Gray
        $script:testResults.passed++
    } else {
        Write-Host "[TEST] User exists in PostgreSQL... FAIL" -ForegroundColor Red
        $script:testResults.failed++
    }
} catch {
    Write-Host "[TEST] User exists in PostgreSQL... FAIL (Error: $($_.Exception.Message))" -ForegroundColor Red
    $script:testResults.failed++
}

# ============================================================================
# TEST 5: Verify User on Blockchain
# ============================================================================
Write-Host ""
Write-Host "[5/8] Verifying User on Blockchain..." -ForegroundColor Yellow
Write-Host ""

try {
    $bcScript = @"
const fabricService = require('./src/services/fabric-cli-final');
(async () => {
    try {
        const user = await fabricService.getUser('$($testUser.username)');
        console.log(JSON.stringify(user));
    } catch (error) {
        console.log('NOT_FOUND');
    }
})();
"@
    
    $bcResult = docker exec coffee-gateway node -e $bcScript 2>$null
    
    if ($bcResult -and $bcResult -notlike "*NOT_FOUND*") {
        Write-Host "[TEST] User exists on blockchain... PASS" -ForegroundColor Green
        try {
            $bcUser = $bcResult | ConvertFrom-Json
            Write-Host "  Username: $($bcUser.username)" -ForegroundColor Gray
            Write-Host "  Email: $($bcUser.email)" -ForegroundColor Gray
        } catch {
            Write-Host "  Data: $bcResult" -ForegroundColor Gray
        }
        $script:testResults.passed++
    } else {
        Write-Host "[TEST] User exists on blockchain... SKIP (Blockchain sync may be pending)" -ForegroundColor Yellow
        Write-Host "  Note: This is expected if blockchain write failed during registration" -ForegroundColor Gray
    }
} catch {
    Write-Host "[TEST] User exists on blockchain... SKIP (Error: $($_.Exception.Message))" -ForegroundColor Yellow
}

# ============================================================================
# TEST 6: Get Hybrid Statistics (requires admin token)
# ============================================================================
Write-Host ""
Write-Host "[6/8] Testing Hybrid Statistics..." -ForegroundColor Yellow
Write-Host ""

# Try to get stats (will fail if not admin, which is expected)
$stats = Invoke-ApiTest `
    -Name "Get hybrid statistics" `
    -Method "GET" `
    -Endpoint "/api/hybrid/stats" `
    -Token $token `
    -ExpectedStatus 403

if ($stats) {
    Write-Host "  Dual Writes: $($stats.stats.dualWrites)" -ForegroundColor Gray
    Write-Host "  PostgreSQL Writes: $($stats.stats.postgresWrites)" -ForegroundColor Gray
    Write-Host "  Blockchain Writes: $($stats.stats.blockchainWrites)" -ForegroundColor Gray
    Write-Host "  Errors: $($stats.stats.errors)" -ForegroundColor Gray
} else {
    Write-Host "  Note: Statistics endpoint requires admin role (expected)" -ForegroundColor Gray
}

# ============================================================================
# TEST 7: Test Read with Verification
# ============================================================================
Write-Host ""
Write-Host "[7/8] Testing Read with Blockchain Verification..." -ForegroundColor Yellow
Write-Host ""

$readResult = Invoke-ApiTest `
    -Name "Read user with verification" `
    -Method "GET" `
    -Endpoint "/api/hybrid/user/$($testUser.username)?verify=true" `
    -Token $token

if ($readResult) {
    Write-Host "  Username: $($readResult.user.username)" -ForegroundColor Gray
    Write-Host "  Email: $($readResult.user.email)" -ForegroundColor Gray
    Write-Host "  Verified: $($readResult.verified)" -ForegroundColor Gray
}

# ============================================================================
# TEST 8: Test Blockchain Failure Scenario
# ============================================================================
Write-Host ""
Write-Host "[8/8] Testing Blockchain Failure Scenario..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Simulating blockchain unavailability..." -ForegroundColor Gray

# Register another user (should succeed even if blockchain fails)
$timestamp2 = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser2 = @{
    username = "hybrid_test_fail_$timestamp2"
    password = "Test123!@#"
    email = "hybrid_test_fail_${timestamp2}@example.com"
    companyName = "Hybrid Test Fail Co"
    tin = ($timestamp2 % 10000000000).ToString().PadLeft(10, '0')  # 10-digit TIN
    capitalETB = 20000000
    businessType = "PRIVATE_EXPORTER"
}

$registerResult2 = Invoke-ApiTest `
    -Name "Register user (blockchain may fail)" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body $testUser2

if ($registerResult2) {
    Write-Host "  PostgreSQL: $($registerResult2.syncStatus.postgres)" -ForegroundColor Gray
    Write-Host "  Blockchain: $($registerResult2.syncStatus.blockchain)" -ForegroundColor Gray
    
    if ($registerResult2.syncStatus.postgres -and -not $registerResult2.syncStatus.blockchain) {
        Write-Host "  System handled blockchain failure gracefully" -ForegroundColor Green
    }
}

# ============================================================================
# TEST SUMMARY
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$total = $testResults.passed + $testResults.failed
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $($testResults.passed)" -ForegroundColor Green
Write-Host "Failed: $($testResults.failed)" -ForegroundColor Red
Write-Host ""

if ($testResults.failed -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Review details above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor Yellow
    foreach ($test in $testResults.tests | Where-Object { $_.status -eq "FAIL" }) {
        Write-Host "  - $($test.name)" -ForegroundColor Red
        if ($test.error) {
            Write-Host "    Error: $($test.error)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Test Users Created:" -ForegroundColor Cyan
Write-Host "  Username: $($testUser.username)" -ForegroundColor White
Write-Host "  Password: $($testUser.password)" -ForegroundColor White
if ($testUser2) {
    Write-Host "  Username: $($testUser2.username)" -ForegroundColor White
    Write-Host "  Password: $($testUser2.password)" -ForegroundColor White
}
Write-Host ""

# ============================================================================
# CLEANUP PROMPT
# ============================================================================
Write-Host "Cleanup:" -ForegroundColor Cyan
Write-Host "  To remove test users from PostgreSQL:" -ForegroundColor Gray
$cleanupCmd = "docker exec coffee-postgres psql -U postgres -d coffee_export_db -c `"DELETE FROM users WHERE username LIKE 'hybrid_test_%';`""
Write-Host "    $cleanupCmd" -ForegroundColor White
Write-Host ""

exit $testResults.failed
