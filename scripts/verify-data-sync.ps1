# Data Synchronization Verification Script
# Compares PostgreSQL data with Blockchain/CouchDB data

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Data Synchronization Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$syncIssues = @()
$totalChecks = 0
$syncedCount = 0

# Function to check sync status
function Check-SyncStatus {
    param(
        [string]$Entity,
        [int]$PostgresCount,
        [int]$BlockchainCount
    )
    
    $script:totalChecks++
    
    if ($PostgresCount -eq $BlockchainCount) {
        Write-Host "  ✅ $Entity : $PostgresCount records (SYNCED)" -ForegroundColor Green
        $script:syncedCount++
    } else {
        Write-Host "  ❌ $Entity : PostgreSQL=$PostgresCount, Blockchain=$BlockchainCount (OUT OF SYNC)" -ForegroundColor Red
        $script:syncIssues += @{
            Entity = $Entity
            PostgresCount = $PostgresCount
            BlockchainCount = $BlockchainCount
            Difference = [Math]::Abs($PostgresCount - $BlockchainCount)
        }
    }
}

# 1. Check Exporter Profiles
Write-Host "[1/6] Checking Exporter Profiles..." -ForegroundColor Yellow

$pgExporters = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM exporter_profiles WHERE status='ACTIVE';"
$pgExporters = [int]($pgExporters.Trim())

Write-Host "  PostgreSQL: $pgExporters active exporters" -ForegroundColor Gray

# Query blockchain for exporter count
try {
    $bcExporters = docker exec coffee-gateway node -e "
        const fabricService = require('./src/services/fabric-cli-final');
        (async () => {
            try {
                const exporters = await fabricService.getUsersByRole('exporter');
                console.log(exporters.length);
            } catch (error) {
                console.log('0');
            }
        })();
    " 2>$null
    $bcExporters = [int]($bcExporters.Trim())
} catch {
    $bcExporters = 0
}

Write-Host "  Blockchain: $bcExporters exporters" -ForegroundColor Gray

Check-SyncStatus -Entity "Exporter Profiles" -PostgresCount $pgExporters -BlockchainCount $bcExporters

# 2. Check Sales Contracts
Write-Host ""
Write-Host "[2/6] Checking Sales Contracts..." -ForegroundColor Yellow

$pgContracts = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM contract_drafts WHERE status='FINALIZED';"
$pgContracts = [int]($pgContracts.Trim())

Write-Host "  PostgreSQL: $pgContracts finalized contracts" -ForegroundColor Gray

# Query blockchain for contract count
try {
    $bcContracts = docker exec coffee-gateway node -e "
        const { Pool } = require('pg');
        const pool = new Pool({
            host: process.env.POSTGRES_HOST || 'coffee-postgres',
            port: 5432,
            database: 'coffee_export_db',
            user: 'postgres',
            password: 'postgres'
        });
        (async () => {
            try {
                const result = await pool.query('SELECT COUNT(*) FROM contract_drafts WHERE status=\\'FINALIZED\\' AND blockchain_tx_id IS NOT NULL');
                console.log(result.rows[0].count);
                await pool.end();
            } catch (error) {
                console.log('0');
            }
        })();
    " 2>$null
    $bcContracts = [int]($bcContracts.Trim())
} catch {
    $bcContracts = 0
}

Write-Host "  Blockchain: $bcContracts synced contracts" -ForegroundColor Gray

Check-SyncStatus -Entity "Sales Contracts" -PostgresCount $pgContracts -BlockchainCount $bcContracts

# 3. Check Issued Documents
Write-Host ""
Write-Host "[3/6] Checking Issued Documents..." -ForegroundColor Yellow

$pgDocuments = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM issued_documents WHERE status='ACTIVE';"
$pgDocuments = [int]($pgDocuments.Trim())

Write-Host "  PostgreSQL: $pgDocuments active documents" -ForegroundColor Gray

Check-SyncStatus -Entity "Issued Documents" -PostgresCount $pgDocuments -BlockchainCount 0

# 4. Check Network Submissions
Write-Host ""
Write-Host "[4/6] Checking Network Submissions..." -ForegroundColor Yellow

$pgSubmissions = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM network_submissions;"
$pgSubmissions = [int]($pgSubmissions.Trim())

Write-Host "  PostgreSQL: $pgSubmissions submissions" -ForegroundColor Gray

Check-SyncStatus -Entity "Network Submissions" -PostgresCount $pgSubmissions -BlockchainCount 0

# 5. Check Qualifications
Write-Host ""
Write-Host "[5/6] Checking Qualifications..." -ForegroundColor Yellow

$pgLabs = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM coffee_laboratories WHERE status='ACTIVE';"
$pgLabs = [int]($pgLabs.Trim())

$pgTasters = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM coffee_tasters WHERE status='ACTIVE';"
$pgTasters = [int]($pgTasters.Trim())

$pgCompetence = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM competence_certificates WHERE status='ACTIVE';"
$pgCompetence = [int]($pgCompetence.Trim())

$pgLicenses = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM export_licenses WHERE status='ACTIVE';"
$pgLicenses = [int]($pgLicenses.Trim())

Write-Host "  PostgreSQL:" -ForegroundColor Gray
Write-Host "    Laboratories: $pgLabs" -ForegroundColor Gray
Write-Host "    Tasters: $pgTasters" -ForegroundColor Gray
Write-Host "    Competence: $pgCompetence" -ForegroundColor Gray
Write-Host "    Licenses: $pgLicenses" -ForegroundColor Gray

Check-SyncStatus -Entity "Laboratories" -PostgresCount $pgLabs -BlockchainCount 0
Check-SyncStatus -Entity "Tasters" -PostgresCount $pgTasters -BlockchainCount 0
Check-SyncStatus -Entity "Competence Certificates" -PostgresCount $pgCompetence -BlockchainCount 0
Check-SyncStatus -Entity "Export Licenses" -PostgresCount $pgLicenses -BlockchainCount 0

# 6. Check Buyers
Write-Host ""
Write-Host "[6/6] Checking Buyer Registry..." -ForegroundColor Yellow

$pgBuyers = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -c "SELECT COUNT(*) FROM buyer_registry WHERE verification_status='VERIFIED';"
$pgBuyers = [int]($pgBuyers.Trim())

Write-Host "  PostgreSQL: $pgBuyers verified buyers" -ForegroundColor Gray

Check-SyncStatus -Entity "Buyer Registry" -PostgresCount $pgBuyers -BlockchainCount 0

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Synchronization Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Checks: $totalChecks" -ForegroundColor White
Write-Host "Synced: $syncedCount" -ForegroundColor Green
Write-Host "Out of Sync: $($syncIssues.Count)" -ForegroundColor Red
Write-Host ""

if ($syncIssues.Count -gt 0) {
    Write-Host "Entities Needing Synchronization:" -ForegroundColor Yellow
    Write-Host "-----------------------------------" -ForegroundColor Yellow
    foreach ($issue in $syncIssues) {
        Write-Host "  $($issue.Entity):" -ForegroundColor White
        Write-Host "    PostgreSQL: $($issue.PostgresCount)" -ForegroundColor Gray
        Write-Host "    Blockchain: $($issue.BlockchainCount)" -ForegroundColor Gray
        Write-Host "    Missing: $($issue.Difference) records" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "⚠️  Synchronization required!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run synchronization script:" -ForegroundColor Cyan
    Write-Host "  .\sync-to-blockchain.ps1" -ForegroundColor White
} else {
    Write-Host "✅ All data synchronized!" -ForegroundColor Green
}

Write-Host ""
