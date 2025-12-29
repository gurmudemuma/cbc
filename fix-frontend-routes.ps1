# ============================================================================
# Fix Frontend API Routes - Remove Duplicate /api Prefix
# ============================================================================
# This script removes the /api prefix from all API endpoint calls since
# the apiClient baseURL already includes /api
# ============================================================================

Write-Host ""
Write-Host "========================================"
Write-Host "Frontend API Routes Fix"
Write-Host "========================================"
Write-Host ""

$serviceFiles = @(
    ".\frontend\src\services\monetaryService.js",
    ".\frontend\src\services\lotService.js",
    ".\frontend\src\services\bankingService.js",
    ".\frontend\src\services\exporterService.js",
    ".\frontend\src\services\ectaPreRegistration.js",
    ".\frontend\src\services\index.js"
)

$updatedCount = 0
$errorCount = 0

foreach ($file in $serviceFiles) {
    if (Test-Path $file) {
        Write-Host "[INFO] Processing $(Split-Path $file -Leaf)..."
        
        try {
            # Read the file content
            $content = Get-Content $file -Raw
            
            # Replace /api/ with / in all API calls
            # This regex matches apiClient.get('/api/... or apiClient.post('/api/... etc.
            $newContent = $content -replace "apiClient\.(get|post|put|delete|patch)\('\/api\/", "apiClient.`$1('/"
            
            # Also handle template literals with /api/
            $newContent = $newContent -replace "apiClient\.(get|post|put|delete|patch)\(`"\/api\/", "apiClient.`$1(`"/"
            
            # Check if any changes were made
            if ($content -ne $newContent) {
                Set-Content -Path $file -Value $newContent -NoNewline
                Write-Host "[OK] Updated $(Split-Path $file -Leaf)" -ForegroundColor Green
                $updatedCount++
            }
            else {
                Write-Host "[SKIP] No changes needed for $(Split-Path $file -Leaf)" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "[ERROR] Failed to update $(Split-Path $file -Leaf): $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "[SKIP] File not found: $(Split-Path $file -Leaf)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Summary"
Write-Host "========================================"
Write-Host "Files updated: $updatedCount" -ForegroundColor Green
Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($updatedCount -gt 0) {
    Write-Host "[INFO] API routes have been fixed successfully!"
    Write-Host "[INFO] The frontend will now use correct endpoint paths."
    Write-Host ""
}

exit 0
