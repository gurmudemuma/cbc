# Comprehensive Data Synchronization Script
# Syncs all PostgreSQL records to Blockchain/CouchDB

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL → Blockchain Sync" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$syncResults = @{
    exporters = @{ success = 0; failed = 0; skipped = 0 }
    contracts = @{ success = 0; failed = 0; skipped = 0 }
    documents = @{ success = 0; failed = 0; skipped = 0 }
    submissions = @{ success = 0; failed = 0; skipped = 0 }
    qualifications = @{ success = 0; failed = 0; skipped = 0 }
}

# ============================================================================
# 1. SYNC EXPORTER PROFILES
# ============================================================================
Write-Host "[1/5] Syncing Exporter Profiles..." -ForegroundColor Yellow
Write-Host ""

# Get all active exporters from PostgreSQL
$exporters = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -A -F'|' -c "
    SELECT 
        ep.user_id,
        ep.business_name,
        ep.tin,
        ep.minimum_capital,
        ep.business_type,
        ep.status,
        u.email,
        u.phone,
        u.password_hash
    FROM exporter_profiles ep
    JOIN users u ON ep.user_id = u.username
    WHERE ep.status IN ('ACTIVE', 'PENDING_APPROVAL')
    ORDER BY ep.created_at
"

if ($exporters) {
    $exporterLines = $exporters -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($line in $exporterLines) {
        $fields = $line -split '\|'
        if ($fields.Length -ge 9) {
            $username = $fields[0].Trim()
            $businessName = $fields[1].Trim()
            $tin = $fields[2].Trim()
            $capital = $fields[3].Trim()
            $businessType = $fields[4].Trim()
            $status = $fields[5].Trim()
            $email = $fields[6].Trim()
            $phone = $fields[7].Trim()
            $passwordHash = $fields[8].Trim()
            
            Write-Host "  Syncing: $username ($businessName)..." -NoNewline
            
            # Check if user exists on blockchain
            $exists = docker exec coffee-gateway node -e "
                const fabricService = require('./src/services/fabric-cli-final');
                (async () => {
                    try {
                        await fabricService.getUser('$username');
                        console.log('EXISTS');
                    } catch (error) {
                        console.log('NOT_FOUND');
                    }
                })();
            " 2>$null
            
            if ($exists -match "EXISTS") {
                Write-Host " SKIPPED (already exists)" -ForegroundColor Gray
                $syncResults.exporters.skipped++
            } else {
                # Register user on blockchain
                $result = docker exec coffee-gateway node -e "
                    const fabricService = require('./src/services/fabric-cli-final');
                    (async () => {
                        try {
                            const userData = {
                                username: '$username',
                                email: '$email',
                                phone: '$phone',
                                companyName: '$businessName',
                                tin: '$tin',
                                capitalETB: $capital,
                                businessType: '$businessType',
                                role: 'exporter',
                                status: '$($status.ToLower())',
                                passwordHash: '$passwordHash',
                                registeredAt: new Date().toISOString()
                            };
                            await fabricService.registerUser(JSON.stringify(userData));
                            console.log('SUCCESS');
                        } catch (error) {
                            console.log('ERROR: ' + error.message);
                        }
                    })();
                " 2>$null
                
                if ($result -match "SUCCESS") {
                    Write-Host " ✓ SYNCED" -ForegroundColor Green
                    $syncResults.exporters.success++
                } else {
                    Write-Host " ✗ FAILED" -ForegroundColor Red
                    $syncResults.exporters.failed++
                }
            }
        }
    }
}

Write-Host ""
Write-Host "  Exporters: $($syncResults.exporters.success) synced, $($syncResults.exporters.skipped) skipped, $($syncResults.exporters.failed) failed" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 2. SYNC SALES CONTRACTS
# ============================================================================
Write-Host "[2/5] Syncing Sales Contracts..." -ForegroundColor Yellow
Write-Host ""

# Get all finalized contracts from PostgreSQL
$contracts = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -A -F'|' -c "
    SELECT 
        draft_id,
        ecta_reference_number,
        finalized_contract_id,
        exporter_id,
        buyer_id,
        coffee_type,
        quantity,
        unit_price,
        total_value,
        currency,
        payment_terms,
        delivery_date,
        blockchain_tx_id
    FROM contract_drafts
    WHERE status = 'FINALIZED'
    ORDER BY updated_at
"

