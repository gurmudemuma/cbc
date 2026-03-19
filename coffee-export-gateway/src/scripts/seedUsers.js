/**
 * Seed Users Script
 * Creates default users in both PostgreSQL and Blockchain
 * Ensures everyone can login immediately after system start
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// PostgreSQL connection
const dbConfig = {
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'coffee_export_db',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres'
};

console.log('[Seed] Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user
});

const pool = new Pool(dbConfig);

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
    phone: '+251911000002',
    businessType: 'PRIVATE',
    capitalETB: 15000000,
    address: 'Addis Ababa, Ethiopia',
    contactPerson: 'Abebe Kebede',
    city: 'Addis Ababa',
    region: 'Addis Ababa'
  },
  {
    username: 'exporter2',
    password: 'password123',
    email: 'info@addiscoffee.com',
    companyName: 'Addis Coffee Trading PLC',
    role: 'exporter',
    status: 'approved',
    tin: 'TIN0000000003',
    phone: '+251911000003',
    businessType: 'JOINT_STOCK',
    capitalETB: 20000000,
    address: 'Addis Ababa, Ethiopia',
    contactPerson: 'Almaz Tadesse',
    city: 'Addis Ababa',
    region: 'Addis Ababa'
  },
  {
    username: 'exporter3',
    password: 'password123',
    email: 'sales@sidamocoffee.com',
    companyName: 'Sidamo Coffee Traders',
    role: 'exporter',
    status: 'pending_approval',
    tin: 'TIN0000000004',
    phone: '+251911000004',
    businessType: 'LLC',
    capitalETB: 15000000,
    address: 'Sidamo, Ethiopia',
    contactPerson: 'Girma Assefa',
    city: 'Sidamo',
    region: 'SNNPR'
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
      // Continue to create exporter profile if needed
    } else {
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
    }

    // If exporter, create/update exporter_profile with registration number
    if (user.role === 'exporter') {
      // Check if exporter profile already exists
      const profileExists = await pool.query(
        'SELECT user_id FROM exporter_profiles WHERE user_id = $1',
        [user.username]
      );

      if (profileExists.rows.length > 0) {
        console.log(`  ✓ ${user.username} profile already exists`);
      } else {
        // Generate registration number
        const year = new Date().getFullYear();
        const prefix = `ECTA-${year}-`;
        
        const result = await pool.query(
          `SELECT registration_number FROM exporter_profiles 
           WHERE registration_number LIKE $1 
           ORDER BY registration_number DESC 
           LIMIT 1`,
          [`${prefix}%`]
        );
        
        let nextNumber = 1;
        if (result.rows.length > 0) {
          const lastRegNum = result.rows[0].registration_number;
          const lastNumber = parseInt(lastRegNum.split('-')[2]);
          nextNumber = lastNumber + 1;
        }
        
        const paddedNumber = nextNumber.toString().padStart(6, '0');
        const registrationNumber = `${prefix}${paddedNumber}`;

        // Insert exporter profile with all data
        const insertResult = await pool.query(
          `INSERT INTO exporter_profiles (
            user_id, business_name, tin, registration_number, business_type,
            minimum_capital, office_address, city, region, contact_person, email, phone,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          RETURNING exporter_id`,
          [
            user.username,
            user.companyName,
            user.tin,
            registrationNumber,
            user.businessType || 'PRIVATE',
            user.capitalETB || 15000000,
            user.address || 'Addis Ababa, Ethiopia',
            user.city || 'Addis Ababa',
            user.region || 'Addis Ababa',
            user.contactPerson || user.companyName,
            user.email,
            user.phone,
            user.status === 'approved' ? 'ACTIVE' : 'PENDING_APPROVAL'
          ]
        );

        console.log(`  ✓ ${user.username} profile created with registration number: ${registrationNumber}`);
      }
    } else if (existing.rows.length > 0) {
      console.log(`  ✓ ${user.username} already exists in PostgreSQL`);
    } else {
      console.log(`  ✓ ${user.username} created in PostgreSQL`);
    }
    
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
  // Blockchain disabled during seeding
  // Users are created in PostgreSQL only
  return { skipped: true };
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
  console.log('Blockchain: Skipped (disabled during seeding)');
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

    // Blockchain operations are disabled during seeding
    // Users are created in PostgreSQL only
    console.log('⚠ Blockchain operations disabled during seeding');
    console.log('  Users will be created in PostgreSQL only');
    console.log('  Blockchain sync can be done separately after system is running\n');

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
