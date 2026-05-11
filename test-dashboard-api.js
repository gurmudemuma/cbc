const axios = require('axios');
const jwt = require('jsonwebtoken');

// Generate token for exporter1
const token = jwt.sign(
  { id: 'exporter1', role: 'exporter' },
  '8f2a9b7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1f9a8b7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1f',
  { expiresIn: '1h' }
);

console.log('Testing dashboard API for exporter1...\n');

axios.get('http://localhost:3000/api/exporter/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  const data = response.data;
  console.log('=== DASHBOARD RESPONSE ===');
  console.log('Business Name:', data.identity?.businessName);
  console.log('Business Type:', data.identity?.businessType);
  console.log('\n=== COMPLIANCE STATUS ===');
  console.log('Profile Status:', data.compliance?.profileStatus, '- Approved:', data.compliance?.profileApproved);
  console.log('Lab Status:', data.compliance?.laboratoryStatus, '- Approved:', data.compliance?.laboratoryApproved);
  console.log('Taster Status:', data.compliance?.tasterStatus, '- Approved:', data.compliance?.tasterApproved);
  console.log('Competence Status:', data.compliance?.competenceStatus, '- Approved:', data.compliance?.competenceApproved);
  console.log('License Status:', data.compliance?.licenseStatus, '- Approved:', data.compliance?.licenseApproved);
  console.log('\n=== FULLY QUALIFIED ===');
  console.log('isFullyQualified:', data.compliance?.isFullyQualified);
  
  if (data.debug) {
    console.log('\n=== DEBUG INFO ===');
    console.log(JSON.stringify(data.debug, null, 2));
  }
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
