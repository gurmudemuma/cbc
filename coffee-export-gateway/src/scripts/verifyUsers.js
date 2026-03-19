#!/usr/bin/env node

/**
 * Verify Users Script
 * Checks if default users exist in the database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'coffee_export_db',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres'
});

async function verifyUsers() {
  try {
    console.log('\n========================================');
    console.log('  VERIFYING USERS IN DATABASE');
    console.log('========================================\n');

    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('✗ Users table does not exist!');
      process.exit(1);
    }

    console.log('✓ Users table exists\n');

    // Get all users
    const result = await pool.query('SELECT username, email, role, is_active FROM users ORDER BY username');

    if (result.rows.length === 0) {
      console.log('✗ No users found in database!\n');
      console.log('Run: npm run seed\n');
      process.exit(1);
    }

    console.log(`Found ${result.rows.length} users:\n`);
    result.rows.forEach(user => {
      const status = user.is_active ? '✓ ACTIVE' : '✗ INACTIVE';
      console.log(`  ${status}  ${user.username.padEnd(15)} (${user.role.padEnd(10)}) - ${user.email}`);
    });

    console.log('\n========================================');
    console.log('  TEST CREDENTIALS');
    console.log('========================================\n');
    console.log('Admin:     admin / admin123');
    console.log('Exporter1: exporter1 / password123');
    console.log('Exporter2: exporter2 / password123\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

verifyUsers();
