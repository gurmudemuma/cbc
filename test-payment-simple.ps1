# Simple Payment System Test Script

$baseUrl = "http://localhost:3000/api"
$testResults = @()

function Add-TestResult {
    param($category, $test, $passed, $details = "")
    $script:testResults += [PSCustomObject]@{
        Category = $category
        Test = $test
        Passed = $passed
        Details = $details
    }
}

function Get-AuthToken {
    param($username, $password)
    
    try {
        $loginData = @{
            username = $username
            password = $password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method Post `
            -Body $loginData `
            -ContentType "application/json" `
            -ErrorAction Stop

        return $response.token
    }
    catch {
        Write-Host "Login failed for $username : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n=== Payment System Tests ===" -ForegroundColor Cyan

# Test 1: Exporter Login and Payment Initiation
Write-Host "`nTest 1: Exporter Payment Initiation" -ForegroundColor Yellow

$exporterToken = Get-AuthToken -username "exporter1" -password "password123"

if ($exporterToken) {
    Write-Host "  [OK] Exporter logged in" -ForegroundColor Green
    
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        
        # Get exporter profile to find exporter_id
        $exporterQuery = "SELECT exporter_id FROM exporter_profiles WHERE user_id = 'exporter1';"
        $exporterId = (docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $exporterQuery 2>&1 | Select-String -Pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}").Matches[0].Value
        
        if ($exporterId) {
            Write-Host "  [OK] Found exporter profile: $exporterId" -ForegroundColor Green
            
            # Get exports for this exporter from database
            $exportsQuery = "SELECT export_id FROM exports WHERE exporter_id = '$exporterId' LIMIT 1;"
            $exportIdRaw = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $exportsQuery 2>&1 | Out-String
            
            if ($exportIdRaw -match "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}") {
                $exportId = $Matches[0]
                Write-Host "  [OK] Found export: $exportId" -ForegroundColor Green
                
                $paymentData = @{
                    exportId = $exportId
                    paymentMethod = "LC"
                    paymentTerms = "Net 30"
                    amount = 50000.00
                    currency = "USD"
                    lcDetails = @{
                        lcNumber = "LC-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
                        issuingBank = "Commercial Bank of Ethiopia"
                        advisingBank = "Citibank New York"
                        expiryDate = (Get-Date).AddMonths(3).ToString("yyyy-MM-dd")
                        amount = 50000.00
                    }
                    notes = "Test payment for coffee export"
                } | ConvertTo-Json -Depth 5

                $payment = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" `
                    -Headers $headers `
                    -Method Post `
                    -Body $paymentData `
                    -ContentType "application/json"

                if ($payment.success) {
                    $script:testPaymentId = $payment.payment.paymentId
                    Write-Host "  [OK] Payment initiated: $($payment.payment.paymentId)" -ForegroundColor Green
                    Write-Host "       Amount: $($payment.payment.amount) $($payment.payment.currency)" -ForegroundColor Gray
                    Add-TestResult "Exporter" "Initiate Payment" $true "Payment ID: $($payment.payment.paymentId)"
                }
                else {
                    Write-Host "  [FAIL] Payment initiation failed: $($payment.error)" -ForegroundColor Red
                    Add-TestResult "Exporter" "Initiate Payment" $false $payment.error
                }
            }
            else {
                Write-Host "  [FAIL] No exports found for exporter" -ForegroundColor Red
                Add-TestResult "Exporter" "Initiate Payment" $false "No exports available"
            }
        }
        else {
            Write-Host "  [FAIL] Exporter profile not found" -ForegroundColor Red
            Add-TestResult "Exporter" "Initiate Payment" $false "Exporter profile not found"
        }
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Exporter" "Initiate Payment" $false $_.Exception.Message
    }
}
else {
    Add-TestResult "Exporter" "Login" $false "Authentication failed"
}

# Test 2: Submit Documents
Write-Host "`nTest 2: Submit Payment Documents" -ForegroundColor Yellow

if ($exporterToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        $documentsData = @{
            documents = @(
                @{
                    documentType = "COMMERCIAL_INVOICE"
                    documentName = "Commercial Invoice"
                    documentUrl = "https://example.com/docs/invoice.pdf"
                    documentHash = "abc123"
                },
                @{
                    documentType = "BILL_OF_LADING"
                    documentName = "Bill of Lading"
                    documentUrl = "https://example.com/docs/bol.pdf"
                    documentHash = "def456"
                }
            )
        } | ConvertTo-Json -Depth 5

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/$($script:testPaymentId)/documents" `
            -Headers $headers `
            -Method Post `
            -Body $documentsData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Host "  [OK] Documents submitted: $($result.documents.Count)" -ForegroundColor Green
            Add-TestResult "Exporter" "Submit Documents" $true "$($result.documents.Count) documents"
        }
        else {
            Write-Host "  [FAIL] Document submission failed: $($result.error)" -ForegroundColor Red
            Add-TestResult "Exporter" "Submit Documents" $false $result.error
        }
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Exporter" "Submit Documents" $false $_.Exception.Message
    }
}

# Test 3: View Payments
Write-Host "`nTest 3: View Payments List" -ForegroundColor Yellow

if ($exporterToken) {
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        $payments = Invoke-RestMethod -Uri "$baseUrl/payments" -Headers $headers -Method Get

        if ($payments.success) {
            Write-Host "  [OK] Retrieved $($payments.payments.Count) payments" -ForegroundColor Green
            Add-TestResult "Exporter" "View Payments" $true "$($payments.payments.Count) payments"
        }
        else {
            Write-Host "  [FAIL] Failed to retrieve payments" -ForegroundColor Red
            Add-TestResult "Exporter" "View Payments" $false $payments.error
        }
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Exporter" "View Payments" $false $_.Exception.Message
    }
}

# Test 4: Bank Login and View Pending
Write-Host "`nTest 4: Bank View Pending Payments" -ForegroundColor Yellow

$bankToken = Get-AuthToken -username "bank1" -password "password123"

if ($bankToken) {
    Write-Host "  [OK] Bank logged in" -ForegroundColor Green
    
    try {
        $headers = @{ Authorization = "Bearer $bankToken" }
        $pending = Invoke-RestMethod -Uri "$baseUrl/payments/bank/pending-review" -Headers $headers -Method Get

        if ($pending.success) {
            Write-Host "  [OK] Retrieved $($pending.count) pending payments" -ForegroundColor Green
            Add-TestResult "Bank" "View Pending" $true "$($pending.count) payments"
        }
        else {
            Write-Host "  [FAIL] Failed to retrieve pending" -ForegroundColor Red
            Add-TestResult "Bank" "View Pending" $false $pending.error
        }
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Bank" "View Pending" $false $_.Exception.Message
    }
}

# Test 5: Bank Approve Payment
Write-Host "`nTest 5: Bank Approve Payment" -ForegroundColor Yellow

if ($bankToken -and $script:testPaymentId) {
    try {
        # First update payment status to UNDER_REVIEW in database
        $updateStatus = "UPDATE payments SET status = 'UNDER_REVIEW' WHERE payment_id = '$($script:testPaymentId)';"
        docker exec coffee-postgres psql -U postgres -d coffee_export_db -c $updateStatus 2>&1 | Out-Null
        
        $headers = @{ Authorization = "Bearer $bankToken" }
        
        $approvalData = @{
            bankReference = "BANK-REF-$(Get-Date -Format 'yyyyMMddHHmmss')"
            notes = "Payment approved"
        } | ConvertTo-Json

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/bank/$($script:testPaymentId)/approve" `
            -Headers $headers `
            -Method Post `
            -Body $approvalData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Host "  [OK] Payment approved" -ForegroundColor Green
            Add-TestResult "Bank" "Approve Payment" $true "Approved"
        }
        else {
            Write-Host "  [FAIL] Approval failed: $($result.error)" -ForegroundColor Red
            Add-TestResult "Bank" "Approve Payment" $false $result.error
        }
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Bank" "Approve Payment" $false $_.Exception.Message
    }
}

# Test 6: NBE Login and View Pending FX
Write-Host "`nTest 6: NBE View Pending FX Approvals" -ForegroundColor Yellow

$nbeToken = Get-AuthToken -username "nbe1" -password "password123"

if ($nbeToken) {
    Write-Host "  [OK] NBE logged in" -ForegroundColor Green
    
    try {
        $headers = @{ Authorization = "Bearer $nbeToken" }
        $pending = Invoke-RestMethod -Uri "$baseUrl/payments/nbe/pending-fx-approval" -Headers $headers -Method Get

        if ($pending.success) {
            Write-Host "  [OK] Retrieved $($pending.count) pending FX approvals" -ForegroundColor Green
            Add-TestResult "NBE" "View Pending FX" $true "$($pending.count) approvals"
        }
        else {
            Write-Host "  [FAIL] Failed to retrieve pending FX" -ForegroundColor Red
            Add-TestResult "NBE" "View Pending FX" $false $pending.error
        }
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "NBE" "View Pending FX" $false $_.Exception.Message
    }
}

# Test 7: NBE Approve FX
Write-Host "`nTest 7: NBE Approve Foreign Exchange" -ForegroundColor Yellow

if ($nbeToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $nbeToken" }
        
        $fxData = @{
            exchangeRate = 57.50
            nbeReference = "NBE-FX-$(Get-Date -Format 'yyyyMMddHHmmss')"
            notes = "FX approved at official rate"
        } | ConvertTo-Json

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/nbe/$($script:testPaymentId)/fx/approve" `
            -Headers $headers `
            -Method Post `
            -Body $fxData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Host "  [OK] FX approved" -ForegroundColor Green
            Write-Host "       Rate: $($result.fxDetails.exchangeRate), ETB: $($result.fxDetails.amountEtb)" -ForegroundColor Gray
            Add-TestResult "NBE" "Approve FX" $true "FX approved"
        }
        else {
            Write-Host "  [FAIL] FX approval failed: $($result.error)" -ForegroundColor Red
            Add-TestResult "NBE" "Approve FX" $false $result.error
        }
    }
    catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "NBE" "Approve FX" $false $_.Exception.Message
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Passed }).Count
$failedTests = $totalTests - $passedTests
$passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })

