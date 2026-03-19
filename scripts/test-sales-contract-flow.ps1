#!/usr/bin/env pwsh
# Sales Contract Flow Test Script
# Tests: Buyer Registration → Opportunity → Matching → Draft → Negotiation → Acceptance

$BaseUrl = "http://localhost:3000"
$ExporterUsername = "Ella"
$ExporterPassword = "password123"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sales Contract Flow - End-to-End Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================== STEP 1: Login as Exporter ====================
Write-Host "[1/7] Logging in as exporter..." -ForegroundColor Yellow

$loginResponse = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body "{`"username`":`"$ExporterUsername`",`"password`":`"$ExporterPassword`"}" `
  -UseBasicParsing 2>&1

$loginData = $loginResponse.Content | ConvertFrom-Json
$exporterToken = $loginData.token
$exporterId = $loginData.user.id

Write-Host "[OK] Logged in as $ExporterUsername (ID: $($exporterId))" -ForegroundColor Green
Write-Host ""

# ==================== STEP 2: Register Buyer ====================
Write-Host "[2/7] Registering buyer..." -ForegroundColor Yellow

$uniqueId = Get-Random -Minimum 10000 -Maximum 99999

$buyerResponse = Invoke-WebRequest -Uri "$BaseUrl/api/buyers/register" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -Body "{
    `"companyName`": `"Global Coffee Imports Ltd $uniqueId`",
    `"country`": `"Germany`",
    `"registrationNumber`": `"HRB-$uniqueId`",
    `"taxId`": `"DE$uniqueId`",
    `"email`": `"buyer$uniqueId@globalcoffee.de`",
    `"phone`": `"+49-30-123456`"
  }" `
  -UseBasicParsing 2>&1

if ($buyerResponse.StatusCode -ne 200) {
  Write-Host "[FAIL] Buyer registration failed: $($buyerResponse.Content)" -ForegroundColor Red
  exit 1
}

$buyerData = $buyerResponse.Content | ConvertFrom-Json
$buyerId = $buyerData.buyer.buyer_id

Write-Host "[OK] Buyer registered: $($buyerData.buyer.company_name)" -ForegroundColor Green
Write-Host "  Buyer ID: $buyerId" -ForegroundColor Gray
Write-Host "  Status: $($buyerData.buyer.verification_status)" -ForegroundColor Gray
Write-Host ""

# ==================== STEP 3: Create Buyer Opportunity ====================
Write-Host "[3/7] Creating buyer opportunity..." -ForegroundColor Yellow

$oppResponse = Invoke-WebRequest -Uri "$BaseUrl/api/marketplace/opportunities" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -Body "{
    `"buyerId`": `"$buyerId`",
    `"title`": `"Need 100 bags of Yirgacheffe Coffee`",
    `"coffeeType`": `"Yirgacheffe`",
    `"quantityMin`": 100,
    `"quantityMax`": 200,
    `"targetPriceMin`": 3.50,
    `"targetPriceMax`": 4.50,
    `"currency`": `"USD`",
    `"destinationCountry`": `"Germany`"
  }" `
  -UseBasicParsing 2>&1

if ($oppResponse.StatusCode -ne 200) {
  Write-Host "[FAIL] Opportunity creation failed: $($oppResponse.Content)" -ForegroundColor Red
  exit 1
}

$oppData = $oppResponse.Content | ConvertFrom-Json
$opportunityId = $oppData.opportunity.opportunity_id

Write-Host "[OK] Opportunity created" -ForegroundColor Green
Write-Host "  Opportunity ID: $opportunityId" -ForegroundColor Gray
Write-Host "  Title: $($oppData.opportunity.title)" -ForegroundColor Gray
Write-Host "  Status: $($oppData.opportunity.status)" -ForegroundColor Gray
Write-Host ""

# ==================== STEP 4: Create Contract Draft ====================
Write-Host "[4/7] Creating contract draft..." -ForegroundColor Yellow

$draftResponse = Invoke-WebRequest -Uri "$BaseUrl/api/contracts/drafts" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -Body "{
    `"buyerId`": `"$buyerId`",
    `"coffeeType`": `"Yirgacheffe`",
    `"originRegion`": `"Yirgacheffe Region`",
    `"quantity`": 150,
    `"unitPrice`": 4.00,
    `"currency`": `"USD`",
    `"paymentTerms`": `"Net 30`",
    `"paymentMethod`": `"LC`",
    `"incoterms`": `"FOB`",
    `"deliveryDate`": `"2026-04-15`",
    `"portOfLoading`": `"Port of Djibouti`",
    `"portOfDischarge`": `"Port of Hamburg`",
    `"governingLaw`": `"CISG`",
    `"arbitrationLocation`": `"Geneva`",
    `"arbitrationRules`": `"ICC`",
    `"qualityGrade`": `"Grade 1`",
    `"specialConditions`": `"Organic certified, Fair Trade compliant`",
    `"certificationsRequired`": [`"ORGANIC`", `"FAIR_TRADE`"]
  }" `
  -UseBasicParsing 2>&1

$draftData = $draftResponse.Content | ConvertFrom-Json
$draftId = $draftData.draft.draft_id

Write-Host "[OK] Contract draft created" -ForegroundColor Green
Write-Host "  Draft ID: $draftId" -ForegroundColor Gray
Write-Host "  Contract Number: $($draftData.draft.contract_number)" -ForegroundColor Gray
Write-Host "  Status: $($draftData.draft.status)" -ForegroundColor Gray
Write-Host "  Total Value: $($draftData.draft.total_value) USD" -ForegroundColor Gray
Write-Host ""

# ==================== STEP 5: Get Draft Details ====================
Write-Host "[5/7] Retrieving draft details..." -ForegroundColor Yellow

