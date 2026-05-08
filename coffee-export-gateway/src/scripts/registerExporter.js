require('dotenv').config();
const { registerExporter } = require('../services/fabric');

/**
 * Register a new exporter - for testing/manual registration
 * Usage: node src/scripts/registerExporter.js <exporterId> <companyName> <tin>
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node registerExporter.js <exporterId> <companyName> <tin>');
    console.error('Example: node registerExporter.js exporter1 "Yirgacheffe Coffee Export" 1234567890');
    process.exit(1);
  }

  const [exporterId, companyName, tin] = args;

  try {
    console.log(`Registering exporter: ${exporterId}`);
    const result = await registerExporter(exporterId, { companyName, tin });
    console.log('Registration successful:', result);
    console.log('\nExporter can now login with:');
    console.log(`  Username: ${exporterId}`);
    console.log('  (Set password through admin API)');
    process.exit(0);
  } catch (error) {
    console.error('Failed to register exporter:', error);
    process.exit(1);
  }
}

main();
