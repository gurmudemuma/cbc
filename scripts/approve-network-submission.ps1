# Approve Network Submission
# Manually approves all network members for a submission

$ErrorActionPreference = "Stop"

param(
    [string]$SubmissionId = "SUB-1776336543736"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Network Submission Approval" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Submission ID: $SubmissionId" -ForegroundColor Yellow
Write-Host ""

# Approve all network members
Write-Host "Approving all network members..." -ForegroundColor Yellow

$query = @"
UPDATE network_submissions 
SET 
  ecta_status = 'APPROVED',
  ecta_approved_at = CURRENT_TIMESTAMP,
  ecta_approved_by = 'SYSTEM_AUTO_APPROVAL',
  ecta_notes = 'Auto-approved for testing',
  bank_status = 'APPROVED',
  bank_approved_at = CURRENT_TIMESTAMP,
  bank_approved_by = 'SYSTEM_AUTO_APPROVAL',
  bank_notes = 'Auto-approved for testing',
  nbe_status = 'APPROVED',
  nbe_approved_at = CURRENT_TIMESTAMP,
  nbe_approved_by = 'SYSTEM_AUTO_APPROVAL',
  nbe_notes = 'Auto-approved for testing',
  customs_status = 'APPROVED',
  customs_approved_at = CURRENT_TIMESTAMP,
  customs_approved_by = 'SYSTEM_AUTO_APPROVAL',
  customs_notes = 'Auto-approved for testing',
  shipping_status = 'APPROVED',
  shipping_approved_at = CURRENT_TIMESTAMP,
  shipping_approved_by = 'SYSTEM_AUTO_APPROVAL',
  shipping_notes = 'Auto-approved for testing',
  status = 'EXPORT_APPROVED',
  completed_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE submission_id = '$SubmissionId'
RETURNING submission_id, status, ecta_status, bank_status, nbe_status, customs_status, shipping_status;
"@

try {
    $result = docker exec coffee-postgres psql -U postgres -d coffee_export_db -c $query
    Write-Host $result
    Write-Host ""
    Write-Host "SUCCESS: All network members approved" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Approval Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
