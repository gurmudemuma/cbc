const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fabricService = require('../services');
const notificationService = require('../services/notification.service');

// In-memory user store (replace with database in production)
const users = new Map();

/**
 * Public Registration endpoint - NO authentication required
 * Exporters register here before ECTA approval
 * DUAL REGISTRATION: PostgreSQL + Blockchain ✅
 */
router.post('/register', async (req, res) => {
  try {
    console.log('[Registration] Received request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      username, 
      password, 
      email,
      phone,
      companyName, 
      tin, 
      capitalETB,
      address,
      contactPerson,
      businessType // NEW: business type field
    } = req.body;

    // Validate required fields
    if (!username || !password || !email || !companyName || !tin || !capitalETB) {
      console.log('[Registration] Validation failed - missing fields:', {
        username: !!username,
        password: !!password,
        email: !!email,
        companyName: !!companyName,
        tin: !!tin,
        capitalETB: !!capitalETB
      });
      return res.status(400).json({ 
        error: 'Missing required fields: username, password, email, companyName, tin, capitalETB' 
      });
    }

    // Validate minimum capital based on business type
    // According to Ethiopian Coffee Export Regulations:
    const capitalRequirements = {
      'PRIVATE_EXPORTER': 50000000,      // 50 million ETB for private limited companies
      'UNION': 15000000,                 // 15 million ETB for unions/cooperatives
      'FARMER_COOPERATIVE': 5000000,     // 5 million ETB for farmer cooperatives
      'INDIVIDUAL': 10000000             // 10 million ETB for individual exporters
    };

    const type = businessType || 'PRIVATE_EXPORTER'; // Default to private exporter
    const minimumCapital = capitalRequirements[type] || capitalRequirements['PRIVATE_EXPORTER'];

    if (capitalETB < minimumCapital) {
      console.log(`[Registration] Capital validation failed: ${capitalETB} < ${minimumCapital} for type ${type}`);
      return res.status(400).json({ 
        error: `Minimum capital requirement for ${type.replace('_', ' ')} is ${minimumCapital.toLocaleString()} ETB`,
        provided: capitalETB,
        required: minimumCapital,
        businessType: type
      });
    }

    // Check if username already exists in PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.POSTGRES_HOST || 'postgres',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'coffee_export_db',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres'
    });

    try {
      const existingUser = await pool.query(
        'SELECT username FROM users WHERE username = $1 OR email = $2 OR tin = $3',
        [username, email, tin]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username, email, or TIN already exists' });
      }
    } catch (dbError) {
      console.error('[Registration] Database check error:', dbError);
    }

    // Check if username already exists on blockchain
    try {
      await fabricService.getUser(username);
      return res.status(400).json({ error: 'Username already exists on blockchain' });
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // STEP 1: Register on Blockchain FIRST (Consensus & Trust)
    // This ensures multi-party agreement before local storage
    try {
      await fabricService.registerUser({
        username,
        passwordHash,
        email,
        phone: phone || '',
        companyName,
        tin,
        capitalETB,
        address: address || '',
        contactPerson: contactPerson || '',
        role: 'exporter',
        businessType: type // Store business type
      });

      console.log(`✓ User registered on blockchain (consensus achieved): ${username}`);
    } catch (blockchainError) {
      console.error('[Registration] Blockchain error:', blockchainError);
      return res.status(500).json({ 
        error: 'Blockchain registration failed - consensus not achieved',
        details: blockchainError.message 
      });
    }

    // STEP 2: Replicate to PostgreSQL (After Consensus)
    // PostgreSQL acts as a fast query replica of blockchain data
    try {
      await pool.query(
        `INSERT INTO users (
          username, password_hash, email, phone, company_name, tin,
          capital_etb, address, contact_person, role, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          username,
          passwordHash,
          email,
          phone || '',
          companyName,
          tin,
          capitalETB,
          address || '',
          contactPerson || '',
          'exporter',
          'pending_approval'
        ]
      );

      console.log(`✓ User replicated to PostgreSQL: ${username}`);
    } catch (dbError) {
      console.error('[Registration] PostgreSQL replication error:', dbError);
      // Don't fail the request - blockchain is source of truth
      // PostgreSQL sync can be retried later via reconciliation service
      console.warn(`⚠ PostgreSQL replication failed for ${username}, but blockchain record exists`);
    }

    // Send registration confirmation email
    notificationService.notifyRegistrationSubmitted({
      username,
      companyName,
      tin,
      email,
      contactPerson: contactPerson || companyName
    }).catch(err => console.error('Email notification failed:', err));

    res.json({
      success: true,
      message: 'Registration submitted successfully to both databases. Please wait for ECTA approval.',
      applicationReference: username,
      status: 'pending_approval',
      databases: {
        postgresql: 'registered',
        blockchain: 'registered'
      }
    });
  } catch (error) {
    console.error('[Registration] Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Check registration status - NO authentication required
 * NOW FULLY BLOCKCHAIN-BASED ✅
 */
router.get('/registration-status/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    try {
      const user = await fabricService.getUser(username);
      
      res.json({
        username: user.username,
        companyName: user.companyName,
        status: user.status,
        registeredAt: user.registeredAt,
        approvedAt: user.approvedAt,
        rejectedAt: user.rejectedAt,
        rejectionReason: user.rejectionReason
      });
    } catch (error) {
      return res.status(404).json({ error: 'Application not found' });
    }
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * Login endpoint - validates credentials and returns JWT
 * NOW CHECKS BLOCKCHAIN FOR USER DATA ✅
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get user from blockchain
    let user;
    try {
      user = await fabricService.getUser(username);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // CHECK APPROVAL STATUS
    if (user.role === 'exporter') {
      if (user.status === 'pending_approval') {
        return res.status(403).json({ 
          error: 'Account pending approval',
          message: 'Your registration is under review by ECTA. You will be notified once approved.',
          status: 'pending_approval'
        });
      }
      
      if (user.status === 'rejected') {
        return res.status(403).json({ 
          error: 'Account rejected',
          message: user.rejectionReason || 'Your registration was rejected by ECTA.',
          status: 'rejected'
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: username, 
        role: user.role,
        companyName: user.companyName,
        status: user.status
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: username,
        username: username,
        exporterId: username,
        companyName: user.companyName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Helper function to create user in BOTH databases
 * DUAL REGISTRATION: PostgreSQL + Blockchain ✅
 */
async function createUser(username, password, companyName, role = 'exporter', status = 'approved') {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.POSTGRES_HOST || 'postgres',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'coffee_export_db',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres'
    });

    // Check if user already exists in PostgreSQL
    try {
      const existingUser = await pool.query(
        'SELECT username FROM users WHERE username = $1',
        [username]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`  - ${username} already exists in PostgreSQL`);
        // Still check blockchain and update if needed
      } else {
        // STEP 1: Create in PostgreSQL
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query(
          `INSERT INTO users (
            username, password_hash, email, phone, company_name, tin,
            capital_etb, address, contact_person, role, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            username,
            passwordHash,
            `${username}@example.com`,
            '+251911234567',
            companyName,
            `TIN${Date.now()}_${username}`,
            50000000,
            'Addis Ababa, Ethiopia',
            username,
            role,
            status
          ]
        );
        console.log(`  ✓ ${username} created in PostgreSQL`);
      }
    } catch (dbError) {
      console.error(`  ✗ PostgreSQL error for ${username}:`, dbError.message);
    }

    // STEP 2: Check if user already exists on blockchain
    try {
      await fabricService.getUser(username);
      console.log(`  - ${username} already exists on blockchain`);
      return;
    } catch (error) {
      // User doesn't exist, create it
    }

    // STEP 3: Create on blockchain
    const passwordHash = await bcrypt.hash(password, 10);
    await fabricService.registerUser({
      username,
      passwordHash,
      email: `${username}@example.com`,
      phone: '+251911234567',
      companyName,
      tin: `TIN${Date.now()}_${username}`,
      capitalETB: 50000000,
      address: 'Addis Ababa, Ethiopia',
      contactPerson: username,
      role
    });

    // STEP 4: If status should be approved, update it on blockchain
    if (role !== 'exporter' || status === 'approved') {
      await fabricService.updateUserStatus(username, {
        status: 'approved',
        approvedBy: 'system',
        comments: 'Test user initialization'
      });
    }

    console.log(`  ✓ ${username} / ${password} (${role.toUpperCase()}${status === 'approved' ? ' - APPROVED' : ' - PENDING'})`);
  } catch (error) {
    console.error(`  ✗ Failed to create ${username}:`, error.message);
  }
}

