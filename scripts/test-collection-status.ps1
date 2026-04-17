# Test Document Collection Status Endpoint
# Tests the /api/exporter/documents/collection-status endpoint

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DOCUMENT COLLECTION STATUS TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Login as exporter
Write-Host "[1/2] Logging in as exporter..." -ForegroundColor Yellow

$loginBody = @{
    username = "exporter1"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get document collection status
Write-Host "`n[2/2] Fetching document collection status..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $statusResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/exporter/documents/collection-status" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Collection status retrieved successfully" -ForegroundColor Green
    
    # Display summary
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  DOCUMENT COLLECTION SUMMARY" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $data = $statusResponse.data
    Write-Host "Required Documents: $($data.requiredDocuments)" -ForegroundColor White
    Write-Host "Issued Documents:   $($data.issuedDocuments)" -ForegroundColor Green
    Write-Host "Pending Documents:  $($data.pendingDocuments)" -ForegroundColor Yellow
    Write-Host "Rejected Documents: $($data.rejectedDocuments)" -ForegroundColor Red
    Write-Host "Not Requested:      $($data.notRequestedDocuments)" -ForegroundColor Gray
    Write-Host "Collection Complete: $($data.isComplete)" -ForegroundColor $(if ($data.isComplete) { "Green" } else { "Yellow" })
    Write-Host "Can Submit to Network: $($data.canSubmitToNetwork)" -ForegroundColor $(if ($data.canSubmitToNetwork) { "Green" } else { "Yellow" })
    
    # Display document details
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  DOCUMENT DETAILS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    foreach ($doc in $data.documents) {
        $statusColor = switch ($doc.status) {
            "ISSUED" { "Green" }
            "PENDING" { "Yellow" }
            "REJECTED" { "Red" }
            "NOT_REQUESTED" { "Gray" }
            default { "White" }
        }
        
        Write-Host "`n$($doc.name) ($($doc.type))" -ForegroundColor White
        Write-Host "  Issuer: $($doc.issuer)" -ForegroundColor Gray
        Write-Host "  Status: $($doc.status)" -ForegroundColor $statusColor
        Write-Host "  Required: $($doc.required)" -ForegroundColor Gray
        if ($doc.requestedAt) {
            Write-Host "  Requested: $($doc.requestedAt)" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "✓ TEST COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
} catch {
    Write-Host "Failed to fetch collection status" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response details available" -ForegroundColor Red
    }
    exit 1
}
