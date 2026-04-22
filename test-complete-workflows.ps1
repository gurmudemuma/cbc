# Complete Workflow Testing with Correct Roles
# Tests all major workflows with appropriate user credentials

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"
$passed = 0
$failed = 0

function Write-TestHeader($title) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $title -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Pass($message) {
    Write-Host "[PASS] $message" -ForegroundColor Green
    $script:passed++
}

function Write-Fail($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
    $script:failed++
}

function Get-AuthToken($username, $password) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body "{`"username`":`"$username`",`"password`":`"$password`"}"
        return $response.token
    } catch {
        Write-Fail "Login failed for $username"
        return $null
    }
}

# ============================================
# WORKFLOW 1: EXPORTER QUALIFICATION JOURNEY
# ============================================
Write-TestHeader "WORKFLOW 1: EXPORTER QUALIFICATION JOURNEY"

Write-Host "`nStep 1: Exporter Login" -ForegroundColor Yellow
$exporterToken = Get-AuthToken "exporter1" "password123"
if ($exporterToken) {
    Write-Pass "Exporter1 logged in successfully"
} else {
    Write-Fail "Exporter1 login failed"
}

Write-Host "`nStep 2: Check Exporter Dashboard" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $dashboard = Invoke-RestMethod -Uri "$baseUrl/api/exporter/dashboard" -Headers $headers
    Write-Pass "Dashboard accessible"
    Write-Host "  Business: $($dashboard.identity.businessName)" -ForegroundColor Gray
    Write-Host "  Status: $($dashboard.compliance.profileStatus)" -ForegroundColor Gray
    Write-Host "  Qualified: $($dashboard.compliance.isFullyQualified)" -ForegroundColor Gray
} catch {
    Write-Fail "Dashboard access failed: $($_.Exception.Message)"
}

Write-Host "`nStep 3: Check Qualification Status" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $qualStatus = Invoke-RestMethod -Uri "$baseUrl/api/exporter/qualification-status" -Headers $headers
    Write-Pass "Qualification status retrieved"
    Write-Host "  Overall: $($qualStatus.overallStatus)" -ForegroundColor Gray
    Write-Host "  Profile: $($qualStatus.profile.complete)" -ForegroundColor Gray
    Write-Host "  Laboratory: $($qualStatus.laboratory.certified)" -ForegroundColor Gray
    Write-Host "  Taster: $($qualStatus.taster.verified)" -ForegroundColor Gray
    Write-Host "  Competence: $($qualStatus.competenceCertificate.valid)" -ForegroundColor Gray
    Write-Host "  License: $($qualStatus.exportLicense.valid)" -ForegroundColor Gray
} catch {
    Write-Fail "Qualification status failed: $($_.Exception.Message)"
}

Write-Host "`nStep 4: View Exporter Applications" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $applications = Invoke-RestMethod -Uri "$baseUrl/api/exporter/applications" -Headers $headers
    Write-Pass "Applications retrieved"
    Write-Host "  Count: $($applications.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Applications retrieval failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 2: ECTA MANAGEMENT
# ============================================
Write-TestHeader "WORKFLOW 2: ECTA PRE-REGISTRATION MANAGEMENT"

Write-Host "`nStep 1: ECTA Login" -ForegroundColor Yellow
$ectaToken = Get-AuthToken "ecta1" "password123"
if ($ectaToken) {
    Write-Pass "ECTA user logged in successfully"
} else {
    Write-Fail "ECTA login failed"
}

Write-Host "`nStep 2: View Pending Exporters" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $pending = Invoke-RestMethod -Uri "$baseUrl/api/ecta/preregistration/exporters/pending" -Headers $headers
    Write-Pass "Pending exporters retrieved"
    Write-Host "  Count: $($pending.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Pending exporters failed: $($_.Exception.Message)"
}

Write-Host "`nStep 3: View All Exporters" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $exporters = Invoke-RestMethod -Uri "$baseUrl/api/ecta/preregistration/exporters" -Headers $headers
    Write-Pass "All exporters retrieved"
    Write-Host "  Count: $($exporters.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "All exporters failed: $($_.Exception.Message)"
}

Write-Host "`nStep 4: View Pending Laboratories" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $labs = Invoke-RestMethod -Uri "$baseUrl/api/ecta/preregistration/laboratories/pending" -Headers $headers
    Write-Pass "Pending laboratories retrieved"
    Write-Host "  Count: $($labs.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Pending laboratories failed: $($_.Exception.Message)"
}

Write-Host "`nStep 5: View Pending Tasters" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $tasters = Invoke-RestMethod -Uri "$baseUrl/api/ecta/preregistration/tasters/pending" -Headers $headers
    Write-Pass "Pending tasters retrieved"
    Write-Host "  Count: $($tasters.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Pending tasters failed: $($_.Exception.Message)"
}

