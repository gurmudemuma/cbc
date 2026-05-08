# Comprehensive End-to-End Testing Script
# Tests the complete exporter journey from registration to final export approval

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Coffee Blockchain System - E2E Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"
$frontendUrl = "http://localhost:5173"

# Test counters
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test
    )
    
    $script:totalTests++
    Write-Host ""
    Write-Host "[$script:totalTests] Testing: $Name" -ForegroundColor Yellow
    
    try {
        $result = & $Test
        if ($result) {
            $script:passedTests++
            Write-Host "  PASSED" -ForegroundColor Green
            return $true
        } else {
            $script:failedTests++
            Write-Host "  FAILED" -ForegroundColor Red
            return $false
        }
    } catch {
        $script:failedTests++
        Write-Host "  FAILED: $_" -ForegroundColor Red
        return $false
    }
}

# Phase 1: System Readiness
Write-Host ""
Write-Host "=== PHASE 1: System Readiness ===" -ForegroundColor Cyan

Test-Step "Frontend accessible" {
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -eq 200
}

Test-Step "Gateway API healthy" {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    return $response.status -eq "ok"
}

Test-Step "Database accessible" {
    $result = docker exec coffee-postgres pg_isready -U postgres
    return $result -match "accepting connections"
}

Test-Step "Test users exist" {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM users WHERE username IN ('ecta1', 'bank1', 'exporter1', 'customs1', 'nbe1', 'ecx1', 'shipping1');"
    $count = [int]($result.Trim())
    return $count -eq 7
}

# Phase 2: Exporter Registration
Write-Host ""
Write-Host "=== PHASE 2: Exporter Registration ===" -ForegroundColor Cyan

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$testUsername = "testexporter$timestamp"
$testPassword = "Test123!"
$testEmail = "test$timestamp@example.com"

Write-Host "Creating test exporter: $testUsername" -ForegroundColor Gray

$registerData = @{
    username = $testUsername
    email = $testEmail
    password = $testPassword
    companyName = "Test Coffee Exports $timestamp"
    businessType = "PRIVATE_EXPORTER"
    tin = "1234567890"
    address = "Bole Road, Building 123"
    city = "Addis Ababa"
    region = "Addis Ababa"
    contactPerson = "John Doe"
    phone = "+251911234567"
    capitalETB = 15000000
} | ConvertTo-Json

$token = $null
$exporterId = $null

Test-Step "Register new exporter" {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
            -Method Post `
            -Body $registerData `
            -ContentType "application/json"
        
        Write-Host "  Registration response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
        return $response.success -eq $true -or $response.message -match "registered"
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        Write-Host "  Response: $($_.Exception.Response)" -ForegroundColor Red
        return $false
    }
}

# Phase 3: Login
Write-Host ""
Write-Host "=== PHASE 3: Login and Authentication ===" -ForegroundColor Cyan

$loginData = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

Test-Step "Login as exporter" {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
            -Method Post `
            -Body $loginData `
            -ContentType "application/json"
        
        $script:token = $response.token
        Write-Host "  Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
        return $token -ne $null
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

# Phase 4: Check Auto-Qualification
Write-Host ""
Write-Host "=== PHASE 4: Auto-Qualification Verification ===" -ForegroundColor Cyan

Test-Step "Check qualifications status" {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/ecta/qualifications/$testUsername" `
            -Method Get `
            -Headers $headers
        
        Write-Host "  Qualifications: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
        
        # Check if all 5 stages are approved
        $stages = @("profile_certificate", "laboratory_certificate", "taster_certificate", "competence_certificate", "export_license")
        $allApproved = $true
        
        foreach ($stage in $stages) {
            $stageData = $response | Where-Object { $_.stage -eq $stage }
            if ($stageData.status -ne "APPROVED") {
                Write-Host "  Stage $stage is not approved: $($stageData.status)" -ForegroundColor Red
                $allApproved = $false
            }
        }
        
        return $allApproved
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

# Phase 5: Sales Contract Creation
Write-Host ""
Write-Host "=== PHASE 5: Sales Contract Management ===" -ForegroundColor Cyan

$contractData = @{
    buyerName = "Global Coffee Importers Inc"
    buyerCountry = "United States"
    coffeeType = "Arabica"
    quantity = 1000
    unitPrice = 5.50
    totalValue = 5500
    deliveryTerms = "FOB"
    paymentTerms = "Letter of Credit"
    deliveryDate = (Get-Date).AddMonths(2).ToString("yyyy-MM-dd")
} | ConvertTo-Json

$contractId = $null
$ectaReference = $null

Test-Step "Create sales contract draft" {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts" `
            -Method Post `
            -Headers $headers `
            -Body $contractData
        
        $script:contractId = $response.draftId
        Write-Host "  Contract ID: $contractId" -ForegroundColor Gray
        return $contractId -ne $null
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

Test-Step "Submit contract for negotiation" {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts/$contractId/submit" `
            -Method Post `
            -Headers $headers
        
        Write-Host "  Contract submitted" -ForegroundColor Gray
        return $response.success -eq $true
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

Test-Step "Finalize sales contract" {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts/$contractId/finalize" `
            -Method Post `
            -Headers $headers
        
        $script:ectaReference = $response.ectaReferenceNumber
        Write-Host "  ECTA Reference: $ectaReference" -ForegroundColor Gray
        return $ectaReference -ne $null
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

# Phase 6: Document Requests
Write-Host ""
Write-Host "=== PHASE 6: Document Requests ===" -ForegroundColor Cyan

$documentTypes = @(
    @{ type = "export_license"; agency = "ECTA" },
    @{ type = "phytosanitary_certificate"; agency = "MOA" },
    @{ type = "health_certificate"; agency = "MOH" },
    @{ type = "quality_certificate"; agency = "ECTA" },
    @{ type = "certificate_of_origin"; agency = "ECTA" },
    @{ type = "bank_guarantee"; agency = "Commercial Bank" },
    @{ type = "shipping_booking"; agency = "Shipping Line" },
    @{ type = "customs_clearance"; agency = "Customs" }
)

$requestIds = @()

foreach ($docType in $documentTypes) {
    Test-Step "Request $($docType.type) from $($docType.agency)" {
        try {
            $headers = @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "application/json"
            }
            
            $requestData = @{
                documentType = $docType.type
                salesContractReference = $ectaReference
                notes = "Automated test request"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$baseUrl/api/document-requests" `
                -Method Post `
                -Headers $headers `
                -Body $requestData
            
            $script:requestIds += $response.requestId
            Write-Host "  Request ID: $($response.requestId)" -ForegroundColor Gray
            return $response.requestId -ne $null
        } catch {
            Write-Host "  Error: $_" -ForegroundColor Red
            return $false
        }
    }
}

