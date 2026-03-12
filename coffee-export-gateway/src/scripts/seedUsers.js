/**
 * Seed Users Script
 * Creates default users in both PostgreSQL and Blockchain
 * Ensures everyone can login immediately after system start
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'coffee_export_db',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres'
});

// Fabric service (will be loaded after connection check)
let fabricService;
let adminEnrolled = false;

/**
 * Default users to create
 */
const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    email: 'admin@ecta.gov.et',
    companyName: 'Ethiopian Coffee & Tea Authority',
    role: 'admin',
    status: 'approved',
    tin: 'TIN0000000001',
    phone: '+251911000001'
  },
  {
    username: 'exporter1',
    password: 'password123',
    email: 'contact@ethiopiancoffee.com',
    companyName: 'Ethiopian Coffee Exports Ltd',
    role: 'exporter',
    status: 'approved',
    tin: 'TIN0000000002',
    phone: '+251911000002'
  },
  {
    username: 'exporter2',
    password: 'password123',
    email: 'info@addiscoffee.com',
    companyName: 'Addis Coffee Trading PLC',
    role: 'exporter',
    status: 'approved',
    tin: 'TIN0000000003',
    phone: '+251911000003'
  },
  {
    username: 'exporter3',
    password: 'password123',
    email: 'sales@sidamocoffee.com',
    companyName: 'Sidamo Coffee Traders',
    role: 'exporter',
    status: 'pending_approval',
    tin: 'TIN0000000004',
    phone: '+251911000004'
  },
  {
    username: 'bank1',
    password: 'password123',
    email: 'forex@cbe.com.et',
    companyName: 'Commercial Bank of Ethiopia',
    role: 'bank',
    status: 'approved',
    tin: 'TIN0000000005',
    phone: '+251911000005'
  },
  {
    username: 'ecta1',
    password: 'password123',
    email: 'quality@ecta.gov.et',
    companyName: 'ECTA Quality Control Department',
    role: 'ecta',
    status: 'approved',
    tin: 'TIN0000000006',
    phone: '+251911000006'
  },
  {
    username: 'customs1',
    password: 'password123',
    email: 'clearance@customs.gov.et',
    companyName: 'Ethiopian Customs Authority',
    role: 'customs',
    status: 'approved',
    tin: 'TIN0000000007',
    phone: '+251911000007'
  },
  {
    username: 'nbe1',
    password: 'password123',
    email: 'forex@nbe.gov.et',
    companyName: 'National Bank of Ethiopia',
    role: 'nbe',
    status: 'approved',
    tin: 'TIN0000000008',
    phone: '+251911000008'
  },
  {
    username: 'ecx1',
    password: 'password123',
    email: 'trading@ecx.com.et',
    companyName: 'Ethiopian Commodity Exchange',
    role: 'ecx',
    status: 'approved',
    tin: 'TIN0000000009',
    phone: '+251911000009'
  },
  {
    username: 'shipping1',
    password: 'password123',
    email: 'logistics@shipping.com.et',
    companyName: 'Ethiopian Shipping Lines',
    role: 'shipping',
    status: 'approved',
    tin: 'TIN0000000010',
    phone: '+251911000010'
  }
];

/**
 * Create user in PostgreSQL
 */