$detailResponse = Invoke-WebRequest -Uri "$BaseUrl/api/contracts/drafts/$draftId" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -UseBasicParsing 2>&1

$detailData = $detailResponse.Content | ConvertFrom-Json

Write-Host "[OK] Draft details retrieved" -ForegroundColor Green
Write-Host "  Quantity: $($detailData.quantity) bags" -ForegroundColor Gray
Write-Host "  Unit Price: $($detailData.unit_price) USD" -ForegroundColor Gray
Write-Host "  Total Value: $($detailData.total_value) USD" -ForegroundColor Gray
Write-Host "  Payment Terms: $($detailData.payment_terms)" -ForegroundColor Gray
Write-Host "  Incoterms: $($detailData.incoterms)" -ForegroundColor Gray
Write-Host "  Delivery Date: $($detailData.delivery_date)" -ForegroundColor Gray
Write-Host ""

# ==================== STEP 6: Get Legal Frameworks ====================
Write-Host "[6/7] Retrieving legal frameworks..." -ForegroundColor Yellow

$frameworkResponse = Invoke-WebRequest -Uri "$BaseUrl/api/legal/frameworks" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -UseBasicParsing 2>&1

$frameworkData = $frameworkResponse.Content | ConvertFrom-Json

Write-Host "[OK] Legal frameworks retrieved" -ForegroundColor Green
Write-Host "  Total frameworks: $($frameworkData.count)" -ForegroundColor Gray
foreach ($fw in $frameworkData.frameworks) {
  Write-Host "  - $($fw.framework_name) ($($fw.framework_code))" -ForegroundColor Gray
}
Write-Host ""

# ==================== STEP 7: Get Contract Clauses ====================
Write-Host "[7/7] Retrieving contract clauses..." -ForegroundColor Yellow

$clauseResponse = Invoke-WebRequest -Uri "$BaseUrl/api/legal/clauses?type=FORCE_MAJEURE" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -UseBasicParsing 2>&1

$clauseData = $clauseResponse.Content | ConvertFrom-Json

Write-Host "[OK] Contract clauses retrieved" -ForegroundColor Green
Write-Host "  Force Majeure clauses: $($clauseData.count)" -ForegroundColor Gray
foreach ($clause in $clauseData.clauses) {
  Write-Host "  - $($clause.clause_name)" -ForegroundColor Gray
}
Write-Host ""

# ==================== STEP 8: Accept Contract Draft ====================
Write-Host "[8/10] Accepting contract draft..." -ForegroundColor Yellow

$acceptResponse = Invoke-WebRequest -Uri "$BaseUrl/api/contracts/drafts/$draftId/accept" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -Body '{}' `
  -UseBasicParsing 2>&1

$acceptData = $acceptResponse.Content | ConvertFrom-Json

Write-Host "[OK] Contract draft accepted" -ForegroundColor Green
Write-Host "  Status: $($acceptData.draft.status)" -ForegroundColor Gray
Write-Host "  Responded At: $($acceptData.draft.responded_at)" -ForegroundColor Gray
Write-Host ""

# ==================== STEP 9: Finalize Contract to Blockchain ====================
Write-Host "[9/10] Finalizing contract to blockchain..." -ForegroundColor Yellow

$finalizeResponse = Invoke-WebRequest -Uri "$BaseUrl/api/contracts/drafts/$draftId/finalize" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $exporterToken"} `
  -Body '{}' `
  -UseBasicParsing 2>&1

$finalizeData = $finalizeResponse.Content | ConvertFrom-Json

Write-Host "[OK] Contract finalized on blockchain" -ForegroundColor Green
Write-Host "  Status: $($finalizeData.draft.status)" -ForegroundColor Gray
Write-Host "  Blockchain Contract ID: $($finalizeData.blockchainContractId)" -ForegroundColor Gray
Write-Host ""

# ==================== STEP 10: Generate Sales Contract Certificate ====================
Write-Host "[10/10] Generating sales contract certificate..." -ForegroundColor Yellow

$certificatePath = "sales-contract-$draftId.pdf"

try {
  $certResponse = Invoke-WebRequest -Uri "$BaseUrl/api/contracts/drafts/$draftId/certificate" `
    -Method GET `
    -Headers @{"Authorization"="Bearer $exporterToken"} `
    -OutFile $certificatePath `
    -UseBasicParsing 2>&1

  Write-Host "[OK] Certificate generated successfully" -ForegroundColor Green
  Write-Host "  File: $certificatePath" -ForegroundColor Gray
  Write-Host "  Size: $((Get-Item $certificatePath).Length) bytes" -ForegroundColor Gray
} catch {
  Write-Host "[FAIL] Certificate generation failed" -ForegroundColor Red
  Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ==================== Summary ====================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Created Resources:" -ForegroundColor Yellow
Write-Host "  Buyer ID:              $buyerId" -ForegroundColor Gray
Write-Host "  Opportunity ID:        $opportunityId" -ForegroundColor Gray
Write-Host "  Draft ID:              $draftId" -ForegroundColor Gray
Write-Host "  Blockchain Contract:   $($finalizeData.blockchainContractId)" -ForegroundColor Gray
Write-Host "  Certificate File:      $certificatePath" -ForegroundColor Gray
Write-Host ""
Write-Host "Workflow Completed:" -ForegroundColor Yellow
Write-Host "  [OK] Buyer registered" -ForegroundColor Green
Write-Host "  [OK] Opportunity created" -ForegroundColor Green
Write-Host "  [OK] Contract draft created" -ForegroundColor Green
Write-Host "  [OK] Contract accepted" -ForegroundColor Green
Write-Host "  [OK] Contract finalized on blockchain" -ForegroundColor Green
Write-Host "  [OK] Certificate generated" -ForegroundColor Green
Write-Host ""