if ($contracts) {
    $contractLines = $contracts -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($line in $contractLines) {
        $fields = $line -split '\|'
        if ($fields.Length -ge 13) {
            $draftId = $fields[0].Trim()
            $ectaRef = $fields[1].Trim()
            $contractId = $fields[2].Trim()
            $blockchainTxId = $fields[12].Trim()
            
            Write-Host "  Syncing: $ectaRef..." -NoNewline
            
            if ($blockchainTxId -and $blockchainTxId -ne "") {
                Write-Host " SKIPPED (already synced)" -ForegroundColor Gray
                $syncResults.contracts.skipped++
            } else {
                # Sync contract to blockchain
                $exporterId = $fields[3].Trim()
                $buyerId = $fields[4].Trim()
                $coffeeType = $fields[5].Trim()
                $quantity = $fields[6].Trim()
                $unitPrice = $fields[7].Trim()
                $totalValue = $fields[8].Trim()
                $currency = $fields[9].Trim()
                $paymentTerms = $fields[10].Trim()
                $deliveryDate = $fields[11].Trim()
                
                $result = docker exec coffee-gateway node -e "
                    const fabricService = require('./src/services/fabric-cli-final');
                    const { Pool } = require('pg');
                    const pool = new Pool({
                        host: 'coffee-postgres',
                        port: 5432,
                        database: 'coffee_export_db',
                        user: 'postgres',
                        password: 'postgres'
                    });
                    (async () => {
                        try {
                            const contractData = {
                                contractId: '$contractId',
                                ectaReferenceNumber: '$ectaRef',
                                exporterId: '$exporterId',
                                buyerId: '$buyerId',
                                coffeeType: '$coffeeType',
                                quantity: $quantity,
                                unitPrice: $unitPrice,
                                totalValue: $totalValue,
                                currency: '$currency',
                                paymentTerms: '$paymentTerms',
                                deliveryDate: '$deliveryDate'
                            };
                            
                            const txId = await fabricService.submitTransaction(
                                'system',
                                'ecta',
                                'FinalizeContractFromDraft',
                                '$draftId',
                                JSON.stringify(contractData)
                            );
                            
                            // Update PostgreSQL with blockchain tx ID
                            await pool.query(
                                'UPDATE contract_drafts SET blockchain_tx_id = \$1 WHERE draft_id = \$2',
                                [txId, '$draftId']
                            );
                            
                            await pool.end();
                            console.log('SUCCESS');
                        } catch (error) {
                            console.log('ERROR: ' + error.message);
                        }
                    })();
                " 2>$null
                
                if ($result -match "SUCCESS") {
                    Write-Host " ✓ SYNCED" -ForegroundColor Green
                    $syncResults.contracts.success++
                } else {
                    Write-Host " ✗ FAILED" -ForegroundColor Red
                    $syncResults.contracts.failed++
                }
            }
        }
    }
}

Write-Host ""
Write-Host "  Contracts: $($syncResults.contracts.success) synced, $($syncResults.contracts.skipped) skipped, $($syncResults.contracts.failed) failed" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 3. SYNC ISSUED DOCUMENTS
# ============================================================================
Write-Host "[3/5] Syncing Issued Documents..." -ForegroundColor Yellow
Write-Host ""

# Get all active documents from PostgreSQL
$documents = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -A -F'|' -c "
    SELECT 
        document_id,
        document_number,
        document_type,
        exporter_id,
        issuer_member_code,
        issued_at,
        expiry_date,
        document_hash,
        blockchain_tx_id
    FROM issued_documents
    WHERE status = 'ACTIVE'
    ORDER BY issued_at
    LIMIT 100
"

if ($documents) {
    $documentLines = $documents -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($line in $documentLines) {
        $fields = $line -split '\|'
        if ($fields.Length -ge 9) {
            $documentId = $fields[0].Trim()
            $documentNumber = $fields[1].Trim()
            $documentType = $fields[2].Trim()
            $blockchainTxId = $fields[8].Trim()
            
            Write-Host "  Syncing: $documentNumber ($documentType)..." -NoNewline
            
            if ($blockchainTxId -and $blockchainTxId -ne "") {
                Write-Host " SKIPPED (already synced)" -ForegroundColor Gray
                $syncResults.documents.skipped++
            } else {
                $exporterId = $fields[3].Trim()
                $issuerCode = $fields[4].Trim()
                $issuedAt = $fields[5].Trim()
                $expiryDate = $fields[6].Trim()
                $documentHash = $fields[7].Trim()
                
                $result = docker exec coffee-gateway node -e "
                    const fabricService = require('./src/services/fabric-cli-final');
                    const { Pool } = require('pg');
                    const pool = new Pool({
                        host: 'coffee-postgres',
                        port: 5432,
                        database: 'coffee_export_db',
                        user: 'postgres',
                        password: 'postgres'
                    });
                    (async () => {
                        try {
                            const documentData = {
                                documentId: '$documentId',
                                documentNumber: '$documentNumber',
                                documentType: '$documentType',
                                exporterId: '$exporterId',
                                issuerMemberCode: '$issuerCode',
                                issuedAt: '$issuedAt',
                                expiryDate: '$expiryDate',
                                documentHash: '$documentHash',
                                status: 'ACTIVE'
                            };
                            
                            const txId = await fabricService.submitTransaction(
                                'system',
                                'ecta',
                                'RecordDocumentIssuance',
                                JSON.stringify(documentData)
                            );
                            
                            // Update PostgreSQL with blockchain tx ID
                            await pool.query(
                                'UPDATE issued_documents SET blockchain_tx_id = \$1 WHERE document_id = \$2',
                                [txId, '$documentId']
                            );
                            
                            await pool.end();
                            console.log('SUCCESS');
                        } catch (error) {
                            console.log('ERROR: ' + error.message);
                        }
                    })();
                " 2>$null
                
                if ($result -match "SUCCESS") {
                    Write-Host " ✓ SYNCED" -ForegroundColor Green
                    $syncResults.documents.success++
                } else {
                    Write-Host " ✗ FAILED" -ForegroundColor Red
                    $syncResults.documents.failed++
                }
            }
        }
    }
}