async function createUserInPostgreSQL(user) {
  try {
    // Check if user exists
    const existing = await pool.query(
      'SELECT username FROM users WHERE username = $1',
      [user.username]
    );

    if (existing.rows.length > 0) {
      console.log(`  - ${user.username} already exists in PostgreSQL`);
      return { exists: true };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(user.password, 10);

    // Insert user (matching actual schema)
    await pool.query(
      `INSERT INTO users (
        username, password_hash, email, organization_id, role, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        user.username,
        passwordHash,
        user.email,
        user.role.toUpperCase(),
        user.role,
        user.status === 'approved'
      ]
    );

    console.log(`  ✓ ${user.username} created in PostgreSQL`);
    return { created: true };
  } catch (error) {
    console.error(`  ✗ PostgreSQL error for ${user.username}:`, error.message);
    return { error: error.message };
  }
}

/**
 * Create user on Blockchain
 */
async function createUserOnBlockchain(user) {
  try {
    // First, ensure admin is enrolled
    if (!adminEnrolled) {
      console.log(`  ⚠ Skipping blockchain for ${user.username} (admin not enrolled)`);
      return { skipped: true };
    }

    // Check if user exists
    try {
      const existingUser = await fabricService.getUser(user.username);
      if (existingUser) {
        console.log(`  - ${user.username} already exists on blockchain`);
        return { exists: true };
      }
    } catch (error) {
      // User doesn't exist, continue (this is expected)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(user.password, 10);

    // Register user on blockchain
    await fabricService.registerUser({
      username: user.username,
      passwordHash,
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      tin: user.tin,
      capitalETB: 50000000,
      address: 'Addis Ababa, Ethiopia',
      contactPerson: user.username,
      role: user.role
    });

    // Update status if approved
    if (user.status === 'approved') {
      await fabricService.updateUserStatus(user.username, {
        status: 'approved',
        approvedBy: 'system',
        comments: 'Default user initialization'
      });
    }

    console.log(`  ✓ ${user.username} created on blockchain`);
    return { created: true };
  } catch (error) {
    console.error(`  ✗ Blockchain error for ${user.username}:`, error.message);
    return { error: error.message };
  }
}

/**
 * Seed all default users
 */
async function seedUsers() {
  console.log('\n========================================');
  console.log('  SEEDING DEFAULT USERS');
  console.log('========================================\n');

  let postgresCount = 0;
  let blockchainCount = 0;
  let errors = 0;

  for (const user of DEFAULT_USERS) {
    console.log(`\nProcessing: ${user.username} (${user.role.toUpperCase()})...`);

    // Create in PostgreSQL
    const pgResult = await createUserInPostgreSQL(user);
    if (pgResult.created) postgresCount++;
    if (pgResult.error) errors++;

    // Create on Blockchain (only if Fabric is available)
    if (fabricService) {
      const bcResult = await createUserOnBlockchain(user);
      if (bcResult.created) blockchainCount++;
      if (bcResult.error) errors++;
    }
  }

  console.log('\n========================================');
  console.log('  SEEDING COMPLETE');
  console.log('========================================\n');
  console.log(`PostgreSQL: ${postgresCount} users created`);
  if (fabricService && adminEnrolled) {
    console.log(`Blockchain: ${blockchainCount} users created`);
  } else if (fabricService && !adminEnrolled) {
    console.log('Blockchain: Skipped (admin not enrolled yet)');
  } else {
    console.log('Blockchain: Skipped (Fabric not available)');
  }
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }
  console.log('\n========================================');
  console.log('  DEFAULT LOGIN CREDENTIALS');
  console.log('========================================\n');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin123\n');
  console.log('Exporters (approved):');
  console.log('  Username: exporter1 / Password: password123');
  console.log('  Username: exporter2 / Password: password123\n');
  console.log('Exporter (pending):');
  console.log('  Username: exporter3 / Password: password123\n');
  console.log('Other roles:');
  console.log('  bank1, ecta1, customs1, nbe1, ecx1, shipping1');
  console.log('  Password: password123\n');
  console.log('========================================\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    // Test PostgreSQL connection
    console.log('Connecting to PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✓ PostgreSQL connected\n');

    // Try to load Fabric service (optional)
    try {
      fabricService = require('../services');
      console.log('✓ Fabric service loaded');
      
      // Check if admin is enrolled - check wallet directory (works for both SDK and CLI)
      const fs = require('fs');
      const path = require('path');
      const walletPath = path.join(process.cwd(), 'wallets', 'admin.id');
      console.log(`  Checking wallet at: ${walletPath}`);
      if (fs.existsSync(walletPath)) {
        adminEnrolled = true;
        console.log('✓ Admin identity found in wallet\n');
      } else {
        console.log('⚠ Admin wallet file not found\n');
        console.log('  Run enrollAdminFromCrypto.js first, then run this script again\n');
      }
    } catch (error) {
      console.log('⚠ Error loading Fabric service\n');
      console.log(`  Error: ${error.message}`);
      console.log(`  Stack: ${error.stack}\n`);
    }

    // Seed users
    await seedUsers();

    // Close connection
    await pool.end();
    console.log('✓ Database connection closed\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedUsers, DEFAULT_USERS };
