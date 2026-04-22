# Seed Payment Test Data Directly in Database

Write-Host "`n=== Seeding Payment Test Data (Direct DB) ===" -ForegroundColor Cyan

# Create exporter profile
Write-Host "`nCreating exporter profile..." -ForegroundColor Yellow

$createProfile = @"
INSERT INTO exporter_profiles (
    exporter_id, user_id, business_name, tin, registration_number,
    business_type, minimum_capital, office_address, city, region,
    contact_person, email, phone, status,
    created_at, updated_at
) VALUES (
    gen_random_uuid(), 'exporter1', 'Test Coffee Exporter Ltd', 'TIN-TEST-001', 'REG-TEST-001',
    'PRIVATE', 500000.00, '123 Coffee Street, Addis Ababa', 'Addis Ababa', 'Addis Ababa',
    'John Doe', 'john@testexporter.com', '+251911234567', 'ACTIVE',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP
RETURNING exporter_id;
"@

$result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $createProfile 2>&1

if ($LASTEXITCODE -eq 0) {
    $exporterId = $result.Trim()
    Write-Host "  [OK] Exporter profile created/updated: $exporterId" -ForegroundColor Green
}
else {
    Write-Host "  [FAIL] Failed to create exporter profile" -ForegroundColor Red
    Write-Host $result
    exit 1
}

# Get exporter_id
$getExporterId = "SELECT exporter_id FROM exporter_profiles WHERE user_id = 'exporter1';"
$exporterId = (docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $getExporterId 2>&1 | Select-String -Pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}").Matches[0].Value
Write-Host "  Exporter ID: $exporterId" -ForegroundColor Gray

# Create test export
Write-Host "`nCreating test export..." -ForegroundColor Yellow

$createExport = @"
INSERT INTO exports (
    export_id, exporter_id, coffee_type, quantity,
    destination_country, estimated_value,
    status, created_at, updated_at
) VALUES (
    gen_random_uuid(), '$exporterId', 'Arabica', 1000,
    'United States', 50000.00,
    'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
RETURNING export_id;
"@

$result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $createExport 2>&1

if ($LASTEXITCODE -eq 0) {
    $exportId = $result.Trim()
    Write-Host "  [OK] Export created: $exportId" -ForegroundColor Green
}
else {
    Write-Host "  [FAIL] Failed to create export" -ForegroundColor Red
    Write-Host $result
    exit 1
}

# Create test buyer
Write-Host "`nCreating test buyer..." -ForegroundColor Yellow

$createBuyer = @"
INSERT INTO buyer_registry (
    buyer_id, company_name, country, city, address,
    contact_person, contact_email, contact_phone, tax_id,
    business_type, created_at, updated_at
) VALUES (
    gen_random_uuid(), 'Test Coffee Importers Inc', 'United States', 'New York', '456 Import Avenue',
    'Jane Smith', 'jane@testimporter.com', '+12125551234', 'US-TAX-001',
    'Importer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (tax_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    updated_at = CURRENT_TIMESTAMP
RETURNING buyer_id;
"@

$result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $createBuyer 2>&1

if ($LASTEXITCODE -eq 0) {
    $buyerId = $result.Trim()
    Write-Host "  [OK] Buyer created/updated: $buyerId" -ForegroundColor Green
}
else {
    Write-Host "  [WARN] Buyer creation issue (might already exist)" -ForegroundColor Yellow
}

# Get buyer_id
$getBuyerId = "SELECT buyer_id FROM buyer_registry WHERE tax_id = 'US-TAX-001';"
$buyerId = (docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c $getBuyerId 2>&1).Trim()
Write-Host "  Buyer ID: $buyerId" -ForegroundColor Gray

Write-Host "`n=== Test Data Summary ===" -ForegroundColor Cyan
Write-Host "Exporter ID: $exporterId" -ForegroundColor White
Write-Host "Export ID: $exportId" -ForegroundColor White
Write-Host "Buyer ID: $buyerId" -ForegroundColor White
Write-Host "`nTest data seeding complete! You can now run payment workflow tests." -ForegroundColor Green
