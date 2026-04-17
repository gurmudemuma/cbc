# Sales Contract Creation Test
# Tests the complete sales contract workflow: Create → Submit → Finalize

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sales Contract Creation Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Use the test account from previous test
$testUsername = "testexp1776323792690"
$testPassword = "Test123!"

Write-Host "Using Test Account:" -ForegroundColor Yellow
Write-Host "  Username: $testUsername" -ForegroundColor Gray
Write-Host ""

# Step 1: Login
Write-Host "[1/4] Logging in as exporter..." -ForegroundColor Yellow

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
} catch {
    Write-Host "  FAILED: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create Sales Contract Draft
Write-Host "[2/4] Creating sales contract draft..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$contractData = @{
    buyerId = "6c9fe9f0-abae-4096-937a-2345d1c77d59"
    coffeeType = "Arabica"
    originRegion = "Sidamo"
    quantity = 1000
    unitPrice = 5.50
    currency = "USD"
    paymentTerms = "30 days after shipment"
    paymentMethod = "LC"
    incoterms = "FOB"
    deliveryDate = (Get-Date).AddMonths(2).ToString("yyyy-MM-dd")
    portOfLoading = "Djibouti Port"
    portOfDischarge = "New York Port"
    governingLaw = "Ethiopian Law"
    contractLanguage = "English"
    qualityGrade = "Grade 1"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts" `
        -Method Post `
        -Headers $headers `
        -Body $contractData
    
    $draftId = $createResponse.draft.draft_id
    Write-Host "  SUCCESS: Contract draft created" -ForegroundColor Green
    Write-Host "  Draft ID: $draftId" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $_" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  Error: $($errorDetails.error)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Accept Contract (simulate buyer acceptance via database)
Write-Host "[3/4] Simulating buyer acceptance..." -ForegroundColor Yellow

try {
    $acceptQuery = "UPDATE contract_drafts SET status = 'ACCEPTED', responded_by = 'BUYER', responded_by_type = 'BUYER', responded_at = NOW() WHERE draft_id = '$draftId';"
    docker exec coffee-postgres psql -U postgres -d coffee_export_db -c $acceptQuery | Out-Null
    Write-Host "  SUCCESS: Contract status updated to ACCEPTED" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Could not update status" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Finalize Contract
Write-Host "[4/4] Finalizing sales contract..." -ForegroundColor Yellow

try {
    $finalizeResponse = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts/$draftId/finalize" `
        -Method Post `
        -Headers $headers
    
    $ectaReference = $finalizeResponse.ectaReferenceNumber
    Write-Host "  SUCCESS: Contract finalized" -ForegroundColor Green
    Write-Host "  ECTA Reference: $ectaReference" -ForegroundColor Cyan
    Write-Host "  Status: $($finalizeResponse.status)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $_" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  Error: $($errorDetails.error)" -ForegroundColor Red
    if ($errorDetails.details) {
        Write-Host "  Details: $($errorDetails.details)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# Verify Contract in Database
Write-Host "Verifying contract in database..." -ForegroundColor Yellow

try {
    $dbCheck = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT draft_id, status, ecta_reference_number FROM contract_drafts WHERE draft_id = '$draftId';"
    Write-Host "  Database Record:" -ForegroundColor Gray
    Write-Host "  $dbCheck" -ForegroundColor Gray
} catch {
    Write-Host "  WARNING: Could not verify database" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sales Contract Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Contract Details:" -ForegroundColor Yellow
Write-Host "  Draft ID: $draftId" -ForegroundColor White
Write-Host "  ECTA Reference: $ectaReference" -ForegroundColor White
Write-Host "  Buyer: Global Coffee Importers Inc" -ForegroundColor White
Write-Host "  Coffee: Arabica, 1000 kg" -ForegroundColor White
Write-Host "  Value: $5,500 USD" -ForegroundColor White
Write-Host "  Status: FINALIZED" -ForegroundColor Green
Write-Host ""
Write-Host "Next Step: Document Request" -ForegroundColor Yellow
Write-Host "  Use ECTA Reference: $ectaReference" -ForegroundColor Cyan
Write-Host "  Run: .\test-document-request.ps1" -ForegroundColor Gray
Write-Host ""

# Save contract info for next test
$contractInfo = @{
    draftId = $draftId
    ectaReference = $ectaReference
    username = $testUsername
    token = $token
} | ConvertTo-Json

$contractInfo | Out-File "contract-info.json"
Write-Host "Contract info saved to: contract-info.json" -ForegroundColor Gray
Write-Host ""