Write-Host ""
Write-Host "  Documents: $($syncResults.documents.success) synced, $($syncResults.documents.skipped) skipped, $($syncResults.documents.failed) failed" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 4. SYNC NETWORK SUBMISSIONS
# ============================================================================
Write-Host "[4/5] Syncing Network Submissions..." -ForegroundColor Yellow
Write-Host ""

# Get all submissions from PostgreSQL
$submissions = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -A -F'|' -c "
    SELECT 
        submission_id,
        esw_reference_number,
        exporter_id,
        status,
        submitted_at,
        blockchain_tx_id
    FROM network_submissions
    ORDER BY submitted_at
    LIMIT 50
"

if ($submissions) {
    $submissionLines = $submissions -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($line in $submissionLines) {
        $fields = $line -split '\|'
        if ($fields.Length -ge 6) {
            $submissionId = $fields[0].Trim()
            $eswRef = $fields[1].Trim()
            $blockchainTxId = $fields[5].Trim()
            
            Write-Host "  Syncing: $eswRef..." -NoNewline
            
            if ($blockchainTxId -and $blockchainTxId -ne "") {
                Write-Host " SKIPPED (already synced)" -ForegroundColor Gray
                $syncResults.submissions.skipped++
            } else {
                $exporterId = $fields[2].Trim()
                $status = $fields[3].Trim()
                $submittedAt = $fields[4].Trim()
                
                $result = docker exec coffee-gateway node -e "
                    const fabricService = require('./src/services/fabric-cli-final');
                    const { Pool } = require('pg');
                    const pool = new Pool({
                        host: 'coffee-postgres',
                        port: 5432,
                        database: 'coffee_export_db',
                        user: 'postgres',
                        password: 'postgres'
                    });
                    (async () => {
                        try {
                            const submissionData = {
                                submissionId: '$submissionId',
                                eswReferenceNumber: '$eswRef',
                                exporterId: '$exporterId',
                                status: '$status',
                                submittedAt: '$submittedAt'
                            };
                            
                            const txId = await fabricService.submitTransaction(
                                'system',
                                'ecta',
                                'SubmitToNetwork',
                                JSON.stringify(submissionData)
                            );
                            
                            // Update PostgreSQL with blockchain tx ID
                            await pool.query(
                                'UPDATE network_submissions SET blockchain_tx_id = \$1 WHERE submission_id = \$2',
                                [txId, '$submissionId']
                            );
                            
                            await pool.end();
                            console.log('SUCCESS');
                        } catch (error) {
                            console.log('ERROR: ' + error.message);
                        }
                    })();
                " 2>$null
                
                if ($result -match "SUCCESS") {
                    Write-Host " ✓ SYNCED" -ForegroundColor Green
                    $syncResults.submissions.success++
                } else {
                    Write-Host " ✗ FAILED" -ForegroundColor Red
                    $syncResults.submissions.failed++
                }
            }
        }
    }
}

Write-Host ""
Write-Host "  Submissions: $($syncResults.submissions.success) synced, $($syncResults.submissions.skipped) skipped, $($syncResults.submissions.failed) failed" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 5. SYNC QUALIFICATIONS
# ============================================================================
Write-Host "[5/5] Syncing Qualifications..." -ForegroundColor Yellow
Write-Host ""

# Sync qualifications for each exporter
$exporterQuals = docker exec coffee-postgres psql -U postgres -d coffee_export_db -t -A -F'|' -c "
    SELECT DISTINCT user_id 
    FROM exporter_profiles 
    WHERE status = 'ACTIVE'
    LIMIT 20
