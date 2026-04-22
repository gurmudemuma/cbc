# Debug failing endpoints with detailed error messages

$baseUrl = "http://localhost:3000"

# Get exporter token
Write-Host "Getting exporter token..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"exporter1","password":"password123"}'
$exporterToken = $loginResponse.token
Write-Host "Token: $($exporterToken.Substring(0,20))...`n" -ForegroundColor Green

# Test 1: Document Requests
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 1: Document Requests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/document-requests" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error: $responseBody" -ForegroundColor Red
}

# Test 2: Document Issuance Status
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Document Issuance Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/document-issuance/status" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error: $responseBody" -ForegroundColor Red
}

# Test 3: Marketplace Listings
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 3: Marketplace Listings" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $exporterToken" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/marketplace/listings" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error: $responseBody" -ForegroundColor Red
}

# Get customs token
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Getting customs token..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"customs1","password":"password123"}'
$customsToken = $loginResponse.token
Write-Host "Token: $($customsToken.Substring(0,20))...`n" -ForegroundColor Green

# Test 4: Customs Declarations
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 4: Customs Declarations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $customsToken" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/customs/declarations" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error: $responseBody" -ForegroundColor Red
}

# Get shipping token
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Getting shipping token..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"shipping1","password":"password123"}'
$shippingToken = $loginResponse.token
Write-Host "Token: $($shippingToken.Substring(0,20))...`n" -ForegroundColor Green

# Test 5: Shipments
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 5: Shipments" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $shippingToken" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/shipping/shipments" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error: $responseBody" -ForegroundColor Red
}

# Get admin token
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Getting admin token..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"admin","password":"admin123"}'
$adminToken = $loginResponse.token
Write-Host "Token: $($adminToken.Substring(0,20))...`n" -ForegroundColor Green

# Test 6: Network Status
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 6: Network Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/network/status" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error: $responseBody" -ForegroundColor Red
}

# Test 7: Hybrid Service Status
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 7: Hybrid Service Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/hybrid/status" `
        -Method Get `
        -Headers $headers
    Write-Host "[PASS] Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error: $responseBody" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Debug Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
