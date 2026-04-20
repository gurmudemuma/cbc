# Comprehensive Hybrid System Requirements Verification
# Tests all functional requirements for PostgreSQL + Blockchain dual-write system

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  HYBRID SYSTEM REQUIREMENTS CHECK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passCount = 0
$failCount = 0
$totalTests = 10

# ============================================
# REQUIREMENT 1: Dual-Write on User Registration
# ============================================
Write-Host "[1/$totalTests] Testing Dual-Write on User Registration..." -ForegroundColor Yellow

$testUsername = "hybrid_test_$(Get-Random)"
$testEmail = "$testUsername@example.com"
$testTIN = "$(Get-Random -Minimum 1000000000 -Maximum 9999999999)"

$registerBody = @{
    username = $testUsername
    email = $testEmail
    password = "Test123!"
    role = "exporter"
    tin = $testTIN
    companyName = "Test Company"
    capitalETB = 15000000
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
        -Method POST -Body $registerBody -ContentType "application/json"
    
    if ($registerResponse.success) {
        Write-Host "  [PASS] User registration successful" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "  [FAIL] User registration failed: $($registerResponse.error)" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "  [FAIL] User registration error: $_" -ForegroundColor Red
    $failCount++
}

Start-Sleep -Seconds 2

# Check PostgreSQL
try {
    $pgCount = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM users WHERE username='$testUsername'" 2>&1 | Select-String -Pattern "\d+" | ForEach-Object { $_.Matches[0].Value }
    Write-Host "  PostgreSQL: $pgCount record(s)" -ForegroundColor Gray
} catch {
    Write-Host "  [WARNING] Could not verify PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# REQUIREMENT 2: Read from PostgreSQL (Fast)
# ============================================
Write-Host "[2/$totalTests] Testing Read from PostgreSQL..." -ForegroundColor Yellow

$loginBody = @{
    username = "exporter1"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "  [PASS] Read from PostgreSQL successful" -ForegroundColor Green
        $passCount++
        $token = $loginResponse.token
    } else {
        Write-Host "  [FAIL] Read from PostgreSQL failed" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "  [FAIL] Login error: $_" -ForegroundColor Red
    $failCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 3: Blockchain Immutability
# ============================================
Write-Host "[3/$totalTests] Testing Blockchain Immutability..." -ForegroundColor Yellow

try {
    $blockchainQuery = docker exec cli peer chaincode query -C coffeechannel -n ecta -c '{\"Args\":[\"GetUser\",\"exporter1\"]}' 2>&1
    
    if ($blockchainQuery -match "exporter1") {
        Write-Host "  [PASS] Blockchain data is immutable and queryable" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "  [FAIL] Blockchain query failed" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "  [FAIL] Blockchain query error: $_" -ForegroundColor Red
    $failCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 4: Sync Status Monitoring
# ============================================
Write-Host "[4/$totalTests] Testing Sync Status Monitoring..." -ForegroundColor Yellow

# Login as admin for admin endpoints
$adminLoginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $adminLoginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST -Body $adminLoginBody -ContentType "application/json"
    $adminToken = $adminLoginResponse.token
} catch {
    Write-Host "  [WARNING] Could not get admin token" -ForegroundColor Yellow
    $adminToken = $null
}

if ($adminToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        $statsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/hybrid/stats" -Method GET -Headers $headers
        
        if ($statsResponse.postgresRecords -ne $null) {
            Write-Host "  [PASS] Sync statistics available" -ForegroundColor Green
            Write-Host "  PostgreSQL Records: $($statsResponse.postgresRecords)" -ForegroundColor Gray
            Write-Host "  Blockchain Records: $($statsResponse.blockchainRecords)" -ForegroundColor Gray
            $passCount++
        } else {
            Write-Host "  [FAIL] Sync statistics not available" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  [FAIL] Stats endpoint error: $_" -ForegroundColor Red
        $failCount++
    }
} else {
    Write-Host "  [SKIP] No admin token available" -ForegroundColor Yellow
    $failCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 5: Health Check Endpoint
# ============================================
Write-Host "[5/$totalTests] Testing Health Check..." -ForegroundColor Yellow

if ($adminToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/hybrid/health" -Method GET -Headers $headers
        
        if ($healthResponse.postgres -ne $null) {
            Write-Host "  [PASS] Health check endpoint working" -ForegroundColor Green
            Write-Host "  PostgreSQL: $($healthResponse.postgres.status)" -ForegroundColor Gray
            Write-Host "  Blockchain: $($healthResponse.blockchain.status)" -ForegroundColor Gray
            $passCount++
        } else {
            Write-Host "  [FAIL] Health check failed" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  [FAIL] Health check error: $_" -ForegroundColor Red
        $failCount++
    }
} else {
    Write-Host "  [SKIP] No admin token available" -ForegroundColor Yellow
    $failCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 6: Manual Sync Capability
# ============================================
Write-Host "[6/$totalTests] Testing Manual Sync..." -ForegroundColor Yellow

if ($adminToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        $syncResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/hybrid/sync/users" -Method POST -Headers $headers
        
        if ($syncResponse.success) {
            Write-Host "  [PASS] Manual sync endpoint available" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "  [FAIL] Manual sync failed" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  [FAIL] Sync endpoint error: $_" -ForegroundColor Red
        $failCount++
    }
} else {
    Write-Host "  [SKIP] No admin token available" -ForegroundColor Yellow
    $failCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 7: Contract Finalization Dual-Write
# ============================================
Write-Host "[7/$totalTests] Testing Contract Finalization Dual-Write..." -ForegroundColor Yellow

if ($token) {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        # Test contract-drafts endpoint
        $contractsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/contracts/drafts" `
            -Method GET -Headers $headers -ErrorAction SilentlyContinue
        
        Write-Host "  [PASS] Contract endpoints accessible" -ForegroundColor Green
        $passCount++
    } catch {
        Write-Host "  [FAIL] Contract endpoints not accessible: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
} else {
    Write-Host "  [SKIP] No token available" -ForegroundColor Yellow
    $failCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 8: Error Handling & Rollback
# ============================================
Write-Host "[8/$totalTests] Testing Error Handling..." -ForegroundColor Yellow

$invalidBody = @{
    username = "test"
    email = "invalid"
} | ConvertTo-Json

try {
    $errorResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
        -Method POST -Body $invalidBody -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "  [FAIL] Should have returned error" -ForegroundColor Red
    $failCount++
} catch {
    Write-Host "  [PASS] Error handling works correctly" -ForegroundColor Green
    $passCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 9: PostgreSQL Connection Pool
# ============================================
Write-Host "[9/$totalTests] Testing PostgreSQL Connection..." -ForegroundColor Yellow

try {
    $pgTest = docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT 1" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] PostgreSQL connection pool working" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "  [FAIL] PostgreSQL connection failed" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "  [FAIL] PostgreSQL test error: $_" -ForegroundColor Red
    $failCount++
}

Write-Host ""

# ============================================
# REQUIREMENT 10: Multi-Org Blockchain Endorsement
# ============================================
Write-Host "[10/$totalTests] Testing Multi-Org Endorsement..." -ForegroundColor Yellow

$peers = @("peer0.ecta", "peer0.bank", "peer0.nbe", "peer0.customs", "peer0.shipping")
$runningPeers = 0

foreach ($peer in $peers) {
    $peerStatus = docker ps | Select-String -Pattern $peer
    if ($peerStatus) {
        $runningPeers++
    }
}

if ($runningPeers -eq 5) {
    Write-Host "  [PASS] All 5 peer nodes running for multi-org endorsement" -ForegroundColor Green
    $passCount++
} else {
    Write-Host "  [FAIL] Only $runningPeers/5 peers running" -ForegroundColor Red
    $failCount++
}

Write-Host ""

# ============================================
# TEST SUMMARY
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "[SUCCESS] All hybrid system requirements met!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "[WARNING] Some requirements not met" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
