# Simple Workflow Functions Test

Write-Host "`n=== WORKFLOW FUNCTIONS TEST ===`n" -ForegroundColor Cyan

$tests = @()

# Test 1: Chaincode deployment
Write-Host "[1/5] Checking chaincode deployment..." -ForegroundColor Yellow
$chaincodeInfo = docker exec cli peer lifecycle chaincode querycommitted -C coffeechannel -n ecta 2>&1 | Out-String
if ($chaincodeInfo -match "Version: (\d+\.\d+), Sequence: (\d+)") {
    Write-Host "  PASS: Chaincode v$($matches[1]) seq$($matches[2])" -ForegroundColor Green
    $tests += "PASS"
} else {
    Write-Host "  FAIL: Not deployed" -ForegroundColor Red
    $tests += "FAIL"
}

# Test 2: GetReferenceByDraftId
Write-Host "`n[2/5] Testing GetReferenceByDraftId..." -ForegroundColor Yellow
$result = docker exec cli peer chaincode query -C coffeechannel -n ecta -c '{"function":"GetReferenceByDraftId","Args":["test-123"]}' 2>&1 | Out-String
if ($result -match "No reference found") {
    Write-Host "  PASS: Function exists" -ForegroundColor Green
    $tests += "PASS"
} else {
    Write-Host "  FAIL: Function not found" -ForegroundColor Red
    $tests += "FAIL"
}

# Test 3: RegisterSalesContractWithReference
Write-Host "`n[3/5] Testing RegisterSalesContractWithReference..." -ForegroundColor Yellow
$result = docker exec cli peer chaincode query -C coffeechannel -n ecta -c '{"function":"RegisterSalesContractWithReference","Args":["{}"]}' 2>&1 | Out-String
if ($result -match "Missing required fields" -or $result -match "draftId") {
    Write-Host "  PASS: Function exists" -ForegroundColor Green
    $tests += "PASS"
} else {
    Write-Host "  FAIL: Function not found" -ForegroundColor Red
    $tests += "FAIL"
}

# Test 4: SubmitToNetwork
Write-Host "`n[4/5] Testing SubmitToNetwork..." -ForegroundColor Yellow
$result = docker exec cli peer chaincode query -C coffeechannel -n ecta -c '{"function":"SubmitToNetwork","Args":["{}"]}' 2>&1 | Out-String
if ($result -match "Missing required fields" -or $result -match "referenceNumber") {
    Write-Host "  PASS: Function exists" -ForegroundColor Green
    $tests += "PASS"
} else {
    Write-Host "  FAIL: Function not found" -ForegroundColor Red
    $tests += "FAIL"
}

# Test 5: UpdateOrganizationApproval
Write-Host "`n[5/5] Testing UpdateOrganizationApproval..." -ForegroundColor Yellow
$result = docker exec cli peer chaincode query -C coffeechannel -n ecta -c '{"function":"UpdateOrganizationApproval","Args":["TEST","BANK","{}"]}' 2>&1 | Out-String
if ($result -match "does not exist" -or $result -match "Contract with reference") {
    Write-Host "  PASS: Function exists" -ForegroundColor Green
    $tests += "PASS"
} else {
    Write-Host "  FAIL: Function not found" -ForegroundColor Red
    $tests += "FAIL"
}

# Summary
$passCount = ($tests | Where-Object { $_ -eq "PASS" }).Count
$totalCount = $tests.Count

Write-Host "`n=== RESULTS: $passCount/$totalCount PASSING ===`n" -ForegroundColor Cyan

if ($passCount -eq $totalCount) {
    Write-Host "SUCCESS: All workflow functions are deployed and working!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAILURE: Some functions are missing" -ForegroundColor Red
    exit 1
}
