# Payment System Workflow Testing Script
# Tests complete payment workflows for different roles

$baseUrl = "http://localhost:3000/api"
$testResults = @()

# Color output functions
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Failure { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Section { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Yellow }

# Test result tracking
function Add-TestResult {
    param($category, $test, $passed, $details = "")
    $script:testResults += [PSCustomObject]@{
        Category = $category
        Test = $test
        Passed = $passed
        Details = $details
    }
}

# Login function
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
        Write-Failure "Login failed for $username"
        return $null
    }
}

# Test 1: Exporter Payment Initiation
Write-Section "Test 1: Exporter Payment Initiation"

$exporterToken = Get-AuthToken -username "exporter1" -password "password123"

if ($exporterToken) {
    Write-Success "Exporter logged in successfully"
    
    # Get exporter's exports
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        $exports = Invoke-RestMethod -Uri "$baseUrl/exports" -Headers $headers -Method Get
        
        if ($exports.exports -and $exports.exports.Count -gt 0) {
            $exportId = $exports.exports[0].export_id
            Write-Success "Found export: $exportId"
            
            # Initiate LC payment
            $paymentData = @{
                exportId = $exportId
                paymentMethod = "LC"
                paymentTerms = "Net 30"
                amount = 50000.00
                currency = "USD"
                lcDetails = @{
                    lcNumber = "LC-TEST-" + (Get-Date -Format "yyyyMMddHHmmss")
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
                Write-Success "Payment initiated: $($payment.payment.paymentId)"
                Write-Info "Amount: $($payment.payment.amount) $($payment.payment.currency)"
                Write-Info "Method: $($payment.payment.paymentMethod)"
                Add-TestResult "Exporter" "Initiate Payment" $true "Payment ID: $($payment.payment.paymentId)"
            }
            else {
                Write-Failure "Payment initiation failed"
                Add-TestResult "Exporter" "Initiate Payment" $false $payment.error
            }
        }
        else {
            Write-Failure "No exports found for exporter"
            Add-TestResult "Exporter" "Initiate Payment" $false "No exports available"
        }
    }
    catch {
        Write-Failure "Payment initiation error: $($_.Exception.Message)"
        Add-TestResult "Exporter" "Initiate Payment" $false $_.Exception.Message
    }
}
else {
    Add-TestResult "Exporter" "Login" $false "Authentication failed"
}

# Test 2: Exporter Submit Documents
Write-Section "Test 2: Exporter Submit Payment Documents"

if ($exporterToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        $documentsData = @{
            documents = @(
                @{
                    documentType = "COMMERCIAL_INVOICE"
                    documentName = "Commercial Invoice - Test Export"
                    documentUrl = "https://example.com/docs/invoice.pdf"
                    documentHash = "abc123hash"
                },
                @{
                    documentType = "BILL_OF_LADING"
                    documentName = "Bill of Lading"
                    documentUrl = "https://example.com/docs/bol.pdf"
                    documentHash = "def456hash"
                },
                @{
                    documentType = "CERTIFICATE_OF_ORIGIN"
                    documentName = "Certificate of Origin"
                    documentUrl = "https://example.com/docs/coo.pdf"
                    documentHash = "ghi789hash"
                }
            )
        } | ConvertTo-Json -Depth 5

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/$($script:testPaymentId)/documents" `
            -Headers $headers `
            -Method Post `
            -Body $documentsData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Success "Documents submitted: $($result.documents.Count) documents"
            Add-TestResult "Exporter" "Submit Documents" $true "$($result.documents.Count) documents"
        }
        else {
            Write-Failure "Document submission failed"
            Add-TestResult "Exporter" "Submit Documents" $false $result.error
        }
    }
    catch {
        Write-Failure "Document submission error: $($_.Exception.Message)"
        Add-TestResult "Exporter" "Submit Documents" $false $_.Exception.Message
    }
}

# Test 3: Exporter View Payments
Write-Section "Test 3: Exporter View Payments"

if ($exporterToken) {
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        $payments = Invoke-RestMethod -Uri "$baseUrl/payments" -Headers $headers -Method Get

        if ($payments.success) {
            Write-Success "Retrieved $($payments.payments.Count) payments"
            Write-Info "Total: $($payments.pagination.total)"
            Add-TestResult "Exporter" "View Payments" $true "$($payments.payments.Count) payments"
        }
        else {
            Write-Failure "Failed to retrieve payments"
            Add-TestResult "Exporter" "View Payments" $false $payments.error
        }
    }
    catch {
        Write-Failure "Payment retrieval error: $($_.Exception.Message)"
        Add-TestResult "Exporter" "View Payments" $false $_.Exception.Message
    }
}