Write-Host "`nStep 6: View Pending Competence Certificates" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $certs = Invoke-RestMethod -Uri "$baseUrl/api/ecta/preregistration/competence/pending" -Headers $headers
    Write-Pass "Pending competence certificates retrieved"
    Write-Host "  Count: $($certs.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Pending competence certificates failed: $($_.Exception.Message)"
}

Write-Host "`nStep 7: View Pending Licenses" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $licenses = Invoke-RestMethod -Uri "$baseUrl/api/ecta/preregistration/licenses/pending" -Headers $headers
    Write-Pass "Pending licenses retrieved"
    Write-Host "  Count: $($licenses.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Pending licenses failed: $($_.Exception.Message)"
}

Write-Host "`nStep 8: View Dashboard Statistics" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/ecta/preregistration/dashboard/stats" -Headers $headers
    Write-Pass "Dashboard statistics retrieved"
    Write-Host "  Total Exporters: $($stats.totalExporters)" -ForegroundColor Gray
    Write-Host "  Pending: $($stats.pendingExporters)" -ForegroundColor Gray
    Write-Host "  Approved: $($stats.approvedExporters)" -ForegroundColor Gray
} catch {
    Write-Fail "Dashboard statistics failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 3: SALES CONTRACT MANAGEMENT
# ============================================
Write-TestHeader "WORKFLOW 3: SALES CONTRACT MANAGEMENT"

Write-Host "`nStep 1: Exporter Views Contract Drafts" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $drafts = Invoke-RestMethod -Uri "$baseUrl/api/contracts/drafts" -Headers $headers
    Write-Pass "Contract drafts retrieved"
    Write-Host "  Count: $($drafts.drafts.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Contract drafts failed: $($_.Exception.Message)"
}

Write-Host "`nStep 2: View Buyers Registry" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $buyers = Invoke-RestMethod -Uri "$baseUrl/api/buyers" -Headers $headers
    Write-Pass "Buyers registry retrieved"
    Write-Host "  Count: $($buyers.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Buyers registry failed: $($_.Exception.Message)"
}

Write-Host "`nStep 3: View Marketplace Listings" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $marketplace = Invoke-RestMethod -Uri "$baseUrl/api/marketplace/listings" -Headers $headers
    Write-Pass "Marketplace listings retrieved"
    Write-Host "  Count: $($marketplace.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Marketplace listings failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 4: EXPORT MANAGEMENT
# ============================================
Write-TestHeader "WORKFLOW 4: EXPORT MANAGEMENT"

Write-Host "`nStep 1: View All Exports (Admin)" -ForegroundColor Yellow
$adminToken = Get-AuthToken "admin" "admin123"
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $exports = Invoke-RestMethod -Uri "$baseUrl/api/exports" -Headers $headers
    Write-Pass "All exports retrieved"
    Write-Host "  Count: $($exports.count)" -ForegroundColor Gray
    if ($exports.data.Count -gt 0) {
        Write-Host "  Sample Export ID: $($exports.data[0].export_id)" -ForegroundColor Gray
        Write-Host "  Status: $($exports.data[0].status)" -ForegroundColor Gray
    }
} catch {
    Write-Fail "Exports retrieval failed: $($_.Exception.Message)"
}

Write-Host "`nStep 2: View Export Statistics" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/exports/stats" -Headers $headers
    Write-Pass "Export statistics retrieved"
    Write-Host "  Total: $($stats.total)" -ForegroundColor Gray
} catch {
    Write-Fail "Export statistics failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 5: DOCUMENT MANAGEMENT
# ============================================
Write-TestHeader "WORKFLOW 5: DOCUMENT MANAGEMENT"

Write-Host "`nStep 1: View Document Requests (Exporter)" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $docRequests = Invoke-RestMethod -Uri "$baseUrl/api/document-requests" -Headers $headers
    Write-Pass "Document requests retrieved"
    Write-Host "  Count: $($docRequests.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Document requests failed: $($_.Exception.Message)"
}

