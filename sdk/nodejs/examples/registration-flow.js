/**
 * Complete Registration Flow Example
 * 
 * This example demonstrates the proper exporter registration workflow:
 * 1. Public registration (no login)
 * 2. Check registration status
 * 3. ECTA approval (simulated)
 * 4. Login after approval
 * 5. Submit qualification documents
 * 6. ECTA approves qualifications
 * 7. ECTA issues license
 * 8. Exporter becomes active
 */

const CoffeeExportSDK = require('../index');
const axios = require('axios');

async function registrationFlow() {
    console.log('========================================');
    console.log('EXPORTER REGISTRATION FLOW');
    console.log('========================================\n');

    const sdk = new CoffeeExportSDK({
        gatewayUrl: 'http://localhost:3000'
    });

    const newExporterData = {
        username: `exporter_${Date.now()}`,
        password: 'SecurePass123!',
        email: 'contact@newcoffeeexporter.et',
        phone: '+251911234567',
        companyName: 'New Ethiopian Coffee Exporters PLC',
        tin: 'TIN' + Date.now(),
        capitalETB: 75000000, // 75 million ETB
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'Abebe Kebede'
    };

    try {
        // STEP 1: Public Registration (No Login Required)
        console.log('STEP 1: Public Registration');
        console.log('------------------------------------------');
        console.log('Registering new exporter...');
        const registrationResponse = await sdk.register(newExporterData);
        console.log('✅ Registration Submitted');
        console.log('   Application Reference:', registrationResponse.applicationReference);
        console.log('   Status:', registrationResponse.status);
        console.log('   Message:', registrationResponse.message);
        console.log();

        const username = registrationResponse.applicationReference;

        // STEP 2: Check Registration Status
        console.log('STEP 2: Check Registration Status');
        console.log('------------------------------------------');
        const statusCheck = await sdk.checkRegistrationStatus(username);
        console.log('✅ Status Retrieved');
        console.log('   Username:', statusCheck.username);
        console.log('   Company:', statusCheck.companyName);
        console.log('   Status:', statusCheck.status);
        console.log('   Registered At:', statusCheck.registeredAt);
        console.log();

        // STEP 3: Try to Login (Should Fail - Pending Approval)
        console.log('STEP 3: Attempt Login (Should Fail)');
        console.log('------------------------------------------');
        try {
            await sdk.login(username, newExporterData.password);
            console.log('❌ Login should have failed!');
        } catch (error) {
            console.log('✅ Login Blocked (Expected)');
            console.log('   Error:', error.message);
        }
        console.log();

        // STEP 4: ECTA Approval (Simulated - requires ECTA login)
        console.log('STEP 4: ECTA Approval Process');
        console.log('------------------------------------------');
        console.log('⏳ Simulating ECTA approval...');
        
        // Login as ECTA officer
        const ectaSDK = new CoffeeExportSDK({ gatewayUrl: 'http://localhost:3000' });
        await ectaSDK.login('ecta1', 'password123');
        
        // Approve the registration
        const approvalResponse = await axios.post(
            `http://localhost:3000/api/ecta/registrations/${username}/approve`,
            { comments: 'All documents verified. Approved for qualification process.' },
            { headers: { 'Authorization': `Bearer ${ectaSDK.token}` } }
        );
        
        console.log('✅ Registration Approved by ECTA');
        console.log('   Approved At:', approvalResponse.data.approvedAt);
        console.log();

        // STEP 5: Login After Approval
        console.log('STEP 5: Login After Approval');
        console.log('------------------------------------------');
        const loginResponse = await sdk.login(username, newExporterData.password);
        console.log('✅ Login Successful');
        console.log('   Username:', loginResponse.user.username);
        console.log('   Company:', loginResponse.user.companyName);
        console.log('   Status:', loginResponse.user.status);
        console.log();

        // STEP 6: Submit Qualification Documents
        console.log('STEP 6: Submit Qualification Documents');
        console.log('------------------------------------------');
        
        // Submit laboratory information
        console.log('Submitting laboratory information...');
        await sdk.submitQualification('laboratory', {
            laboratoryName: 'ECTA Central Laboratory',
            certificationNumber: 'LAB-2026-001',
            equipmentList: ['Moisture Meter', 'Grading Table', 'Sample Roaster'],
            technicians: 3
        });
        console.log('✅ Laboratory information submitted');
        
        // Submit taster information
        console.log('Submitting taster information...');
        await sdk.submitQualification('taster', {
            tasterName: 'Alemayehu Tadesse',
            certificationNumber: 'TASTER-2026-001',
            certificationDate: '2025-01-15',
            experience: '5 years'
        });
        console.log('✅ Taster information submitted');
        
        // Submit competence certificate
        console.log('Submitting competence certificate...');
        await sdk.submitQualification('competenceCertificate', {
            certificateNumber: 'COMP-2026-001',
            issuedBy: 'ECTA Training Center',
            issuedDate: '2025-12-01',
            validUntil: '2028-12-01'
        });
        console.log('✅ Competence certificate submitted');
        console.log();

        // STEP 7: Check Qualification Status
        console.log('STEP 7: Check Qualification Status');
        console.log('------------------------------------------');
        const qualStatus = await sdk.getQualificationStatus();
        console.log('✅ Qualification Status Retrieved');
        console.log('   Profile:', qualStatus.preRegistrationStatus.profile.status);
        console.log('   Laboratory:', qualStatus.preRegistrationStatus.laboratory.status);
        console.log('   Taster:', qualStatus.preRegistrationStatus.taster.status);
        console.log('   Competence:', qualStatus.preRegistrationStatus.competenceCertificate.status);
        console.log();

        // STEP 8: ECTA Approves Qualifications
        console.log('STEP 8: ECTA Approves Qualifications');
        console.log('------------------------------------------');
        console.log('⏳ Simulating ECTA qualification approvals...');
        
        // Approve each qualification stage
        await axios.post(
            `http://localhost:3000/api/ecta/qualifications/${username}/laboratory/approve`,
            { comments: 'Laboratory meets requirements' },
            { headers: { 'Authorization': `Bearer ${ectaSDK.token}` } }
        );
        console.log('✅ Laboratory approved');
        
        await axios.post(
            `http://localhost:3000/api/ecta/qualifications/${username}/taster/approve`,
            { comments: 'Taster certified and qualified' },
            { headers: { 'Authorization': `Bearer ${ectaSDK.token}` } }
        );
        console.log('✅ Taster approved');
        
        await axios.post(
            `http://localhost:3000/api/ecta/qualifications/${username}/competenceCertificate/approve`,
            { comments: 'Competence certificate verified' },
            { headers: { 'Authorization': `Bearer ${ectaSDK.token}` } }
        );
        console.log('✅ Competence certificate approved');
        console.log();

        // STEP 9: ECTA Issues Export License
        console.log('STEP 9: ECTA Issues Export License');
        console.log('------------------------------------------');
        console.log('⏳ Issuing export license...');
        
        const licenseExpiryDate = new Date();
        licenseExpiryDate.setFullYear(licenseExpiryDate.getFullYear() + 1);
        
        await axios.post(
            'http://localhost:3000/api/ecta/license/issue',
            {
                exporterId: username,
                licenseNumber: `LIC-2026-${Date.now()}`,
                expiryDate: licenseExpiryDate.toISOString()
            },
            { headers: { 'Authorization': `Bearer ${ectaSDK.token}` } }
        );
        console.log('✅ Export License Issued');
        console.log('   Exporter is now ACTIVE');
        console.log('   Can create export contracts');
        console.log();

        // STEP 10: Verify Active Status
        console.log('STEP 10: Verify Active Status');
        console.log('------------------------------------------');
        const profile = await sdk.getProfile();
        console.log('✅ Exporter Profile');
        console.log('   Company:', profile.companyName);
        console.log('   Status:', profile.status);
        console.log('   License Number:', profile.licenseNumber);
        console.log('   License Expiry:', profile.licenseExpiryDate);
        console.log();

        // SUCCESS
        console.log('========================================');
        console.log('✅ REGISTRATION FLOW COMPLETE!');
        console.log('========================================');
        console.log('\nSummary:');
        console.log('1. ✅ Exporter registered publicly');
        console.log('2. ✅ ECTA approved registration');
        console.log('3. ✅ Exporter logged in');
        console.log('4. ✅ Submitted qualification documents');
        console.log('5. ✅ ECTA approved qualifications');
        console.log('6. ✅ ECTA issued export license');
        console.log('7. ✅ Exporter is now ACTIVE');
        console.log('\nThe exporter can now create export contracts!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the example
if (require.main === module) {
    registrationFlow();
}

module.exports = registrationFlow;
