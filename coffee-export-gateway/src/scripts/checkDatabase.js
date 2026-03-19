#!/usr/bin/env node

/**
 * Check Database Script
 * Verifies what data exists in the database
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

async function checkDatabase() {
  try {
    console.log('\n========================================');
    console.log('  DATABASE DIAGNOSTIC CHECK');
    console.log('========================================\n');

    // Check users table
    console.log('USERS TABLE:');
    const usersResult = await pool.query('SELECT username, email, role, is_active FROM users ORDER BY username');
    console.log(`Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - ${user.email} - ${user.is_active ? 'ACTIVE' : 'INACTIVE'}`);
    });
    console.log('');

    // Check exporter_profiles table
    console.log('EXPORTER_PROFILES TABLE:');
    const profilesResult = await pool.query(`
      SELECT user_id, business_name, tin, registration_number, status, email, phone, contact_person 
      FROM exporter_profiles 
      ORDER BY user_id
    `);
    console.log(`Found ${profilesResult.rows.length} exporter profiles:`);
    profilesResult.rows.forEach(profile => {
      console.log(`  - ${profile.user_id}`);
      console.log(`    Business: ${profile.business_name}`);
      console.log(`    TIN: ${profile.tin}`);
      console.log(`    Reg#: ${profile.registration_number}`);
      console.log(`    Status: ${profile.status}`);
      console.log(`    Email: ${profile.email}`);
      console.log(`    Phone: ${profile.phone}`);
      console.log(`    Contact: ${profile.contact_person}`);
    });
    console.log('');

    // Check if exporter1 has profile
    console.log('CHECKING EXPORTER1 SPECIFICALLY:');
    const exporter1 = await pool.query(`
      SELECT ep.*, u.email as user_email
      FROM exporter_profiles ep
      LEFT JOIN users u ON ep.user_id = u.username
      WHERE ep.user_id = 'exporter1' OR u.username = 'exporter1'
    `);
    
    if (exporter1.rows.length > 0) {
      console.log('✓ Found exporter1 profile:');
      console.log(JSON.stringify(exporter1.rows[0], null, 2));
    } else {
      console.log('✗ No exporter1 profile found!');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
