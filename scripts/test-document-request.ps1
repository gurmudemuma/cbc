# Phase 3: Document Request & Issuance Test
# Tests document request workflow with auto-approval

$ErrorActionPreference = "Continue"

# Load contract info from previous test
$contractInfoPath = Join-Path $PSScriptRoot "contract-info.json"
if (-not (Test-Path $contractInfoPath)) {
    Write-Host "ERROR: Contract info not found. Please run test-sales-contract.ps1 first." -ForegroundColor Red
    exit 1
}

$contractInfo = Get-Content $contractInfoPath | ConvertFrom-Json
$username = $contractInfo.username
$token = $contractInfo.token
$ectaReference = $contractInfo.ectaReference
$draftId = $contractInfo.draftId

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Document Request & Issuance Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Using Contract:" -ForegroundColor Yellow
Write-Host "  ECTA Reference: $ectaReference" -ForegroundColor White
Write-Host "  Draft ID: $draftId" -ForegroundColor White
Write-Host "  Username: $username" -ForegroundColor White
Write-Host ""

$baseUrl = "http://localhost:3000"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Document types to request (8 required for network submission)
$documents = @(
    @{ code = "ECTA"; type = "EXPORT_LICENSE"; desc = "Export License" },
    @{ code = "MOA"; type = "PHYTOSANITARY_CERTIFICATE"; desc = "Phytosanitary Certificate" },
    @{ code = "MOH"; type = "HEALTH_CERTIFICATE"; desc = "Health Certificate" },
    @{ code = "ECX"; type = "QUALITY_CERTIFICATE"; desc = "Quality Certificate" },
    @{ code = "ECTA"; type = "CERTIFICATE_OF_ORIGIN"; desc = "Certificate of Origin" },
    @{ code = "BANK"; type = "BANK_GUARANTEE"; desc = "Bank Guarantee" },
    @{ code = "SHIPPING"; type = "SHIPPING_BOOKING"; desc = "Shipping Booking" },
    @{ code = "CUSTOMS"; type = "CUSTOMS_CLEARANCE"; desc = "Customs Clearance" }
)

$requestedDocs = @()
$successCount = 0
$failCount = 0

# Request each document
foreach ($doc in $documents) {
    Write-Host "[$($documents.IndexOf($doc) + 1)/$($documents.Count)] Requesting $($doc.desc)..." -ForegroundColor Yellow
    
    $body = @{
        networkMemberCode = $doc.code
        documentType = $doc.type
        requestNotes = "Requested for sales contract $ectaReference"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/exporter/documents/request" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        if ($response.success) {
            Write-Host "  SUCCESS: $($doc.desc) requested" -ForegroundColor Green
            Write-Host "  Request ID: $($response.data.requestId)" -ForegroundColor Gray
            Write-Host "  Status: $($response.data.status)" -ForegroundColor Gray
            if ($response.data.autoApproval) {
                Write-Host "  Auto-Approval: Enabled (document will be issued automatically)" -ForegroundColor Cyan
            }
            
            $requestedDocs += @{
                type = $doc.type
                code = $doc.code
                desc = $doc.desc
                requestId = $response.data.requestId
                status = $response.data.status
            }
            $successCount++
        } else {
            Write-Host "  FAILED: $($response.error)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMsg = $errorDetail.error
        }
        Write-Host "  FAILED: $errorMsg" -ForegroundColor Red
        $failCount++
    }
    
    # Small delay between requests
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Waiting 3 seconds for auto-approval to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check document status
Write-Host ""
Write-Host "Checking document issuance status..." -ForegroundColor Yellow

try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/exporter/documents/requests" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($statusResponse.success) {
        Write-Host "  SUCCESS: Retrieved $($statusResponse.data.Count) document requests" -ForegroundColor Green
        Write-Host ""
        Write-Host "Document Status Summary:" -ForegroundColor Cyan
        Write-Host "------------------------" -ForegroundColor Cyan
        
        $issuedCount = 0
        $pendingCount = 0
        
        foreach ($req in $statusResponse.data) {
            $statusColor = switch ($req.status) {
                "ISSUED" { "Green"; $issuedCount++ }
                "PENDING" { "Yellow"; $pendingCount++ }
                "UNDER_REVIEW" { "Cyan" }
                "REJECTED" { "Red" }
                default { "White" }
            }
            
            Write-Host "  $($req.documentType): " -NoNewline
            Write-Host $req.status -ForegroundColor $statusColor
            
            if ($req.issuedDocument) {
                Write-Host "    Document Number: $($req.issuedDocument.documentNumber)" -ForegroundColor Gray
                Write-Host "    Issued At: $($req.issuedDocument.issuedAt)" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "Summary:" -ForegroundColor Cyan
        Write-Host "  Total Requested: $($documents.Count)" -ForegroundColor White
        Write-Host "  Successfully Requested: $successCount" -ForegroundColor Green
        Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
        Write-Host "  Issued: $issuedCount" -ForegroundColor Green
        Write-Host "  Pending: $pendingCount" -ForegroundColor Yellow
        
    } else {
        Write-Host "  FAILED: $($statusResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Document Request Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issuedCount -eq $documents.Count) {
    Write-Host "All documents issued successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Step: Network Submission" -ForegroundColor Yellow
    Write-Host "  Run: .\test-network-submission.ps1" -ForegroundColor White
} elseif ($issuedCount -gt 0) {
    Write-Host "Some documents issued. Waiting for remaining documents..." -ForegroundColor Yellow
    Write-Host "  Issued: $issuedCount / $($documents.Count)" -ForegroundColor White
} else {
    Write-Host "No documents issued yet. Check system logs." -ForegroundColor Red
}

Write-Host ""