Write-Host "`n--- Results by Category ---" -ForegroundColor Yellow
$testResults | Group-Object Category | ForEach-Object {
    $categoryPassed = ($_.Group | Where-Object { $_.Passed }).Count
    $categoryTotal = $_.Group.Count
    $categoryRate = [math]::Round(($categoryPassed / $categoryTotal) * 100, 2)
    
    Write-Host "`n$($_.Name): $categoryPassed/$categoryTotal ($categoryRate%)" -ForegroundColor Cyan
    $_.Group | ForEach-Object {
        $status = if ($_.Passed) { "[PASS]" } else { "[FAIL]" }
        $color = if ($_.Passed) { "Green" } else { "Red" }
        Write-Host "  $status $($_.Test)" -ForegroundColor $color
        if (-not $_.Passed -and $_.Details) {
            Write-Host "    Error: $($_.Details)" -ForegroundColor DarkRed
        }
    }
}

# Save results
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = "PAYMENT-TEST-RESULTS-$timestamp.txt"

$report = "Payment System Test Results`n"
$report += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$report += "Summary:`n"
$report += "- Total Tests: $totalTests`n"
$report += "- Passed: $passedTests`n"
$report += "- Failed: $failedTests`n"
$report += "- Pass Rate: $passRate%`n`n"

$testResults | Group-Object Category | ForEach-Object {
    $categoryPassed = ($_.Group | Where-Object { $_.Passed }).Count
    $categoryTotal = $_.Group.Count
    $report += "`n$($_.Name): $categoryPassed/$categoryTotal`n"
    $_.Group | ForEach-Object {
        $status = if ($_.Passed) { "PASS" } else { "FAIL" }
        $report += "  [$status] $($_.Test)"
        if ($_.Details) {
            $report += " - $($_.Details)"
        }
        $report += "`n"
    }
}

$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "`nReport saved to: $reportFile" -ForegroundColor Cyan
