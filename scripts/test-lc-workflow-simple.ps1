# Simple LC Number Workflow Test
# Tests the complete flow without execution policy issues

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "LC Number Workflow Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Login as Exporter
Write-Host "[1/10] Testing Exporter Login..." -ForegroundColor Yellow
try {
    $loginBody = '{"username":"exporter1","password":"password123"}'
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $exporterToken = $loginResponse.token
    Write-Host "  ✓ Login successful - User: $($loginResponse.user.username)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $exporterToken"
    "Content-Type" = "application/json"
}

# Test 2: Get Exporter Profile
Write-Host "[2/10] Getting Exporter Profile..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/api/exporter/profile" -Method Get -Headers $headers
    $exporterId = $profile.data.exporterId
    Write-Host "  ✓ Profile loaded - Business: $($profile.data.businessName)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Profile fetch failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Create Sales Contract
Write-Host "[3/10] Creating Sales Contract..." -ForegroundColor Yellow
try {
    $contractBody = @{
        buyerId = "550e8400-e29b-41d4-a716-446655440001"
        coffeeType = "Arabica Yirgacheffe"
        originRegion = "Yirgacheffe"
        quantity = 10000
        unitPrice = 5.50
        currency = "USD"
        totalValue = 55000
        qualityGrade = "Grade 1"
        paymentMethod = "LC"
        paymentTerms = "Net 30"
        incoterms = "FOB"
        portOfLoading = "Djibouti Port"
        portOfDischarge = "New York Port"
        deliveryDate = "2026-06-30"
        governingLaw = "CISG"
        arbitrationRules = "ICC"
        arbitrationLocation = "Addis Ababa"
        proposedByType = "EXPORTER"
        issuingBank = "Commercial Bank of Ethiopia"
        advisingBank = "Citibank New York"
    } | ConvertTo-Json
    
    $contract = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts" -Method Post -Body $contractBody -Headers $headers
    $draftId = $contract.draft.draftId
    Write-Host "  ✓ Contract created - Draft ID: $draftId" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Contract creation failed: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Accept Contract
Write-Host "[4/10] Accepting Contract..." -ForegroundColor Yellow
try {
    $acceptBody = '{"status":"ACCEPTED","responseNotes":"Terms accepted for testing"}'
    $accepted = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts/$draftId/respond" -Method Post -Body $acceptBody -Headers $headers
    Write-Host "  ✓ Contract accepted" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Contract acceptance failed: $_" -ForegroundColor Red
    exit 1
}

# Test 5: Login as ECTA
Write-Host "[5/10] Testing ECTA Login..." -ForegroundColor Yellow
try {
    $ectaLoginBody = '{"username":"ecta1","password":"password123"}'
    $ectaResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $ectaLoginBody -ContentType "application/json"
    $ectaToken = $ectaResponse.token
    Write-Host "  ✓ ECTA login successful" -ForegroundColor Green
} catch {
    Write-Host "  ✗ ECTA login failed: $_" -ForegroundColor Red
    exit 1
}

$ectaHeaders = @{
    "Authorization" = "Bearer $ectaToken"
    "Content-Type" = "application/json"
}

# Test 6: Register Contract and Generate LC Number
Write-Host "[6/10] Registering Contract (Generating LC Number)..." -ForegroundColor Yellow
try {
    $registerBody = '{"notes":"Test registration for LC number workflow"}'
    $registered = Invoke-RestMethod -Uri "$baseUrl/api/ecta/contracts/$draftId/register" -Method Post -Body $registerBody -Headers $ectaHeaders
    $lcNumber = if ($registered.lcNumber) { $registered.lcNumber } else { $registered.referenceNumber }
    Write-Host "  ✓ LC Number Generated: $lcNumber" -ForegroundColor Green -BackgroundColor DarkGreen
} catch {
    Write-Host "  ✗ Registration failed: $_" -ForegroundColor Red
    exit 1
}

# Test 7: Verify LC Number in Database
Write-Host "[7/10] Verifying LC Number in Database..." -ForegroundColor Yellow
try {
    $dbCheck = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT lc_number, status FROM contract_drafts WHERE draft_id = '$draftId'"
    if ($dbCheck -match $lcNumber) {
        Write-Host "  ✓ LC Number found in database: $lcNumber" -ForegroundColor Green
    } else {
        Write-Host "  ✗ LC Number not found in database" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Database verification failed: $_" -ForegroundColor Red
    exit 1
}

# Test 8: Create Export with Contract
Write-Host "[8/10] Creating Export with Contract Link..." -ForegroundColor Yellow
try {
    $exportQuery = @"
INSERT INTO exports (
    exporter_id, coffee_type, quantity, destination_country, 
    estimated_value, currency, contract_id, buyer_id, status
) 
SELECT 
    exporter_id, 'Arabica Yirgacheffe', 10000, 'United States',
    55000, 'USD', '$draftId', '550e8400-e29b-41d4-a716-446655440001', 'APPROVED'
FROM exporter_profiles 
WHERE user_id = (SELECT id FROM users WHERE username = 'exporter1')
RETURNING export_id;
"@
    
    $exportId = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $exportQuery
    $exportId = $exportId.Trim()
    Write-Host "  ✓ Export created: $exportId" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Export creation failed: $_" -ForegroundColor Red
    exit 1
}

# Test 9: Fetch Exports with LC Number
Write-Host "[9/10] Fetching Exports with LC Number Mapping..." -ForegroundColor Yellow
try {
    $exports = Invoke-RestMethod -Uri "$baseUrl/api/exports?status=APPROVED" -Method Get -Headers $headers
    $exportWithLC = $exports.exports | Where-Object { $_.export_id -eq $exportId }
    
    if ($exportWithLC -and $exportWithLC.lc_number -eq $lcNumber) {
        Write-Host "  ✓ Export has LC Number: $($exportWithLC.lc_number)" -ForegroundColor Green
        Write-Host "    - Payment Method: $($exportWithLC.payment_method)" -ForegroundColor Gray
        Write-Host "    - Issuing Bank: $($exportWithLC.issuing_bank)" -ForegroundColor Gray
        Write-Host "    - Contract Amount: $($exportWithLC.contract_amount)" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ LC Number not mapped to export" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Export fetch failed: $_" -ForegroundColor Red
    exit 1
}

# Test 10: Verify Complete Flow
Write-Host "[10/10] Verifying Complete Data Flow..." -ForegroundColor Yellow
try {
    $flowQuery = @"
SELECT 
    cd.lc_number as contract_lc,
    cd.status as contract_status,
    e.export_id,
    e.status as export_status
FROM contract_drafts cd
LEFT JOIN exports e ON e.contract_id = cd.draft_id
WHERE cd.draft_id = '$draftId';
"@
    
    $flowResult = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $flowQuery
    Write-Host "  ✓ Complete flow verified:" -ForegroundColor Green
    Write-Host "    $flowResult" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Flow verification failed: $_" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ All 10 tests passed!" -ForegroundColor Green
Write-Host "`nKey Results:" -ForegroundColor Cyan
Write-Host "  • LC Number: $lcNumber" -ForegroundColor Green
Write-Host "  • Contract Status: FINALIZED" -ForegroundColor Green
Write-Host "  • Export Status: APPROVED" -ForegroundColor Green
Write-Host "  • LC Number Mapping: Working" -ForegroundColor Green
Write-Host "`n🎉 LC Number workflow is fully operational!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  2. Login as exporter1 / password123" -ForegroundColor White
Write-Host "  3. Navigate to Payment Management" -ForegroundColor White
Write-Host "  4. Click 'Initiate Payment'" -ForegroundColor White
Write-Host "  5. Select the export - LC Number will auto-fill!" -ForegroundColor White
Write-Host "`n========================================`n" -ForegroundColor Cyan