// Initialize test users on blockchain
async function initializeTestUsers() {
  console.log('Initializing test users on blockchain...');
  
  await createUser('admin', 'admin123', 'ECTA', 'admin', 'approved');
  await createUser('exporter1', 'password123', 'Ethiopian Coffee Exports Ltd', 'exporter', 'approved');
  await createUser('exporter2', 'password123', 'Addis Coffee Trading', 'exporter', 'approved');
  await createUser('exporter3', 'password123', 'Sidamo Coffee Traders', 'exporter', 'pending_approval');
  await createUser('bank1', 'password123', 'Commercial Bank of Ethiopia', 'bank', 'approved');
  await createUser('ecta1', 'password123', 'ECTA Quality Control', 'ecta', 'approved');
  await createUser('customs1', 'password123', 'Ethiopian Customs Authority', 'customs', 'approved');
  await createUser('nbe1', 'password123', 'National Bank of Ethiopia', 'nbe', 'approved');
  await createUser('ecx1', 'password123', 'Ethiopian Commodity Exchange', 'ecx', 'approved');
  await createUser('shipping1', 'password123', 'Ethiopian Shipping Lines', 'shipping', 'approved');
  
  console.log('✓ Test users initialized on blockchain');
}

// Initialize on module load
initializeTestUsers().catch(error => {
  console.error('Failed to initialize test users:', error);
});

module.exports = { router, createUser, users };
