/**
 * Complete Export Flow Example
 * 
 * This example demonstrates a complete coffee export flow using the SDK:
 * 1. Login
 * 2. Check profile and license
 * 3. Create export contract
 * 4. Update banking details
 * 5. Update shipping details
 * 6. Track shipment
 * 7. View certificates
 * 8. Check audit trail
 */

const CoffeeExportSDK = require('../index');

async function completeExportFlow() {
    console.log('========================================');
    console.log('COMPLETE EXPORT FLOW EXAMPLE');
    console.log('========================================\n');

    // Initialize SDK
    const sdk = new CoffeeExportSDK({
        gatewayUrl: 'http://localhost:3000'
    });

    try {
        // STEP 1: Login
        console.log('STEP 1: Login');
        console.log('------------------------------------------');
        const loginResponse = await sdk.login('exporter1', 'password123');
        console.log('✅ Logged in as:', loginResponse.user.username);
        console.log('   Exporter ID:', sdk.exporterId);
        console.log();

        // STEP 2: Check Profile and License
        console.log('STEP 2: Check Profile and License');
        console.log('------------------------------------------');
        const profile = await sdk.getProfile();
        console.log('✅ Company:', profile.companyName);
        console.log('   Status:', profile.status);
        console.log('   Capital:', profile.capitalETB, 'ETB');

        const licenseStatus = await sdk.checkLicenseExpiry();
        console.log('✅ License Status:', licenseStatus.status);
        console.log('   Days until expiry:', licenseStatus.daysUntilExpiry);
        console.log();

        // STEP 3: Create Export Contract
        console.log('STEP 3: Create Export Contract');
        console.log('------------------------------------------');
        const exportContract = await sdk.createExportContract({
            coffeeType: 'Arabica Sidamo Grade 1',
            quantity: 5000, // kg
            destinationCountry: 'Germany',
            estimatedValue: 250000, // USD
            buyerCompanyName: 'German Premium Coffee Importers GmbH',
            buyerCountry: 'Germany',
            paymentTerms: 'LC at sight',
            deliveryTerms: 'FOB Djibouti',
            geographicalDesignation: 'Sidamo',
            ecxAuctionReference: 'ECX-2026-12345'
        });
        console.log('✅ Export Contract Created');
        console.log('   Export ID:', exportContract.exportId);
        console.log('   Coffee Type:', exportContract.coffeeType);
        console.log('   Quantity:', exportContract.quantity, 'kg');
        console.log('   Destination:', exportContract.destinationCountry);
        console.log();

        const exportId = exportContract.exportId;

        // STEP 4: Update Banking Details
        console.log('STEP 4: Update Banking Details');
        console.log('------------------------------------------');
        await sdk.updateBankingDetails(exportId, {
            lcNumber: 'LC-2026-DE-001',
            lcIssuingBank: 'Deutsche Bank AG',
            lcAmount: 250000,
            lcCurrency: 'USD'
        });
        console.log('✅ Banking Details Updated');
        console.log('   LC Number: LC-2026-DE-001');
        console.log('   Issuing Bank: Deutsche Bank AG');
        console.log('   Amount: $250,000 USD');
        console.log();

        // STEP 5: Wait for ECTA Approvals (simulated)
        console.log('STEP 5: Waiting for ECTA Approvals');
        console.log('------------------------------------------');
        console.log('⏳ Contract approval pending...');
        console.log('⏳ Quality certification pending...');
        console.log('   (In production, ECTA officers approve via their portal)');
        console.log();

        // STEP 6: Update Shipping Details
        console.log('STEP 6: Update Shipping Details');
        console.log('------------------------------------------');
        const departureDate = new Date();
        departureDate.setDate(departureDate.getDate() + 14);
        const arrivalDate = new Date();
        arrivalDate.setDate(arrivalDate.getDate() + 28);

        await sdk.updateShippingDetails(exportId, {
            billOfLadingNumber: 'BL-2026-001',
            containerNumber: 'CONT-ECTA-2026-001',
            vesselName: 'MV Ethiopian Coffee Express',
            portOfLoading: 'Djibouti Port',
            portOfDischarge: 'Hamburg Port',
            estimatedDepartureDate: departureDate.toISOString(),
            estimatedArrivalDate: arrivalDate.toISOString()
        });
        console.log('✅ Shipping Details Updated');
        console.log('   Bill of Lading: BL-2026-001');
        console.log('   Container: CONT-ECTA-2026-001');
        console.log('   Vessel: MV Ethiopian Coffee Express');
        console.log('   Route: Djibouti → Hamburg');
        console.log('   Departure:', departureDate.toISOString().substring(0, 10));
        console.log('   Arrival:', arrivalDate.toISOString().substring(0, 10));
        console.log();

        // STEP 7: Track Shipment
        console.log('STEP 7: Track Shipment');
        console.log('------------------------------------------');
        const exportDetails = await sdk.getExportContract(exportId);
        console.log('✅ Export Status:', exportDetails.status);
        console.log('   Workflow Progress:');
        console.log('   - Contract:', exportDetails.workflow.ectaContract.status);
        console.log('   - Quality:', exportDetails.workflow.ectaQuality.status);
        console.log('   - Banking:', exportDetails.workflow.bankingDocuments.status);
        console.log('   - Customs:', exportDetails.workflow.customsClearance.status);
        console.log('   - Shipping:', exportDetails.workflow.shipmentSchedule.status);
        console.log();

        // STEP 8: View Quality Certificate
        console.log('STEP 8: View Quality Certificate');
        console.log('------------------------------------------');
        try {
            const certificate = await sdk.getQualityCertificate(exportId);
            console.log('✅ Quality Certificate Found');
            console.log('   Certificate ID:', certificate.certificateId);
            console.log('   Grade:', certificate.grade);
            console.log('   Cup Score:', certificate.cupScore);
            console.log('   Issued By:', certificate.issuedBy);
        } catch (error) {
            console.log('⏳ Quality certificate not yet issued');
            console.log('   (Will be issued by ECTA after quality testing)');
        }
        console.log();

        // STEP 9: Submit to ESW
        console.log('STEP 9: Submit to ESW');
        console.log('------------------------------------------');
        const eswResponse = await sdk.submitToESW(exportId, [
            'export_permit_application.pdf',
            'commercial_invoice.pdf',
            'packing_list.pdf',
            'bill_of_lading.pdf',
            'certificate_of_origin.pdf',
            'quality_certificate.pdf',
            'phytosanitary_certificate.pdf',
            'insurance_certificate.pdf'
        ]);
        console.log('✅ Submitted to ESW');
        console.log('   ESW Request ID:', eswResponse.requestId);
        console.log('   Documents Submitted: 8');
        console.log();

        // STEP 10: Check ESW Status
        console.log('STEP 10: Check ESW Status');
        console.log('------------------------------------------');
        const eswStatus = await sdk.getESWStatus(eswResponse.requestId);
        console.log('✅ ESW Status:', eswStatus.status);
        console.log('   Agency Approvals:', eswStatus.agencyApprovals.length);
        if (eswStatus.agencyApprovals.length > 0) {
            eswStatus.agencyApprovals.forEach(approval => {
                console.log(`   - ${approval.agency}: ${approval.status}`);
            });
        }
        console.log();

        // STEP 11: View All My Exports
        console.log('STEP 11: View All My Exports');
        console.log('------------------------------------------');
        const myExports = await sdk.getMyExports();
        console.log(`✅ Total Exports: ${myExports.length}`);
        myExports.forEach((exp, index) => {
            console.log(`   ${index + 1}. ${exp.coffeeType} - ${exp.quantity}kg to ${exp.destinationCountry}`);
            console.log(`      Status: ${exp.status}`);
        });
        console.log();

        // STEP 12: View Audit Trail
        console.log('STEP 12: View Audit Trail');
        console.log('------------------------------------------');
        const auditTrail = await sdk.getExportHistory(exportId);
        console.log(`✅ Audit Trail: ${auditTrail.length} transactions`);
        console.log('   Complete blockchain history available');
        console.log('   All actions are immutable and traceable');
        console.log();

        // STEP 13: Get Statistics
        console.log('STEP 13: Get Statistics');
        console.log('------------------------------------------');
        try {
            const stats = await sdk.getStatistics();
            console.log('✅ Exporter Statistics:');
            console.log('   Total Exports:', stats.totalExports);
            console.log('   Active Exports:', stats.activeExports);
            console.log('   Total Value:', stats.totalValue, 'USD');
        } catch (error) {
            console.log('⏳ Statistics endpoint not yet implemented');
        }
        console.log();

        // SUCCESS
        console.log('========================================');
        console.log('✅ COMPLETE EXPORT FLOW SUCCESSFUL!');
        console.log('========================================');
        console.log('\nSummary:');
        console.log('- Logged in as exporter');
        console.log('- Created export contract');
        console.log('- Updated banking details');
        console.log('- Updated shipping details');
        console.log('- Submitted to ESW');
        console.log('- Tracked all progress');
        console.log('- Viewed audit trail');
        console.log('\nThe export is now in the blockchain system');
        console.log('and can be tracked through the entire process!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nMake sure:');
        console.error('1. Backend is running on http://localhost:3000');
        console.error('2. Chaincode server is running on http://localhost:3001');
        console.error('3. You have valid credentials');
    }
}

// Run the example
if (require.main === module) {
    completeExportFlow();
}

module.exports = completeExportFlow;