# Test 4: Exporter Payment Statistics
Write-Section "Test 4: Exporter Payment Statistics"

if ($exporterToken) {
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        $stats = Invoke-RestMethod -Uri "$baseUrl/payments/statistics" -Headers $headers -Method Get

        if ($stats.success) {
            Write-Success "Retrieved payment statistics"
            Write-Info "Total Payments: $($stats.statistics.total_payments)"
            Write-Info "Completed: $($stats.statistics.completed_payments)"
            Write-Info "Pending: $($stats.statistics.pending_payments)"
            Add-TestResult "Exporter" "Payment Statistics" $true "Stats retrieved"
        }
        else {
            Write-Failure "Failed to retrieve statistics"
            Add-TestResult "Exporter" "Payment Statistics" $false $stats.error
        }
    }
    catch {
        Write-Failure "Statistics retrieval error: $($_.Exception.Message)"
        Add-TestResult "Exporter" "Payment Statistics" $false $_.Exception.Message
    }
}

# Test 5: Bank View Pending Payments
Write-Section "Test 5: Bank View Pending Payments"

$bankToken = Get-AuthToken -username "bank1" -password "password123"

if ($bankToken) {
    Write-Success "Bank logged in successfully"
    
    try {
        $headers = @{ Authorization = "Bearer $bankToken" }
        $pending = Invoke-RestMethod -Uri "$baseUrl/payments/bank/pending-review" -Headers $headers -Method Get

        if ($pending.success) {
            Write-Success "Retrieved $($pending.count) pending payments"
            Add-TestResult "Bank" "View Pending Payments" $true "$($pending.count) payments"
        }
        else {
            Write-Failure "Failed to retrieve pending payments"
            Add-TestResult "Bank" "View Pending Payments" $false $pending.error
        }
    }
    catch {
        Write-Failure "Pending payments retrieval error: $($_.Exception.Message)"
        Add-TestResult "Bank" "View Pending Payments" $false $_.Exception.Message
    }
}
else {
    Add-TestResult "Bank" "Login" $false "Authentication failed"
}

# Test 6: Bank Review Documents
Write-Section "Test 6: Bank Review Payment Documents"

if ($bankToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $bankToken" }
        
        # Get payment details to find document IDs
        $paymentDetails = Invoke-RestMethod -Uri "$baseUrl/payments/$($script:testPaymentId)" `
            -Headers $headers `
            -Method Get

        if ($paymentDetails.success -and $paymentDetails.payment.documents) {
            $documentId = $paymentDetails.payment.documents[0].document_id
            
            $reviewData = @{
                documentId = $documentId
                reviewStatus = "APPROVED"
                reviewNotes = "Document verified and approved"
            } | ConvertTo-Json

            $result = Invoke-RestMethod -Uri "$baseUrl/payments/bank/$($script:testPaymentId)/documents/review" `
                -Headers $headers `
                -Method Post `
                -Body $reviewData `
                -ContentType "application/json"

            if ($result.success) {
                Write-Success "Document reviewed and approved"
                Add-TestResult "Bank" "Review Documents" $true "Document approved"
            }
            else {
                Write-Failure "Document review failed"
                Add-TestResult "Bank" "Review Documents" $false $result.error
            }
        }
        else {
            Write-Info "No documents found for review"
            Add-TestResult "Bank" "Review Documents" $false "No documents available"
        }
    }
    catch {
        Write-Failure "Document review error: $($_.Exception.Message)"
        Add-TestResult "Bank" "Review Documents" $false $_.Exception.Message
    }
}

# Test 7: Bank Approve Payment
Write-Section "Test 7: Bank Approve Payment"

