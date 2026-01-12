# ============================================================================
# Fix PostgreSQL Database Credentials
# ============================================================================
# This script updates all API service .env files with the correct database
# credentials to match the Docker PostgreSQL container configuration
# ============================================================================

Write-Host ""
Write-Host "========================================"
Write-Host "PostgreSQL Credentials Fix"
Write-Host "========================================"
Write-Host ""

# Define the correct database credentials (matching docker-compose.postgres.yml)
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "coffee_export_db"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"
$DB_SSL = "false"

# Find all API service directories
$apiServices = @(
    "commercial-bank",
    "custom-authorities",
    "ecta",
    "exporter-portal",
    "national-bank",
    "ecx",
    "shipping-line"
)

$updatedCount = 0
$errorCount = 0

foreach ($service in $apiServices) {
    $envPath = ".\api\$service\.env"
    
    Write-Host "[INFO] Processing $service..."
    
    if (Test-Path $envPath) {
        try {
            # Read the current .env file
            $content = Get-Content $envPath -Raw
            
            # Update database credentials
            $content = $content -replace "DB_HOST=.*", "DB_HOST=$DB_HOST"
            $content = $content -replace "DB_PORT=.*", "DB_PORT=$DB_PORT"
            $content = $content -replace "DB_NAME=.*", "DB_NAME=$DB_NAME"
            $content = $content -replace "DB_USER=.*", "DB_USER=$DB_USER"
            $content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=$DB_PASSWORD"
            $content = $content -replace "DB_SSL=.*", "DB_SSL=$DB_SSL"
            
            # Write back to file
            Set-Content -Path $envPath -Value $content -NoNewline
            
            Write-Host "[OK] Updated $service credentials" -ForegroundColor Green
            $updatedCount++
        }
        catch {
            Write-Host "[ERROR] Failed to update $service : $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "[WARN] .env file not found for $service" -ForegroundColor Yellow
        Write-Host "[INFO] Creating .env from template..."
        
        $templatePath = ".\api\$service\.env.template"
        if (Test-Path $templatePath) {
            try {
                # Copy template and update credentials
                Copy-Item $templatePath $envPath
                
                $content = Get-Content $envPath -Raw
                $content = $content -replace "DB_HOST=.*", "DB_HOST=$DB_HOST"
                $content = $content -replace "DB_PORT=.*", "DB_PORT=$DB_PORT"
                $content = $content -replace "DB_NAME=.*", "DB_NAME=$DB_NAME"
                $content = $content -replace "DB_USER=.*", "DB_USER=$DB_USER"
                $content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=$DB_PASSWORD"
                $content = $content -replace "DB_SSL=.*", "DB_SSL=$DB_SSL"
                
                Set-Content -Path $envPath -Value $content -NoNewline
                
                Write-Host "[OK] Created and updated $service credentials" -ForegroundColor Green
                $updatedCount++
            }
            catch {
                Write-Host "[ERROR] Failed to create .env for $service : $_" -ForegroundColor Red
                $errorCount++
            }
        }
        else {
            Write-Host "[ERROR] Template not found for $service" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Summary"
Write-Host "========================================"
Write-Host "Services updated: $updatedCount" -ForegroundColor Green
Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($updatedCount -gt 0) {
    Write-Host "[INFO] Database credentials have been updated successfully!"
    Write-Host "[INFO] Please restart your API services for changes to take effect."
    Write-Host ""
}

exit 0
