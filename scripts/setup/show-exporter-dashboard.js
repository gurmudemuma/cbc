const http = require('http');

function makeRequest(port, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port, path, method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(username, password) {
  const res = await makeRequest(3004, '/api/auth/login', 'POST', { username, password });
  return res.statusCode === 200 ? res.data.data.token : null;
}

async function showExporterDashboard() {
  console.log('');
  console.log('          EXPORTER APPLICATION STATUS DASHBOARD           ');
  console.log('\n');
  
  const token = await login('exporter1', 'password123');
  if (!token) {
    console.log(' Login failed');
    return;
  }
  
  // Get qualification status
  const qualRes = await makeRequest(3004, '/api/exporter/qualification-status', 'GET', null, token);
  
  if (qualRes.statusCode !== 200) {
    console.log(' Failed to get qualification status');
    return;
  }
  
  const qual = qualRes.data.data;
  const v = qual.validation;
  
  console.log(' BUSINESS PROFILE');
  console.log(''.repeat(60));
  console.log(`  Business Name:        ${v.profile.businessName}`);
  console.log(`  TIN:                  ${v.profile.tin}`);
  console.log(`  Registration Number:  ${v.profile.registrationNumber}`);
  console.log(`  Business Type:        ${v.profile.businessType}`);
  console.log(`  Status:               ${v.profile.status === 'ACTIVE' ? ' ACTIVE' : ' ' + v.profile.status}`);
  console.log(`  Email:                ${v.profile.email}`);
  console.log(`  Phone:                ${v.profile.phone}`);
  console.log(`  Address:              ${v.profile.officeAddress}, ${v.profile.city}`);
  
  console.log('\n\n CAPITAL VERIFICATION');
  console.log(''.repeat(60));
  console.log(`  Minimum Capital:      ETB ${v.profile.minimumCapital.toLocaleString()}`);
  console.log(`  Capital Verified:     ${v.profile.capitalVerified ? ' YES' : ' NO'}`);
  if (v.profile.capitalVerificationDate) {
    console.log(`  Verification Date:    ${new Date(v.profile.capitalVerificationDate).toLocaleDateString()}`);
  }
  console.log(`  Approved By:          ${v.profile.approvedBy || 'N/A'}`);
  
  console.log('\n\n COFFEE LABORATORY');
  console.log(''.repeat(60));
  if (v.laboratory) {
    console.log(`  Laboratory Name:      ${v.laboratory.laboratoryName}`);
    console.log(`  Address:              ${v.laboratory.address}`);
    console.log(`  Status:               ${v.laboratory.status === 'ACTIVE' ? ' ACTIVE' : ' ' + v.laboratory.status}`);
    console.log(`  Certified Date:       ${new Date(v.laboratory.certifiedDate).toLocaleDateString()}`);
    console.log(`  Expiry Date:          ${new Date(v.laboratory.expiryDate).toLocaleDateString()}`);
    console.log(`  Roasting Facility:    ${v.laboratory.hasRoastingFacility ? ' YES' : ' NO'}`);
    console.log(`  Cupping Room:         ${v.laboratory.hasCuppingRoom ? ' YES' : ' NO'}`);
    console.log(`  Sample Storage:       ${v.laboratory.hasSampleStorage ? ' YES' : ' NO'}`);
  } else {
    console.log('   No laboratory registered');
  }
  
  console.log('\n\n COFFEE TASTER');
  console.log(''.repeat(60));
  if (v.taster) {
    console.log(`  Full Name:            ${v.taster.fullName}`);
    console.log(`  Qualification:        ${v.taster.qualificationLevel}`);
    console.log(`  Certificate Number:   ${v.taster.proficiencyCertificateNumber}`);
    console.log(`  Status:               ${v.taster.status === 'ACTIVE' ? ' ACTIVE' : ' ' + v.taster.status}`);
    console.log(`  Certificate Issued:   ${new Date(v.taster.certificateIssueDate).toLocaleDateString()}`);
    console.log(`  Certificate Expires:  ${new Date(v.taster.certificateExpiryDate).toLocaleDateString()}`);
    console.log(`  Employment Start:     ${new Date(v.taster.employmentStartDate).toLocaleDateString()}`);
    console.log(`  Exclusive Employee:   ${v.taster.isExclusiveEmployee ? ' YES' : ' NO'}`);
  } else {
    console.log('   No taster registered');
  }
  
  console.log('\n\n COMPETENCE CERTIFICATE');
  console.log(''.repeat(60));
  if (v.competenceCertificate) {
    console.log(`  Certificate Number:   ${v.competenceCertificate.certificateNumber}`);
    console.log(`  Status:               ${v.competenceCertificate.status === 'ACTIVE' ? ' ACTIVE' : ' ' + v.competenceCertificate.status}`);
    console.log(`  Issued Date:          ${new Date(v.competenceCertificate.issuedDate).toLocaleDateString()}`);
    console.log(`  Expiry Date:          ${new Date(v.competenceCertificate.expiryDate).toLocaleDateString()}`);
    console.log(`  Facility Inspected:   ${v.competenceCertificate.inspectionPassed ? ' PASSED' : ' FAILED'}`);
    console.log(`  QMS System:           ${v.competenceCertificate.hasQualityManagementSystem ? ' YES' : ' NO'}`);
    console.log(`  Approved By:          ${v.competenceCertificate.approvedBy}`);
  } else {
    console.log('   No competence certificate issued');
  }
  
  console.log('\n\n EXPORT LICENSE');
  console.log(''.repeat(60));
  if (v.exportLicense) {
    console.log(`  License Number:       ${v.exportLicense.licenseNumber}`);
    console.log(`  EIC Registration:     ${v.exportLicense.eicRegistrationNumber}`);
    console.log(`  Status:               ${v.exportLicense.status === 'ACTIVE' ? ' ACTIVE' : ' ' + v.exportLicense.status}`);
    console.log(`  Issued Date:          ${new Date(v.exportLicense.issuedDate).toLocaleDateString()}`);
    console.log(`  Expiry Date:          ${new Date(v.exportLicense.expiryDate).toLocaleDateString()}`);
    console.log(`  Annual Quota:         ${v.exportLicense.annualQuota.toLocaleString()} kg`);
    console.log(`  Approved By:          ${v.exportLicense.approvedBy}`);
    console.log(`  Authorized Coffee:    ${v.exportLicense.authorizedCoffeeTypes.join(', ')}`);
    console.log(`  Authorized Origins:   ${v.exportLicense.authorizedOrigins.join(', ')}`);
  } else {
    console.log('   No export license issued');
  }
  
  console.log('\n\n QUALIFICATION SUMMARY');
  console.log(''.repeat(60));
  console.log(`  Valid Profile:        ${v.hasValidProfile ? '' : ''}`);
  console.log(`  Minimum Capital:      ${v.hasMinimumCapital ? '' : ''}`);
  console.log(`  Certified Laboratory: ${v.hasCertifiedLaboratory ? '' : ''}`);
  console.log(`  Qualified Taster:     ${v.hasQualifiedTaster ? '' : ''}`);
  console.log(`  Competence Cert:      ${v.hasCompetenceCertificate ? '' : ''}`);
  console.log(`  Export License:       ${v.hasExportLicense ? '' : ''}`);
  
  console.log('\n\n EXPORT ELIGIBILITY');
  console.log(''.repeat(60));
  if (qual.canCreateExportRequest) {
    console.log('   YOU ARE QUALIFIED TO CREATE EXPORT REQUESTS!');
    console.log('\n  You can now:');
    console.log('     Create new export requests');
    console.log('     Submit exports for ECX lot verification');
    console.log('     Apply for ECTA quality certification');
    console.log('     Request bank document verification');
    console.log('     Track export status through completion');
  } else {
    console.log('   NOT YET QUALIFIED TO EXPORT');
    if (v.issues.length > 0) {
      console.log('\n  Issues:');
      v.issues.forEach(issue => console.log(`     ${issue}`));
    }
    if (v.requiredActions.length > 0) {
      console.log('\n  Required Actions:');
      v.requiredActions.forEach(action => console.log(`     ${action}`));
    }
  }
  
  // Get export stats
  const statsRes = await makeRequest(3004, '/api/exports/stats', 'GET', null, token);
  if (statsRes.statusCode === 200) {
    const stats = statsRes.data.data;
    console.log('\n\n EXPORT STATISTICS');
    console.log(''.repeat(60));
    console.log(`  Total Exports:        ${stats.totalExports}`);
    console.log(`  Total Value:          ETB ${stats.totalValue.toLocaleString()}`);
    console.log(`  Completed Exports:    ${stats.completedExports}`);
    console.log(`  Active Shipments:     ${stats.activeShipments}`);
    console.log(`  Pending Action:       ${stats.pendingAction}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(' Dashboard Complete');
  console.log('='.repeat(60));
}

showExporterDashboard().catch(e => console.error('Error:', e.message));
