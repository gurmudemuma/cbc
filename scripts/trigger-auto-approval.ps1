# Trigger Auto-Approval for Pending Document Requests
# This simulates what should happen automatically via setImmediate

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Triggering Auto-Approval" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run the auto-approval script in the gateway container
Write-Host "Running auto-approval script..." -ForegroundColor Yellow

try {
    $result = docker exec coffee-gateway node /app/src/scripts/autoApprovePendingRequests.js
    Write-Host $result
    Write-Host ""
    Write-Host "SUCCESS: Auto-approval completed" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Wait a moment for processing
Start-Sleep -Seconds 2

# Check status
Write-Host ""
Write-Host "Checking document status..." -ForegroundColor Yellow

$query = "SELECT document_type, request_status, COUNT(*) as count FROM document_requests WHERE requested_at > NOW() - INTERVAL '1 hour' GROUP BY document_type, request_status ORDER BY document_type, request_status;"

docker exec coffee-postgres psql -U postgres -d coffee_export_db -c $query

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Auto-Approval Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