if ($bankToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $bankToken" }
        
        $approvalData = @{
            bankReference = "BANK-REF-" + (Get-Date -Format "yyyyMMddHHmmss")
            notes = "Payment approved after document verification"
        } | ConvertTo-Json

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/bank/$($script:testPaymentId)/approve" `
            -Headers $headers `
            -Method Post `
            -Body $approvalData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Success "Payment approved by bank"
            Write-Info "Bank Reference: $($result.payment.bank_reference)"
            Add-TestResult "Bank" "Approve Payment" $true "Payment approved"
        }
        else {
            Write-Failure "Payment approval failed: $($result.error)"
            Add-TestResult "Bank" "Approve Payment" $false $result.error
        }
    }
    catch {
        Write-Failure "Payment approval error: $($_.Exception.Message)"
        Add-TestResult "Bank" "Approve Payment" $false $_.Exception.Message
    }
}

# Test 8: NBE View Pending FX Approvals
Write-Section "Test 8: NBE View Pending FX Approvals"

$nbeToken = Get-AuthToken -username "nbe1" -password "password123"

if ($nbeToken) {
    Write-Success "NBE logged in successfully"
    
    try {
        $headers = @{ Authorization = "Bearer $nbeToken" }
        $pending = Invoke-RestMethod -Uri "$baseUrl/payments/nbe/pending-fx-approval" -Headers $headers -Method Get

        if ($pending.success) {
            Write-Success "Retrieved $($pending.count) pending FX approvals"
            Add-TestResult "NBE" "View Pending FX" $true "$($pending.count) approvals"
        }
        else {
            Write-Failure "Failed to retrieve pending FX approvals"
            Add-TestResult "NBE" "View Pending FX" $false $pending.error
        }
    }
    catch {
        Write-Failure "FX approvals retrieval error: $($_.Exception.Message)"
        Add-TestResult "NBE" "View Pending FX" $false $_.Exception.Message
    }
}
else {
    Add-TestResult "NBE" "Login" $false "Authentication failed"
}

# Test 9: NBE Approve Foreign Exchange
Write-Section "Test 9: NBE Approve Foreign Exchange"

if ($nbeToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $nbeToken" }
        
        $fxData = @{
            exchangeRate = 57.50
            nbeReference = "NBE-FX-" + (Get-Date -Format "yyyyMMddHHmmss")
            notes = "Foreign exchange approved at official rate"
        } | ConvertTo-Json

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/nbe/$($script:testPaymentId)/fx/approve" `
            -Headers $headers `
            -Method Post `
            -Body $fxData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Success "Foreign exchange approved"
            Write-Info "Exchange Rate: $($result.fxDetails.exchangeRate)"
            Write-Info "Amount USD: $($result.fxDetails.amountUsd)"
            Write-Info "Amount ETB: $($result.fxDetails.amountEtb)"
            Add-TestResult "NBE" "Approve FX" $true "FX approved"
        }
        else {
            Write-Failure "FX approval failed: $($result.error)"
            Add-TestResult "NBE" "Approve FX" $false $result.error
        }
    }
    catch {
        Write-Failure "FX approval error: $($_.Exception.Message)"
        Add-TestResult "NBE" "Approve FX" $false $_.Exception.Message
    }
}

# Test 10: NBE FX Statistics
Write-Section "Test 10: NBE FX Statistics"

if ($nbeToken) {
    try {
        $headers = @{ Authorization = "Bearer $nbeToken" }
        $stats = Invoke-RestMethod -Uri "$baseUrl/payments/nbe/statistics" -Headers $headers -Method Get

        if ($stats.success) {
            Write-Success "Retrieved FX statistics"
            Write-Info "Total Payments: $($stats.statistics.total_payments)"
            Write-Info "Approved FX: $($stats.statistics.approved_fx)"
            Write-Info "Avg Exchange Rate: $($stats.statistics.avg_exchange_rate)"
            Add-TestResult "NBE" "FX Statistics" $true "Stats retrieved"
        }
        else {
            Write-Failure "Failed to retrieve FX statistics"
            Add-TestResult "NBE" "FX Statistics" $false $stats.error
        }
    }
    catch {
        Write-Failure "FX statistics retrieval error: $($_.Exception.Message)"
        Add-TestResult "NBE" "FX Statistics" $false $_.Exception.Message
    }
}

# Test 11: Bank Process Payment
Write-Section "Test 11: Bank Process Payment"

