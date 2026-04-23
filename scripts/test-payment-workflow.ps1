# Test Complete Payment Workflow
# From Exporter Registration to Payment Transaction on Ledger

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COFFEE EXPORT PAYMENT WORKFLOW TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Exporter
Write-Host "[1/8] Logging in as exporter1..." -ForegroundColor Yellow
$loginBody = @{
    username = 'exporter1'
    password = 'password123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  User: $($loginResponse.user.username)" -ForegroundColor Gray
    Write-Host "  Role: $($loginResponse.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
}

# Step 2: Check Exporter Profile
Write-Host "`n[2/8] Checking exporter profile..." -ForegroundColor Yellow
try {
    $profileResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/exporter/profile' -Method Get -Headers $headers
    Write-Host "✓ Profile retrieved" -ForegroundColor Green
    Write-Host "  Business: $($profileResponse.profile.business_name)" -ForegroundColor Gray
    Write-Host "  TIN: $($profileResponse.profile.tin)" -ForegroundColor Gray
    Write-Host "  Status: $($profileResponse.profile.status)" -ForegroundColor Gray
    $exporterId = $profileResponse.profile.exporter_id
} catch {
    Write-Host "✗ Profile check failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Check Qualifications
Write-Host "`n[3/8] Checking qualifications..." -ForegroundColor Yellow
try {
    $qualResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/exporter/qualifications' -Method Get -Headers $headers
    Write-Host "✓ Qualifications retrieved" -ForegroundColor Green
    Write-Host "  License: $($qualResponse.qualifications.license_number) - $($qualResponse.qualifications.license_status)" -ForegroundColor Gray
    Write-Host "  Certificate: $($qualResponse.qualifications.certificate_number) - $($qualResponse.qualifications.certificate_status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Qualifications check failed: $_" -ForegroundColor Red
}

# Step 4: Check Existing Exports
Write-Host "`n[4/8] Checking existing exports..." -ForegroundColor Yellow
try {
    $exportsResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/exports' -Method Get -Headers $headers
    Write-Host "✓ Exports retrieved: $($exportsResponse.exports.Count) exports found" -ForegroundColor Green
    
    if ($exportsResponse.exports.Count -gt 0) {
        $export = $exportsResponse.exports[0]
        Write-Host "  Using Export ID: $($export.export_id)" -ForegroundColor Gray
        Write-Host "  Coffee Type: $($export.coffee_type)" -ForegroundColor Gray
        Write-Host "  Quantity: $($export.quantity) kg" -ForegroundColor Gray
        Write-Host "  Destination: $($export.destination_country)" -ForegroundColor Gray
        $exportId = $export.export_id
    } else {
        Write-Host "  No exports found - would need to create one first" -ForegroundColor Yellow
        $exportId = $null
    }
} catch {
    Write-Host "✗ Exports check failed: $_" -ForegroundColor Red
    $exportId = $null
}

# Step 5: Initiate Payment
if ($exportId) {
    Write-Host "`n[5/8] Initiating payment for export..." -ForegroundColor Yellow
    $paymentBody = @{
        exportId = $exportId
        paymentMethod = 'LC'
        amount = 50000.00
        currency = 'USD'
        paymentTerms = 'Net 30'
        lcDetails = @{
            lcNumber = "LC-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
            issuingBank = 'Commercial Bank of Ethiopia'
            expiryDate = (Get-Date).AddDays(90).ToString('yyyy-MM-dd')
        }
        notes = 'Test payment for workflow verification'
    } | ConvertTo-Json -Depth 5

    try {
        $paymentResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/payments/initiate' -Method Post -Body $paymentBody -Headers $headers
        Write-Host "✓ Payment initiated successfully" -ForegroundColor Green
        Write-Host "  Payment ID: $($paymentResponse.payment.paymentId)" -ForegroundColor Gray
        Write-Host "  Amount: $($paymentResponse.payment.amount) $($paymentResponse.payment.currency)" -ForegroundColor Gray
        Write-Host "  Method: $($paymentResponse.payment.paymentMethod)" -ForegroundColor Gray
        Write-Host "  Status: $($paymentResponse.payment.status)" -ForegroundColor Gray
        $paymentId = $paymentResponse.payment.paymentId
    } catch {
        Write-Host "✗ Payment initiation failed: $_" -ForegroundColor Red
        Write-Host "  Response: $($_.Exception.Response)" -ForegroundColor Red
        $paymentId = $null
    }
} else {
    Write-Host "`n[5/8] Skipping payment initiation - no export available" -ForegroundColor Yellow
    $paymentId = $null
}

# Step 6: Submit Payment Documents
if ($paymentId) {
    Write-Host "`n[6/8] Submitting payment documents..." -ForegroundColor Yellow
    $documentsBody = @{
        documents = @(
            @{
                documentType = 'COMMERCIAL_INVOICE'
                documentName = "Invoice-$(Get-Date -Format 'yyyyMMdd').pdf"
                documentUrl = 'https://storage.example.com/invoices/test.pdf'
                documentHash = 'abc123hash'
            },
            @{
                documentType = 'BILL_OF_LADING'
                documentName = "BOL-$(Get-Date -Format 'yyyyMMdd').pdf"
                documentUrl = 'https://storage.example.com/bol/test.pdf'
                documentHash = 'def456hash'
            },
            @{
                documentType = 'CERTIFICATE_OF_ORIGIN'
                documentName = "COO-$(Get-Date -Format 'yyyyMMdd').pdf"
                documentUrl = 'https://storage.example.com/coo/test.pdf'
                documentHash = 'ghi789hash'
            }
        )
    } | ConvertTo-Json -Depth 5

    try {
        $docsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/payments/$paymentId/documents" -Method Post -Body $documentsBody -Headers $headers
        Write-Host "✓ Documents submitted successfully" -ForegroundColor Green
        Write-Host "  Documents count: $($docsResponse.documents.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Document submission failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "`n[6/8] Skipping document submission - no payment available" -ForegroundColor Yellow
}

# Step 7: Check Payment Details
if ($paymentId) {
    Write-Host "`n[7/8] Retrieving payment details..." -ForegroundColor Yellow
    try {
        $detailsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/payments/$paymentId" -Method Get -Headers $headers
        Write-Host "✓ Payment details retrieved" -ForegroundColor Green
        Write-Host "  Payment ID: $($detailsResponse.payment.payment_id)" -ForegroundColor Gray
        Write-Host "  Status: $($detailsResponse.payment.status)" -ForegroundColor Gray
        Write-Host "  Amount: $($detailsResponse.payment.amount) $($detailsResponse.payment.currency)" -ForegroundColor Gray
        Write-Host "  Documents: $($detailsResponse.payment.documents.Count)" -ForegroundColor Gray
        Write-Host "  LC Number: $($detailsResponse.payment.lc_number)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Payment details retrieval failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "`n[7/8] Skipping payment details - no payment available" -ForegroundColor Yellow
}

# Step 8: Check Payment Statistics
Write-Host "`n[8/8] Checking payment statistics..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/payments/statistics' -Method Get -Headers $headers
    Write-Host "✓ Statistics retrieved" -ForegroundColor Green
    Write-Host "  Total Payments: $($statsResponse.statistics.total_payments)" -ForegroundColor Gray
    Write-Host "  Completed: $($statsResponse.statistics.completed_payments)" -ForegroundColor Gray
    Write-Host "  Pending: $($statsResponse.statistics.pending_payments)" -ForegroundColor Gray
    Write-Host "  Total Received: `$$($statsResponse.statistics.total_received)" -ForegroundColor Gray
    Write-Host "  Pending Amount: `$$($statsResponse.statistics.pending_amount)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Statistics retrieval failed: $_" -ForegroundColor Red
}

# Check Blockchain/Ledger Storage
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BLOCKCHAIN LEDGER VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nChecking if payment data is stored in blockchain..." -ForegroundColor Yellow
Write-Host "Note: Payment transactions are stored in PostgreSQL (dual-write mode)" -ForegroundColor Gray
Write-Host "      Blockchain integration requires additional chaincode invocation" -ForegroundColor Gray

# Check PostgreSQL for payment records
Write-Host "`nVerifying PostgreSQL storage..." -ForegroundColor Yellow
try {
    $paymentsCheck = Invoke-RestMethod -Uri 'http://localhost:3000/api/payments' -Method Get -Headers $headers
    Write-Host "✓ PostgreSQL verification successful" -ForegroundColor Green
    Write-Host "  Total payments in database: $($paymentsCheck.payments.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ PostgreSQL verification failed: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  WORKFLOW TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
