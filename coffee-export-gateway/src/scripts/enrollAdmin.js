require('dotenv').config();
const { enrollAdmin } = require('../services/fabric');

/**
 * Enroll admin user - run this once during initial setup
 */
async function main() {
  try {
    console.log('Enrolling admin user...');
    await enrollAdmin();
    console.log('Admin enrollment complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to enroll admin:', error);
    process.exit(1);
  }
}

main();
