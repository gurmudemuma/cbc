# Phase 4: Network Submission Test
# Tests the complete network submission workflow

$ErrorActionPreference = "Continue"

# Load contract info
$contractInfoPath = Join-Path $PSScriptRoot "contract-info.json"
if (-not (Test-Path $contractInfoPath)) {
    Write-Host "ERROR: Contract info not found. Run test-sales-contract.ps1 first." -ForegroundColor Red
    exit 1
}

$contractInfo = Get-Content $contractInfoPath | ConvertFrom-Json
$username = $contractInfo.username
$token = $contractInfo.token
$ectaReference = $contractInfo.ectaReference

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Network Submission Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Using Contract:" -ForegroundColor Yellow
Write-Host "  ECTA Reference: $ectaReference" -ForegroundColor White
Write-Host "  Username: $username" -ForegroundColor White
Write-Host ""

$baseUrl = "http://localhost:3000"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 1: Get all issued documents
Write-Host "[1/4] Retrieving issued documents..." -ForegroundColor Yellow

try {
    $docsResponse = Invoke-RestMethod -Uri "$baseUrl/api/exporter/documents/requests" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($docsResponse.success) {
        $issuedDocs = $docsResponse.data | Where-Object { $_.status -eq 'ISSUED' }
        Write-Host "  SUCCESS: Found $($issuedDocs.Count) issued documents" -ForegroundColor Green
        
        # Get document IDs
        $documentIds = @()
        foreach ($doc in $issuedDocs) {
            if ($doc.issuedDocument -and $doc.issuedDocument.documentId) {
                $documentIds += $doc.issuedDocument.documentId
            }
        }
        
        Write-Host "  Document IDs collected: $($documentIds.Count)" -ForegroundColor Gray
        
        # Check if we have all 8 required documents
        $requiredTypes = @(
            'EXPORT_LICENSE',
            'PHYTOSANITARY_CERTIFICATE',
            'HEALTH_CERTIFICATE',
            'QUALITY_CERTIFICATE',
            'CERTIFICATE_OF_ORIGIN',
            'BANK_GUARANTEE',
            'SHIPPING_BOOKING',
            'CUSTOMS_CLEARANCE'
        )
        
        $issuedTypes = $issuedDocs | ForEach-Object { $_.documentType }
        $missingTypes = $requiredTypes | Where-Object { $issuedTypes -notcontains $_ }
        
        if ($missingTypes.Count -gt 0) {
            Write-Host "  WARNING: Missing required documents:" -ForegroundColor Yellow
            foreach ($type in $missingTypes) {
                Write-Host "    - $type" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ✓ All 8 required documents present" -ForegroundColor Green
        }
        
    } else {
        Write-Host "  FAILED: $($docsResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get exporter profile info
Write-Host ""
Write-Host "[2/4] Getting exporter profile..." -ForegroundColor Yellow

try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/exporter/profile" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "  SUCCESS: Profile retrieved" -ForegroundColor Green
    Write-Host "  Business Name: $($profileResponse.business_name)" -ForegroundColor Gray
    Write-Host "  TIN: $($profileResponse.tin)" -ForegroundColor Gray
    
    $exporterInfo = @{
        businessName = $profileResponse.business_name
        tin = $profileResponse.tin
        registrationNumber = $profileResponse.registration_number
        contactPerson = $profileResponse.contact_person
        phone = $profileResponse.phone
        email = $profileResponse.email
    }
    
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Submit to network
Write-Host ""
Write-Host "[3/4] Submitting to network..." -ForegroundColor Yellow

$submissionBody = @{
    exporterInfo = $exporterInfo
    issuedDocumentIds = $documentIds
    supportingDocuments = @(
        @{
            type = "SALES_CONTRACT"
            reference = $ectaReference
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $submissionResponse = Invoke-RestMethod -Uri "$baseUrl/api/network/submissions" `
        -Method Post `
        -Headers $headers `
        -Body $submissionBody `
        -ErrorAction Stop
    
    if ($submissionResponse.success) {
        Write-Host "  SUCCESS: Network submission created" -ForegroundColor Green
        Write-Host "  Submission ID: $($submissionResponse.data.submissionId)" -ForegroundColor Gray
        Write-Host "  ESW Reference: $($submissionResponse.data.eswReferenceNumber)" -ForegroundColor Gray
        Write-Host "  Network Reference: $($submissionResponse.data.networkReferenceNumber)" -ForegroundColor Gray
        Write-Host "  Status: $($submissionResponse.data.status)" -ForegroundColor Gray
        
        $submissionId = $submissionResponse.data.submissionId
        
        # Save submission info
        $submissionInfo = @{
            submissionId = $submissionId
            eswReference = $submissionResponse.data.eswReferenceNumber
            networkReference = $submissionResponse.data.networkReferenceNumber
            username = $username
            token = $token
        }
        
        $submissionInfo | ConvertTo-Json | Out-File -FilePath (Join-Path $PSScriptRoot "submission-info.json") -Encoding UTF8
        
    } else {
        Write-Host "  FAILED: $($submissionResponse.error)" -ForegroundColor Red
        if ($submissionResponse.missingDocuments) {
            Write-Host "  Missing documents:" -ForegroundColor Yellow
            foreach ($doc in $submissionResponse.missingDocuments) {
                Write-Host "    - $doc" -ForegroundColor Yellow
            }
        }
        exit 1
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMsg = $errorDetail.error
            if ($errorDetail.missingDocuments) {
                Write-Host "  FAILED: $errorMsg" -ForegroundColor Red
                Write-Host "  Missing documents:" -ForegroundColor Yellow
                foreach ($doc in $errorDetail.missingDocuments) {
                    Write-Host "    - $doc" -ForegroundColor Yellow
                }
                exit 1
            }
        } catch {}
    }
    Write-Host "  FAILED: $errorMsg" -ForegroundColor Red
    exit 1
}

# Step 4: Check submission status
Write-Host ""
Write-Host "[4/4] Checking submission status..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/network/submissions/$submissionId" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($statusResponse.success) {
        Write-Host "  SUCCESS: Submission status retrieved" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Network Member Statuses:" -ForegroundColor Cyan
        Write-Host "  ------------------------" -ForegroundColor Cyan
        Write-Host "  ECTA:     $($statusResponse.data.ectaStatus)" -ForegroundColor $(if ($statusResponse.data.ectaStatus -eq 'APPROVED') { 'Green' } else { 'Yellow' })
        Write-Host "  Bank:     $($statusResponse.data.bankStatus)" -ForegroundColor $(if ($statusResponse.data.bankStatus -eq 'APPROVED') { 'Green' } else { 'Yellow' })
        Write-Host "  NBE:      $($statusResponse.data.nbeStatus)" -ForegroundColor $(if ($statusResponse.data.nbeStatus -eq 'APPROVED') { 'Green' } else { 'Yellow' })
        Write-Host "  Customs:  $($statusResponse.data.customsStatus)" -ForegroundColor $(if ($statusResponse.data.customsStatus -eq 'APPROVED') { 'Green' } else { 'Yellow' })
        Write-Host "  Shipping: $($statusResponse.data.shippingStatus)" -ForegroundColor $(if ($statusResponse.data.shippingStatus -eq 'APPROVED') { 'Green' } else { 'Yellow' })
        Write-Host ""
        Write-Host "  Overall Status: $($statusResponse.data.status)" -ForegroundColor $(if ($statusResponse.data.status -eq 'EXPORT_APPROVED') { 'Green' } elseif ($statusResponse.data.status -eq 'SUBMITTED') { 'Yellow' } else { 'Red' })
        
    } else {
        Write-Host "  FAILED: $($statusResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Network Submission Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($submissionResponse.success) {
    Write-Host "Submission created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Submission Details:" -ForegroundColor Yellow
    Write-Host "  Submission ID: $submissionId" -ForegroundColor White
    Write-Host "  ESW Reference: $($submissionResponse.data.eswReferenceNumber)" -ForegroundColor White
    Write-Host "  Documents: $($documentIds.Count)" -ForegroundColor White
    Write-Host ""
    Write-Host "Submission info saved to: submission-info.json" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Step: Wait for network member approvals" -ForegroundColor Yellow
    Write-Host "  Auto-approval may take a few seconds..." -ForegroundColor Gray
} else {
    Write-Host "Submission failed. Check error messages above." -ForegroundColor Red
}