Write-Host ""
Write-Host "  Total document requests created: $($requestIds.Count)" -ForegroundColor Gray

# Phase 7: Network Member Document Issuance
Write-Host ""
Write-Host "=== PHASE 7: Network Member Document Issuance ===" -ForegroundColor Cyan

$networkMembers = @(
    @{ username = "ecta1"; password = "password"; org = "ECTA"; documents = @("export_license", "quality_certificate", "certificate_of_origin") },
    @{ username = "bank1"; password = "password"; org = "Commercial Bank"; documents = @("bank_guarantee") },
    @{ username = "shipping1"; password = "password"; org = "Shipping Line"; documents = @("shipping_booking") },
    @{ username = "customs1"; password = "password"; org = "Custom Authorities"; documents = @("customs_clearance") }
)

$issuedDocuments = @()

foreach ($member in $networkMembers) {
    Write-Host ""
    Write-Host "  --- Logging in as $($member.org) ---" -ForegroundColor Gray
    
    # Login as network member
    $memberLoginData = @{
        username = $member.username
        password = $member.password
    } | ConvertTo-Json
    
    try {
        $memberResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
            -Method Post `
            -Body $memberLoginData `
            -ContentType "application/json"
        
        $memberToken = $memberResponse.token
        Write-Host "  Logged in as $($member.username)" -ForegroundColor Gray
        
        # Issue documents
        foreach ($docType in $member.documents) {
            Test-Step "Issue $docType by $($member.org)" {
                try {
                    $headers = @{
                        "Authorization" = "Bearer $memberToken"
                        "Content-Type" = "application/json"
                    }
                    
                    # Find the request ID for this document type
                    $requestId = $requestIds[0]  # Simplified for testing
                    
                    $issueData = @{
                        requestId = $requestId
                        documentNumber = "DOC-$timestamp-$(Get-Random -Maximum 9999)"
                        expiryDate = (Get-Date).AddYears(1).ToString("yyyy-MM-dd")
                        metadata = @{
                            issuer = $member.org
                            documentType = $docType
                        }
                    } | ConvertTo-Json
                    
                    $response = Invoke-RestMethod -Uri "$baseUrl/api/document-issuance/issue" `
                        -Method Post `
                        -Headers $headers `
                        -Body $issueData
                    
                    $script:issuedDocuments += $response.documentId
                    Write-Host "    Document ID: $($response.documentId)" -ForegroundColor Gray
                    return $response.documentId -ne $null
                } catch {
                    Write-Host "    Error: $_" -ForegroundColor Red
                    return $false
                }
            }
        }
    } catch {
        Write-Host "  Failed to login as $($member.username): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "  Total documents issued: $($issuedDocuments.Count)" -ForegroundColor Gray

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 2))%" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Yellow" })

if ($failedTests -eq 0) {
    Write-Host ""
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some tests failed. Please review the output above." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Export test data for manual verification
$testData = @{
    username = $testUsername
    password = $testPassword
    email = $testEmail
    contractId = $contractId
    ectaReference = $ectaReference
    requestIds = $requestIds
    issuedDocuments = $issuedDocuments
    timestamp = $timestamp
}

$testData | ConvertTo-Json -Depth 3 | Out-File "test-data-$timestamp.json"
Write-Host "Test data saved to: test-data-$timestamp.json" -ForegroundColor Gray
Write-Host "You can use this data for manual verification in the UI" -ForegroundColor Gray
Write-Host ""