"

if ($exporterQuals) {
    $exporterLines = $exporterQuals -split "`n" | Where-Object { $_.Trim() -ne "" }
    
    foreach ($username in $exporterLines) {
        $username = $username.Trim()
        Write-Host "  Syncing qualifications for: $username..." -NoNewline
        
        $result = docker exec coffee-gateway node -e "
            const fabricService = require('./src/services/fabric-cli-final');
            const { Pool } = require('pg');
            const pool = new Pool({
                host: 'coffee-postgres',
                port: 5432,
                database: 'coffee_export_db',
                user: 'postgres',
                password: 'postgres'
            });
            (async () => {
                try {
                    // Get exporter profile
                    const profileResult = await pool.query(
                        'SELECT exporter_id FROM exporter_profiles WHERE user_id = \$1',
                        ['$username']
                    );
                    
                    if (profileResult.rows.length === 0) {
                        console.log('SKIP');
                        return;
                    }
                    
                    const exporterId = profileResult.rows[0].exporter_id;
                    
                    // Get all qualifications
                    const qualData = await pool.query(\`
                        SELECT 
                            (SELECT COUNT(*) FROM coffee_laboratories WHERE exporter_id = \$1 AND status = 'ACTIVE') as labs,
                            (SELECT COUNT(*) FROM coffee_tasters WHERE exporter_id = \$1 AND status = 'ACTIVE') as tasters,
                            (SELECT COUNT(*) FROM competence_certificates WHERE exporter_id = \$1 AND status = 'ACTIVE') as competence,
                            (SELECT COUNT(*) FROM export_licenses WHERE exporter_id = \$1 AND status = 'ACTIVE') as licenses
                    \`, [exporterId]);
                    
                    const quals = qualData.rows[0];
                    
                    // Update exporter profile on blockchain with qualification status
                    const updates = {
                        qualifications: {
                            laboratory: quals.labs > 0 ? 'ACTIVE' : 'PENDING',
                            taster: quals.tasters > 0 ? 'ACTIVE' : 'PENDING',
                            competence: quals.competence > 0 ? 'ACTIVE' : 'PENDING',
                            license: quals.licenses > 0 ? 'ACTIVE' : 'PENDING'
                        },
                        fullyQualified: quals.labs > 0 && quals.tasters > 0 && quals.competence > 0 && quals.licenses > 0
                    };
                    
                    await fabricService.submitTransaction(
                        'system',
                        'ecta',
                        'UpdateExporterProfile',
                        '$username',
                        JSON.stringify(updates)
                    );
                    
                    await pool.end();
                    console.log('SUCCESS');
                } catch (error) {
                    console.log('ERROR: ' + error.message);
                }
            })();
        " 2>$null
        
        if ($result -match "SUCCESS") {
            Write-Host " ✓ SYNCED" -ForegroundColor Green
            $syncResults.qualifications.success++
        } elseif ($result -match "SKIP") {
            Write-Host " SKIPPED" -ForegroundColor Gray
            $syncResults.qualifications.skipped++
        } else {
            Write-Host " ✗ FAILED" -ForegroundColor Red
            $syncResults.qualifications.failed++
        }
    }
}

Write-Host ""
Write-Host "  Qualifications: $($syncResults.qualifications.success) synced, $($syncResults.qualifications.skipped) skipped, $($syncResults.qualifications.failed) failed" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Synchronization Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalSuccess = $syncResults.exporters.success + $syncResults.contracts.success + $syncResults.documents.success + $syncResults.submissions.success + $syncResults.qualifications.success
$totalSkipped = $syncResults.exporters.skipped + $syncResults.contracts.skipped + $syncResults.documents.skipped + $syncResults.submissions.skipped + $syncResults.qualifications.skipped
$totalFailed = $syncResults.exporters.failed + $syncResults.contracts.failed + $syncResults.documents.failed + $syncResults.submissions.failed + $syncResults.qualifications.failed

Write-Host "Total Synced: $totalSuccess" -ForegroundColor Green
Write-Host "Total Skipped: $totalSkipped" -ForegroundColor Gray
Write-Host "Total Failed: $totalFailed" -ForegroundColor Red
Write-Host ""

if ($totalFailed -gt 0) {
    Write-Host "⚠️  Some records failed to sync. Check logs above for details." -ForegroundColor Yellow
} else {
    Write-Host "✅ All records synchronized successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Run verification:" -ForegroundColor Cyan
Write-Host "  .\verify-data-sync.ps1" -ForegroundColor White
Write-Host ""
