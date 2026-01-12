/**
 * Test Script: Create Exports for All 5 Approved Exporters
 * 
 * This script demonstrates creating exports using all 5 approved exporter profiles
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// All 5 approved exporters from the database
const exporters = [
  {
    id: '51ae1dca-9b11-4d6b-b8cc-1004b98a47ec',
    name: 'Debug Coffee Exporters',
    userId: 40
  },
  {
    id: 'd6c5b1d6-6dc3-4f78-ac73-f3e820d11f20',
    name: 'ana',
    userId: 1
  },
  {
    id: '7aeaa77e-5188-4175-8be9-e3086fe37386',
    name: 'Golden Beans Export PLC',
    userId: 41
  },
  {
    id: 'cde259bb-2bff-4546-91f4-64c7a7b549ab',
    name: 'anaaf',
    userId: 34
  },
  {
    id: '2add265c-393c-4a2e-bacb-4a707a1d095e',
    name: 'Premium Coffee Exports Ltd',
    userId: 44
  }
];

// Sample export data for each exporter
const exportData = [
  {
    coffeeType: 'Sidamo Grade 2',
    quantity: 5000,
    destinationCountry: 'USA',
    buyerName: 'American Coffee Importers',
    estimatedValue: 42500
  },
  {
    coffeeType: 'Harar Grade 1',
    quantity: 3000,
    destinationCountry: 'Japan',
    buyerName: 'Tokyo Coffee Trading',
    estimatedValue: 27000
  },
  {
    coffeeType: 'Yirgacheffe Grade 1',
    quantity: 8000,
    destinationCountry: 'Italy',
    buyerName: 'Milano Coffee Roasters',
    estimatedValue: 72000
  },
  {
    coffeeType: 'Limu Grade 2',
    quantity: 4000,
    destinationCountry: 'France',
    buyerName: 'Paris Coffee House',
    estimatedValue: 34000
  },
  {
    coffeeType: 'Jimma Grade 1',
    quantity: 6000,
    destinationCountry: 'Germany',
    buyerName: 'Berlin Coffee Importers',
    estimatedValue: 51000
  }
];

// Login as commercial bank user (has permission to create exports for any exporter)
async function loginAsCommercialBank() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'commercial_bank_user',
      password: 'password123'
    });
    
    if (response.data.success) {
      console.log('✅ Logged in as Commercial Bank user');
      return response.data.data.token;
    }
  } catch (error) {
    // If user doesn't exist, create it
    console.log('ℹ️  Creating Commercial Bank user...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      username: 'commercial_bank_user',
      password: 'password123',
      email: 'bank@commercial.et',
      organizationId: 'commercial-bank',
      role: 'bank_officer'
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Commercial Bank user created and logged in');
      return registerResponse.data.data.token;
    }
  }
}

async function createExportForExporter(authToken, exporter, exportInfo, index) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Creating Export ${index + 1}/5 for: ${exporter.name}`);
    console.log('='.repeat(80));
    
    const response = await axios.post(
      `${BASE_URL}/api/exports`,
      {
        exporterId: exporter.id,  // Specify which exporter
        ...exportInfo
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.success) {
      const exportId = response.data.data.export_id || response.data.data.id;
      console.log(`✅ SUCCESS: Export created`);
      console.log(`   Exporter: ${exporter.name}`);
      console.log(`   Exporter ID: ${exporter.id}`);
      console.log(`   Export ID: ${exportId}`);
      console.log(`   Coffee: ${exportInfo.coffeeType}`);
      console.log(`   Quantity: ${exportInfo.quantity} kg`);
      console.log(`   Destination: ${exportInfo.destinationCountry}`);
      console.log(`   Value: $${exportInfo.estimatedValue.toLocaleString()}`);
      return exportId;
    }
  } catch (error) {
    console.log(`❌ ERROR: Failed to create export for ${exporter.name}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error:`, error.response.data);
    } else {
      console.log(`   Error:`, error.message);
    }
    return null;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║           CREATE EXPORTS FOR ALL 5 APPROVED EXPORTERS                     ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Login
  const authToken = await loginAsCommercialBank();
  if (!authToken) {
    console.log('❌ Failed to login');
    return;
  }
  
  // Create exports for all 5 exporters
  const createdExports = [];
  for (let i = 0; i < exporters.length; i++) {
    const exportId = await createExportForExporter(
      authToken,
      exporters[i],
      exportData[i],
      i
    );
    if (exportId) {
      createdExports.push({
        exporter: exporters[i].name,
        exportId: exportId
      });
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              SUMMARY                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Exporters: ${exporters.length}`);
  console.log(`Exports Created: ${createdExports.length} ✅`);
  console.log(`Failed: ${exporters.length - createdExports.length} ❌`);
  console.log(`Success Rate: ${Math.round((createdExports.length / exporters.length) * 100)}%\n`);
  
  if (createdExports.length > 0) {
    console.log('Created Exports:');
    createdExports.forEach((exp, idx) => {
      console.log(`  ${idx + 1}. ${exp.exporter}: ${exp.exportId}`);
    });
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              TEST COMPLETE                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
}

main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});
