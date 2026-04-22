# Seed Payment Test Data Script
# Creates necessary test data for payment workflow testing

$baseUrl = "http://localhost:3000/api"

Write-Host "`n=== Seeding Payment Test Data ===" -ForegroundColor Cyan

# Login as exporter
Write-Host "`nLogging in as exporter..." -ForegroundColor Yellow
$loginData = @{
    username = "exporter1"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method Post `
    -Body $loginData `
    -ContentType "application/json"

$exporterToken = $response.token
$exporterUserId = $response.user.id
Write-Host "  [OK] Logged in as exporter1 (User ID: $exporterUserId)" -ForegroundColor Green

# Check if exporter profile exists
Write-Host "`nChecking exporter profile..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $exporterToken" }

try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/exporter/profile" -Headers $headers -Method Get
    Write-Host "  [OK] Exporter profile exists: $($profile.profile.business_name)" -ForegroundColor Green
    $exporterId = $profile.profile.exporter_id
}
catch {
    Write-Host "  [INFO] No exporter profile found, creating one..." -ForegroundColor Yellow
    
    # Create exporter profile
    $profileData = @{
        businessName = "Test Coffee Exporter Ltd"
        tin = "TIN-TEST-001"
        licenseNumber = "LIC-TEST-001"
        businessAddress = "123 Coffee Street, Addis Ababa"
        contactPerson = "John Doe"
        contactEmail = "john@testexporter.com"
        contactPhone = "+251911234567"
        bankName = "Commercial Bank of Ethiopia"
        bankAccountNumber = "1234567890"
        bankSwiftCode = "CBETETAA"
    } | ConvertTo-Json

    try {
        $newProfile = Invoke-RestMethod -Uri "$baseUrl/exporter/profile" `
            -Headers $headers `
            -Method Post `
            -Body $profileData `
            -ContentType "application/json"
        
        Write-Host "  [OK] Exporter profile created" -ForegroundColor Green
        $exporterId = $newProfile.profile.exporter_id
    }
    catch {
        Write-Host "  [FAIL] Failed to create profile: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Create a test export
Write-Host "`nCreating test export..." -ForegroundColor Yellow

$exportData = @{
    coffeeType = "Arabica"
    quantity = 1000
    unit = "kg"
    destinationCountry = "United States"
    destinationPort = "New York"
    estimatedValue = 50000.00
    currency = "USD"
    notes = "Test export for payment workflow"
} | ConvertTo-Json

try {
    $export = Invoke-RestMethod -Uri "$baseUrl/exports" `
        -Headers $headers `
        -Method Post `
        -Body $exportData `
        -ContentType "application/json"
    
    Write-Host "  [OK] Export created: $($export.export.export_id)" -ForegroundColor Green
    $exportId = $export.export.export_id
}
catch {
    Write-Host "  [FAIL] Failed to create export: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get existing exports
    try {
        $exports = Invoke-RestMethod -Uri "$baseUrl/exports" -Headers $headers -Method Get
        if ($exports.exports -and $exports.exports.Count -gt 0) {
            $exportId = $exports.exports[0].export_id
            Write-Host "  [INFO] Using existing export: $exportId" -ForegroundColor Yellow
        }
        else {
            Write-Host "  [FAIL] No exports available" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "  [FAIL] Cannot retrieve exports: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Create a test buyer
Write-Host "`nCreating test buyer..." -ForegroundColor Yellow

$buyerData = @{
    companyName = "Test Coffee Importers Inc"
    country = "United States"
    city = "New York"
    address = "456 Import Avenue"
    contactPerson = "Jane Smith"
    contactEmail = "jane@testimporter.com"
    contactPhone = "+12125551234"
    taxId = "US-TAX-001"
    businessType = "Importer"
} | ConvertTo-Json

try {
    $buyer = Invoke-RestMethod -Uri "$baseUrl/buyers" `
        -Headers $headers `
        -Method Post `
        -Body $buyerData `
        -ContentType "application/json"
    
    Write-Host "  [OK] Buyer created: $($buyer.buyer.buyer_id)" -ForegroundColor Green
    $buyerId = $buyer.buyer.buyer_id
}
catch {
    Write-Host "  [INFO] Buyer might already exist: $($_.Exception.Message)" -ForegroundColor Yellow
    
    # Try to get existing buyers
    try {
        $buyers = Invoke-RestMethod -Uri "$baseUrl/buyers" -Headers $headers -Method Get
        if ($buyers.buyers -and $buyers.buyers.Count -gt 0) {
            $buyerId = $buyers.buyers[0].buyer_id
            Write-Host "  [INFO] Using existing buyer: $buyerId" -ForegroundColor Yellow
        }
        else {
            $buyerId = $null
            Write-Host "  [WARN] No buyers available, payment will be created without buyer" -ForegroundColor Yellow
        }
    }
    catch {
        $buyerId = $null
        Write-Host "  [WARN] Cannot retrieve buyers: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Test Data Summary ===" -ForegroundColor Cyan
Write-Host "Exporter ID: $exporterId" -ForegroundColor White
Write-Host "Export ID: $exportId" -ForegroundColor White
if ($buyerId) {
    Write-Host "Buyer ID: $buyerId" -ForegroundColor White
}
Write-Host "`nTest data seeding complete! You can now run payment workflow tests." -ForegroundColor Green