if ($bankToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $bankToken" }
        
        $processData = @{
            swiftReference = "SWIFT-" + (Get-Date -Format "yyyyMMddHHmmss")
            transactionDetails = @{
                fromAccount = "CBE-ACCOUNT-001"
                toAccount = "EXPORTER-ACCOUNT-001"
            }
        } | ConvertTo-Json -Depth 3

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/bank/$($script:testPaymentId)/process" `
            -Headers $headers `
            -Method Post `
            -Body $processData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Success "Payment processing initiated"
            Add-TestResult "Bank" "Process Payment" $true "Processing started"
        }
        else {
            Write-Failure "Payment processing failed: $($result.error)"
            Add-TestResult "Bank" "Process Payment" $false $result.error
        }
    }
    catch {
        Write-Failure "Payment processing error: $($_.Exception.Message)"
        Add-TestResult "Bank" "Process Payment" $false $_.Exception.Message
    }
}

# Test 12: Bank Complete Payment
Write-Section "Test 12: Bank Complete Payment"

if ($bankToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $bankToken" }
        
        $completeData = @{
            transactionReference = "TXN-" + (Get-Date -Format "yyyyMMddHHmmss")
            completionNotes = "Payment successfully transferred to exporter account"
        } | ConvertTo-Json

        $result = Invoke-RestMethod -Uri "$baseUrl/payments/bank/$($script:testPaymentId)/complete" `
            -Headers $headers `
            -Method Post `
            -Body $completeData `
            -ContentType "application/json"

        if ($result.success) {
            Write-Success "Payment completed successfully"
            Write-Info "Status: $($result.payment.status)"
            Add-TestResult "Bank" "Complete Payment" $true "Payment completed"
        }
        else {
            Write-Failure "Payment completion failed: $($result.error)"
            Add-TestResult "Bank" "Complete Payment" $false $result.error
        }
    }
    catch {
        Write-Failure "Payment completion error: $($_.Exception.Message)"
        Add-TestResult "Bank" "Complete Payment" $false $_.Exception.Message
    }
}

# Test 13: Exporter View Completed Payment
Write-Section "Test 13: Exporter View Completed Payment"

if ($exporterToken -and $script:testPaymentId) {
    try {
        $headers = @{ Authorization = "Bearer $exporterToken" }
        $payment = Invoke-RestMethod -Uri "$baseUrl/payments/$($script:testPaymentId)" -Headers $headers -Method Get

        if ($payment.success) {
            Write-Success "Retrieved payment details"
            Write-Info "Status: $($payment.payment.status)"
            Write-Info "Amount: $($payment.payment.amount) $($payment.payment.currency)"
            Write-Info "Documents: $($payment.payment.documents.Count)"
            Write-Info "Transactions: $($payment.payment.transactions.Count)"
            Add-TestResult "Exporter" "View Payment Details" $true "Details retrieved"
        }
        else {
            Write-Failure "Failed to retrieve payment details"
            Add-TestResult "Exporter" "View Payment Details" $false $payment.error
        }
    }
    catch {
        Write-Failure "Payment details retrieval error: $($_.Exception.Message)"
        Add-TestResult "Exporter" "View Payment Details" $false $_.Exception.Message
    }
}

# Summary Report
Write-Section "Test Summary"

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Passed }).Count
$failedTests = $totalTests - $passedTests
$passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })

# Group by category
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

# Save results to file
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = "PAYMENT-TEST-RESULTS-$timestamp.md"

$report = "# Payment System Test Results`n"
$report += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$report += "## Summary`n"
$report += "- Total Tests: $totalTests`n"
$report += "- Passed: $passedTests`n"
$report += "- Failed: $failedTests`n"
$report += "- Pass Rate: $passRate%`n`n"
$report += "## Test Results by Category`n"

$testResults | Group-Object Category | ForEach-Object {
    $categoryPassed = ($_.Group | Where-Object { $_.Passed }).Count
    $categoryTotal = $_.Group.Count
    $categoryRate = [math]::Round(($categoryPassed / $categoryTotal) * 100, 2)
    
    $report += "`n### $($_.Name) ($categoryPassed/$categoryTotal - $categoryRate%)`n`n"
    $_.Group | ForEach-Object {
        $status = if ($_.Passed) { "PASS" } else { "FAIL" }
        $report += "- [$status] **$($_.Test)**"
        if ($_.Details) {
            $report += " - $($_.Details)"
        }
        $report += "`n"
    }
}

$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "`nDetailed report saved to: $reportFile" -ForegroundColor Cyan