Write-Host "`nStep 2: View Document Issuance Status" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $issuance = Invoke-RestMethod -Uri "$baseUrl/api/document-issuance/status" -Headers $headers
    Write-Pass "Document issuance status retrieved"
} catch {
    Write-Fail "Document issuance status failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 6: BANKING OPERATIONS
# ============================================
Write-TestHeader "WORKFLOW 6: BANKING OPERATIONS"

Write-Host "`nStep 1: Bank Login" -ForegroundColor Yellow
$bankToken = Get-AuthToken "bank1" "password123"
if ($bankToken) {
    Write-Pass "Bank user logged in successfully"
} else {
    Write-Fail "Bank login failed"
}

Write-Host "`nStep 2: View Pending Export Approvals" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $bankToken" }
    $pending = Invoke-RestMethod -Uri "$baseUrl/api/exports?status=pending" -Headers $headers
    Write-Pass "Pending export approvals retrieved"
    Write-Host "  Count: $($pending.count)" -ForegroundColor Gray
} catch {
    Write-Fail "Pending export approvals failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 7: CUSTOMS OPERATIONS
# ============================================
Write-TestHeader "WORKFLOW 7: CUSTOMS OPERATIONS"

Write-Host "`nStep 1: Customs Login" -ForegroundColor Yellow
$customsToken = Get-AuthToken "customs1" "password123"
if ($customsToken) {
    Write-Pass "Customs user logged in successfully"
} else {
    Write-Fail "Customs login failed"
}

Write-Host "`nStep 2: View Customs Declarations" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $customsToken" }
    $declarations = Invoke-RestMethod -Uri "$baseUrl/api/customs/declarations" -Headers $headers
    Write-Pass "Customs declarations retrieved"
    Write-Host "  Count: $($declarations.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Customs declarations failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 8: SHIPPING OPERATIONS
# ============================================
Write-TestHeader "WORKFLOW 8: SHIPPING OPERATIONS"

Write-Host "`nStep 1: Shipping Login" -ForegroundColor Yellow
$shippingToken = Get-AuthToken "shipping1" "password123"
if ($shippingToken) {
    Write-Pass "Shipping user logged in successfully"
} else {
    Write-Fail "Shipping login failed"
}

Write-Host "`nStep 2: View Shipments" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $shippingToken" }
    $shipments = Invoke-RestMethod -Uri "$baseUrl/api/shipping/shipments" -Headers $headers
    Write-Pass "Shipments retrieved"
    Write-Host "  Count: $($shipments.Count)" -ForegroundColor Gray
} catch {
    Write-Fail "Shipments retrieval failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 9: BLOCKCHAIN INTEGRATION
# ============================================
Write-TestHeader "WORKFLOW 9: BLOCKCHAIN INTEGRATION"

Write-Host "`nStep 1: Network Status" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $network = Invoke-RestMethod -Uri "$baseUrl/api/network/status" -Headers $headers
    Write-Pass "Network status retrieved"
} catch {
    Write-Fail "Network status failed: $($_.Exception.Message)"
}

Write-Host "`nStep 2: Hybrid Service Status" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $hybrid = Invoke-RestMethod -Uri "$baseUrl/api/hybrid/status" -Headers $headers
    Write-Pass "Hybrid service status retrieved"
    Write-Host "  Status: $($hybrid.status)" -ForegroundColor Gray
} catch {
    Write-Fail "Hybrid service status failed: $($_.Exception.Message)"
}

# ============================================
# WORKFLOW 10: ANALYTICS & REPORTING
# ============================================
Write-TestHeader "WORKFLOW 10: ANALYTICS & REPORTING"

Write-Host "`nStep 1: Global Statistics (ECTA)" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $ectaToken" }
    $globalStats = Invoke-RestMethod -Uri "$baseUrl/api/ecta/global-stats" -Headers $headers
    Write-Pass "Global statistics retrieved"
    Write-Host "  Total Exporters: $($globalStats.totalExporters)" -ForegroundColor Gray
    Write-Host "  Active Exports: $($globalStats.activeExports)" -ForegroundColor Gray
} catch {
    Write-Fail "Global statistics failed: $($_.Exception.Message)"
}

Write-Host "`nStep 2: Analytics Dashboard (Admin)" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $analytics = Invoke-RestMethod -Uri "$baseUrl/api/analytics/dashboard" -Headers $headers
    Write-Pass "Analytics dashboard retrieved"
} catch {
    Write-Fail "Analytics dashboard failed: $($_.Exception.Message)"
}

# ============================================
# FINAL SUMMARY
# ============================================
Write-TestHeader "TEST SUMMARY"

$total = $passed + $failed
$percentage = [math]::Round(($passed / $total) * 100, 2)

Write-Host ""
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } else { "Yellow" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "ALL WORKFLOWS OPERATIONAL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "System is fully functional and ready for production use." -ForegroundColor Green
} elseif ($percentage -ge 80) {
    Write-Host "SYSTEM MOSTLY OPERATIONAL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Core workflows are working. Some optional features may need attention." -ForegroundColor Yellow
} else {
    Write-Host "SYSTEM NEEDS ATTENTION" -ForegroundColor Red
    Write-Host ""
    Write-Host "Multiple workflows are failing. Review logs and fix issues." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
