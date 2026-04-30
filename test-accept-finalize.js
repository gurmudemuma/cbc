const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAcceptAndFinalize() {
  try {
    console.log('=== Testing Accept and Auto-Finalize ===\n');
    
    // Step 1: Login as exporter
    console.log('1. Logging in as exporter...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'exporter1',
      password: 'password123'
    });
    
    const exporterToken = loginResponse.data.token;
    console.log('✓ Logged in as exporter1\n');
    
    // Step 2: Create a draft
    console.log('2. Creating contract draft...');
    const draftResponse = await axios.post(
      `${API_BASE}/contracts/drafts`,
      {
        buyerId: '0487c8c0-225a-4a45-a81f-395897ea7891', // Starbucks
        coffeeType: 'SPECIALTY',
        originRegion: 'Ethiopia',
        quantity: 100,
        unitPrice: 5.5,
        currency: 'USD',
        paymentTerms: '30 days after shipment',
        paymentMethod: 'LC',
        incoterms: 'FOB',
        deliveryDate: '2026-06-30',
        portOfLoading: 'Djibouti',
        portOfDischarge: 'Seattle',
        governingLaw: 'Ethiopian Law',
        arbitrationLocation: 'Addis Ababa',
        arbitrationRules: 'ICC Rules',
        contractLanguage: 'English',
        forceMajeureClause: 'Standard force majeure clause',
        qualityGrade: 'Grade 1',
        specialConditions: 'None',
        certificationsRequired: ['Organic', 'Fair Trade']
      },
      {
        headers: { Authorization: `Bearer ${exporterToken}` }
      }
    );
    
    const draftId = draftResponse.data.draft.draft_id;
    console.log(`✓ Draft created: ${draftId}\n`);
    
    // Step 3: Accept the draft (should auto-finalize)
    console.log('3. Accepting draft (should auto-finalize)...');
    const acceptResponse = await axios.post(
      `${API_BASE}/contracts/drafts/${draftId}/accept`,
      {},
      {
        headers: { Authorization: `Bearer ${exporterToken}` }
      }
    );
    
    console.log('\n=== ACCEPT RESPONSE ===');
    console.log(JSON.stringify(acceptResponse.data, null, 2));
    
    // Check if finalization succeeded
    if (acceptResponse.data.success) {
      console.log('\n✓ SUCCESS: Contract accepted and finalized!');
      console.log(`  ECTA Reference: ${acceptResponse.data.ectaReferenceNumber}`);
      console.log(`  Contract ID: ${acceptResponse.data.finalizedContractId}`);
      console.log(`  Buyer: ${acceptResponse.data.buyerInfo?.name} (${acceptResponse.data.buyerInfo?.country})`);
      console.log(`  Exporter: ${acceptResponse.data.exporterInfo?.name} (TIN: ${acceptResponse.data.exporterInfo?.tin})`);
      console.log(`  PostgreSQL: ${acceptResponse.data.syncStatus?.postgres ? 'SUCCESS' : 'FAILED'}`);
      console.log(`  Blockchain: ${acceptResponse.data.syncStatus?.blockchain ? 'SUCCESS' : 'FAILED (non-blocking)'}`);
    } else {
      console.log('\n✗ FAILED: Contract acceptance failed');
    }
    
  } catch (error) {
    console.error('\n✗ ERROR:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAcceptAndFinalize();
