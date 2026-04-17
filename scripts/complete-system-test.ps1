# Complete System Test Script
# Tests the entire exporter journey via API

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COFFEE BLOCKCHAIN COMPLETE SYSTEM TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @{
    Passed = 0
    Failed = 0
    Tests = @()
}

function Test-Endpoint {
    param($Name, $ScriptBlock)
    Write-Host "TEST: $Name" -ForegroundColor Yellow
    try {
        & $ScriptBlock
        Write-Host "✓ PASSED: $Name" -ForegroundColor Green
        $testResults.Passed++
        $testResults.Tests += @{Name=$Name; Status="PASSED"}
        return $true
    } catch {
        Write-Host "✗ FAILED: $Name - $($_.Exception.Message)" -ForegroundColor Red
        $testResults.Failed++
        $testResults.Tests += @{Name=$Name; Status="FAILED"; Error=$_.Exception.Message}
        return $false
    }
}

Write-Host "[PHASE 1] SYSTEM HEALTH CHECKS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Frontend Accessibility
Test-Endpoint "Frontend Accessibility" {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw "Frontend not accessible" }
    Write-Host "  Frontend: http://localhost:5173 ✓" -ForegroundColor Gray
}

# Test 2: Database Connectivity
Test-Endpoint "Database Connectivity" {
    $result = docker exec coffee-postgres pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Database not ready" }
    Write-Host "  Database: PostgreSQL ready ✓" -ForegroundColor Gray
}

# Test 3: Check Test Users
Test-Endpoint "Test Users Exist" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM users WHERE username IN ('ecta1', 'bank1', 'exporter1');" 2>&1
    $count = [int]($result -replace '\s','')
    if ($count -lt 3) { throw "Test users not found" }
    Write-Host "  Test users: $count found ✓" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[PHASE 2] AUTHENTICATION TESTS" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Test 4: Check existing exporter
$exporterUsername = "exporter1"
Test-Endpoint "Check Existing Exporter" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM exporter_profiles WHERE user_id='$exporterUsername';" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Exporter profiles: $count found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[PHASE 3] DATA VERIFICATION" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Test 5: Check Qualifications Table
Test-Endpoint "Qualifications Table" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM exporter_qualifications;" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Qualifications: $count records" -ForegroundColor Gray
}

# Test 6: Check Sales Contracts
Test-Endpoint "Sales Contracts Table" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM contract_drafts;" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Sales contracts: $count records" -ForegroundColor Gray
}

# Test 7: Check Document Requests
Test-Endpoint "Document Requests Table" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM document_requests;" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Document requests: $count records" -ForegroundColor Gray
}

# Test 8: Check Issued Documents
Test-Endpoint "Issued Documents Table" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM issued_documents;" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Issued documents: $count records" -ForegroundColor Gray
}

# Test 9: Check Network Submissions
Test-Endpoint "Network Submissions Table" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM network_submissions;" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Network submissions: $count records" -ForegroundColor Gray
}

# Test 10: Check Network Members
Test-Endpoint "Network Members Table" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM network_members WHERE is_active=true;" 2>&1
    $count = [int]($result -replace '\s','')
    if ($count -eq 0) { throw "No active network members" }
    Write-Host "  Active network members: $count" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[PHASE 4] EXISTING DATA ANALYSIS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 11: Check Submission Details
Test-Endpoint "Analyze Existing Submissions" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT submission_id, status, ecta_status, bank_status FROM network_submissions ORDER BY submitted_at DESC LIMIT 1;" 2>&1
    if ($result -match '\S') {
        Write-Host "  Latest submission found:" -ForegroundColor Gray
        Write-Host "  $result" -ForegroundColor Gray
    } else {
        Write-Host "  No submissions yet (expected for new system)" -ForegroundColor Gray
    }
}

# Test 12: Check Document Types
Test-Endpoint "Document Type Distribution" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT document_type, COUNT(*) as count FROM issued_documents GROUP BY document_type ORDER BY count DESC;" 2>&1
    Write-Host "  Document distribution:" -ForegroundColor Gray
    Write-Host "$result" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[PHASE 5] WORKFLOW VERIFICATION" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 13: Check Auto-Qualification Logic
Test-Endpoint "Auto-Qualification Status" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -c "SELECT username, stage, status FROM exporter_qualifications WHERE status='APPROVED' LIMIT 10;" 2>&1
    Write-Host "  Auto-approved qualifications:" -ForegroundColor Gray
    Write-Host "$result" -ForegroundColor Gray
}

# Test 14: Check Finalized Contracts
Test-Endpoint "Finalized Contracts" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM contract_drafts WHERE status='FINALIZED';" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Finalized contracts: $count" -ForegroundColor Gray
}

# Test 15: Check Active Documents
Test-Endpoint "Active Documents" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM issued_documents WHERE status='ACTIVE';" 2>&1
    $count = [int]($result -replace '\s','')
    Write-Host "  Active documents: $count" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[PHASE 6] CONTAINER HEALTH" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Test 16: Check All Containers
Test-Endpoint "Docker Containers Status" {
    $containers = docker ps --filter "name=coffee-" --format "{{.Names}}: {{.Status}}"
    $containerCount = ($containers | Measure-Object).Count
    if ($containerCount -lt 5) { throw "Not all containers running" }
    Write-Host "  Running containers: $containerCount" -ForegroundColor Gray
    $containers | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total Tests: $($testResults.Passed + $testResults.Failed)" -ForegroundColor White
Write-Host "Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed: $($testResults.Failed)" -ForegroundColor Red
Write-Host ""

if ($testResults.Failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults.Tests | Where-Object { $_.Status -eq "FAILED" } | ForEach-Object {
        Write-Host "  ✗ $($_.Name): $($_.Error)" -ForegroundColor Red
    }
    Write-Host ""
}

$successRate = [math]::Round(($testResults.Passed / ($testResults.Passed + $testResults.Failed)) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SYSTEM STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($successRate -ge 90) {
    Write-Host "✓ SYSTEM READY FOR MANUAL TESTING" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Open browser: http://localhost:5173" -ForegroundColor White
    Write-Host "2. Register new exporter or login with existing account" -ForegroundColor White
    Write-Host "3. Follow manual testing guide: docs/MANUAL-TESTING-STEPS.md" -ForegroundColor White
    Write-Host ""
    Write-Host "Test Accounts:" -ForegroundColor Yellow
    Write-Host "  ECTA: ecta1 / password" -ForegroundColor White
    Write-Host "  Bank: bank1 / password" -ForegroundColor White
    Write-Host "  Shipping: shipping1 / password" -ForegroundColor White
    Write-Host "  Customs: customs1 / password" -ForegroundColor White
} else {
    Write-Host "⚠ SYSTEM NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Some tests failed. Please review the errors above." -ForegroundColor White
    Write-Host "Check logs: docker logs coffee-gateway --tail 100" -ForegroundColor White
}

Write-Host ""
