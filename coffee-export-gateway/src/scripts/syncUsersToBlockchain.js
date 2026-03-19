/**
 * Sync Users to Blockchain
 * Syncs PostgreSQL users to Hyperledger Fabric blockchain
 * Run this after system is fully initialized
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const dbConfig = {
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'coffee_export_db',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres'
};

const pool = new Pool(dbConfig);
let fabricService;

async function syncUsersToBlockchain() {
  try {
    console.log('\n========================================');
    console.log('  SYNCING USERS TO BLOCKCHAIN');
    console.log('========================================\n');

    // Load Fabric service
    try {
      fabricService = require('../services');
      console.log('✓ Fabric service loaded\n');
    } catch (error) {
      console.error('✗ Failed to load Fabric service:', error.message);
      console.log('  Make sure blockchain infrastructure is running\n');
      process.exit(1);
    }

    // Get all users from PostgreSQL
    const result = await pool.query(
      'SELECT username, password_hash, email, role FROM users ORDER BY username'
    );

    console.log(`Found ${result.rows.length} users to sync\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of result.rows) {
      try {
        console.log(`Syncing: ${user.username} (${user.role.toUpperCase()})...`);

        // Check if user already exists on blockchain
        try {
          const existing = await fabricService.getUser(user.username);
          if (existing) {
            console.log(`  - Already exists on blockchain`);
            skipped++;
            continue;
          }
        } catch (error) {
          // User doesn't exist, continue
        }

        // Register user on blockchain
        await fabricService.registerUser({
          username: user.username,
          passwordHash: user.password_hash,
          email: user.email,
          phone: '',
          companyName: user.username,
          tin: '',
          capitalETB: 0,
          address: 'Addis Ababa, Ethiopia',
          contactPerson: user.username,
          role: user.role
        });

        console.log(`  ✓ Synced to blockchain`);
        synced++;
      } catch (error) {
        console.error(`  ✗ Error:`, error.message);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('  SYNC COMPLETE');
    console.log('========================================\n');
    console.log(`Synced: ${synced} users`);
    console.log(`Skipped: ${skipped} users (already exist)`);
    if (errors > 0) {
      console.log(`Errors: ${errors}`);
    }
    console.log('\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Sync failed:', error);
    process.exit(1);
  }
}

syncUsersToBlockchain();
