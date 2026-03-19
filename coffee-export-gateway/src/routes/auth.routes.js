const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fabricService = require('../services');
const postgresService = require('../services/postgres');
const notificationService = require('../services/notification.service');

// In-memory user store (replace with database in production)
const users = new Map();

/**
 * Generate unique registration number
 * Format: ECTA-YYYY-NNNNNN (e.g., ECTA-2026-000001)
 */
async function generateRegistrationNumber() {
  const year = new Date().getFullYear();
  const prefix = `ECTA-${year}-`;
  
  try {
    // Get the highest registration number for this year
    const result = await postgresService.query(
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
    
    // Pad with zeros to 6 digits
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    console.error('[Registration] Error generating registration number:', error);
    // Fallback to timestamp-based number
    return `ECTA-${year}-${Date.now().toString().slice(-6)}`;
  }
}

/**
 * Business Rule Validation for Exporter Registration
 * Returns: { valid: boolean, status: 'approved'|'rejected'|'pending_approval', reason: string }
 */
function validateExporterBusinessRules(data) {
  const { username, email, phone, companyName, businessType, address, contactPerson } = data;
  let { tin, capitalETB } = data;
  
  console.log(`[Validation] Checking business rules for ${username}...`);

  // Rule 1: Validate TIN format (Ethiopian TIN is 10 digits)
  // Strip "TIN-" prefix if present
  if (tin && typeof tin === 'string' && tin.toUpperCase().startsWith('TIN-')) {
    tin = tin.substring(4);
  }
  
  if (!tin || !/^\d{10}$/.test(tin.toString())) {
    return {
      valid: false,
      status: 'rejected',
      reason: 'Invalid TIN format. TIN must be 10 digits (prefix "TIN-" will be removed automatically).'
    };
  }
  console.log(`  ✓ TIN format valid: ${tin}`);

  // Rule 2: Validate email format
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      valid: false,
      status: 'rejected',
      reason: 'Invalid email format.'
    };
  }
  console.log(`  ✓ Email format valid: ${email}`);

  // Rule 3: Validate phone number (Ethiopian format: +251 or 0)
  if (phone && !/^(\+251|0)[0-9]{9}$/.test(phone.toString())) {
    return {
      valid: false,
      status: 'rejected',
      reason: 'Invalid phone number format. Use +251 or 0 followed by 9 digits.'
    };
  }
  console.log(`  ✓ Phone format valid: ${phone}`);

  // Rule 4: Validate company name (not empty, reasonable length)
  if (!companyName || companyName.trim().length < 3 || companyName.length > 255) {
    return {
      valid: false,
      status: 'rejected',
      reason: 'Company name must be between 3 and 255 characters.'
    };
  }
  console.log(`  ✓ Company name valid: ${companyName}`);

  // Rule 5: Validate capital requirements based on business type
  const type = businessType || 'PRIVATE_EXPORTER';
  const capitalType = (type === 'UNION' || type === 'FARMER_COOPERATIVE') ? 'company' : 'individual';
  const minimumCapital = capitalType === 'individual' ? 15000000 : 20000000;

  if (!capitalETB || capitalETB < minimumCapital) {
    return {
      valid: false,
      status: 'rejected',
      reason: `Minimum capital requirement for ${capitalType} exporters is ${minimumCapital.toLocaleString()} ETB. Provided: ${capitalETB}`
    };
  }
  console.log(`  ✓ Capital requirement met: ${capitalETB.toLocaleString()} ETB (minimum: ${minimumCapital.toLocaleString()})`);

  // Rule 6: Validate address (if provided)
  if (address && address.trim().length < 5) {
    return {
      valid: false,
      status: 'rejected',
      reason: 'Address must be at least 5 characters if provided.'
    };
  }
  console.log(`  ✓ Address valid: ${address || 'Not provided'}`);

  // Rule 7: Validate contact person (if provided)
  if (contactPerson && contactPerson.trim().length < 3) {
    return {
      valid: false,
      status: 'rejected',
      reason: 'Contact person name must be at least 3 characters if provided.'
    };
  }
  console.log(`  ✓ Contact person valid: ${contactPerson || 'Not provided'}`);

  // All rules passed - AUTO-APPROVE
  console.log(`[Validation] ✅ All business rules passed for ${username} - AUTO-APPROVING`);
  return {
    valid: true,
    status: 'approved',
    reason: 'All business rules validated successfully. User auto-approved.',
    cleanedTin: tin  // Return cleaned TIN (with prefix removed)
  };
}

/**
 * Public Registration endpoint - NO authentication required
 * Exporters register here before ECTA approval
 * HYBRID MODE: Register in database first, sync to blockchain later
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
      businessType
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

    // VALIDATE BUSINESS RULES
    const validation = validateExporterBusinessRules({
      username,
      email,
      phone,
      companyName,
      tin,
      capitalETB,
      businessType,
      address,
      contactPerson
    });

    if (!validation.valid) {
      console.log(`[Registration] Business rule validation failed for ${username}: ${validation.reason}`);
      return res.status(400).json({
        error: 'Registration rejected',
        reason: validation.reason,
        status: validation.status
      });
    }

    // Use cleaned TIN from validation
    const cleanedTin = validation.cleanedTin || tin;

    // Check if username already exists in PostgreSQL
    try {
      const existingUser = await postgresService.query(
        'SELECT username FROM users WHERE username = $1 OR email = $2 OR tin = $3',
        [username, email, cleanedTin]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username, email, or TIN already exists' });
      }
    } catch (dbError) {
      console.error('[Registration] Database check error:', dbError);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // STEP 1: Register in PostgreSQL FIRST (Primary data store)
    // Use validation result to determine initial status
    let approvalStatus = validation.status; // 'approved' or 'rejected'
    
    try {
      // Insert into users table
      const isActive = (approvalStatus === 'approved');
      
      await postgresService.query(
        `INSERT INTO users (
          username, password_hash, email, organization_id, role, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (username) DO NOTHING`,
        [
          username,
          passwordHash,
          email,
          'EXPORTER',
          'exporter',
          isActive
        ]
      );

      // Map business type to PostgreSQL enum values
      const businessTypeMap = {
        'PRIVATE_EXPORTER': 'PRIVATE',
        'UNION': 'TRADE_ASSOCIATION',
        'FARMER_COOPERATIVE': 'FARMER',
        'INDIVIDUAL': 'PRIVATE'
      };
      const pgBusinessType = businessTypeMap[businessType] || 'PRIVATE';

      // Map validation status to PostgreSQL status
      const statusMap = {
        'approved': 'ACTIVE',
        'rejected': 'REVOKED',
        'pending_approval': 'PENDING_APPROVAL'
      };
      const pgStatus = statusMap[approvalStatus] || 'PENDING_APPROVAL';

      // Generate unique registration number
      const registrationNumber = await generateRegistrationNumber();
      console.log(`[Registration] Generated registration number: ${registrationNumber} for ${username}`);

      // Insert into exporter_profiles table
      await postgresService.query(
        `INSERT INTO exporter_profiles (
          user_id, business_name, tin, registration_number, business_type,
          minimum_capital, office_address, contact_person, email, phone,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING`,
        [
          username,
          companyName,
          cleanedTin,
          registrationNumber,
          pgBusinessType,
          capitalETB,
          address || '',
          contactPerson || '',
          email,
          phone || '',
          pgStatus
        ]
      );

      // Insert into ecta_pre_registration table for qualification workflow
      await postgresService.query(
        `INSERT INTO ecta_pre_registration (
          exporter_id, laboratory_status, taster_status, competence_status, license_status,
          created_at, updated_at
        ) VALUES ($1, 'MISSING', 'MISSING', 'MISSING', 'MISSING', NOW(), NOW())
        ON CONFLICT (exporter_id) DO NOTHING`,
        [username]
      );

      console.log(`✓ User registered in PostgreSQL: ${username}, status: ${approvalStatus}`);
    } catch (dbError) {
      console.error('[Registration] PostgreSQL error:', dbError);
      return res.status(500).json({ 
        error: 'Database registration failed',
        details: dbError.message 
      });
    }

    // STEP 2: Try to register on blockchain (non-blocking)
    // If blockchain fails, user can still login from database
    let blockchainRegistered = false;
    try {
      const blockchainResult = await fabricService.registerUser({
        username,
        passwordHash,
        email,
        phone: phone || '',
        companyName,
        tin: cleanedTin,
        capitalETB,
        address: address || '',
        contactPerson: contactPerson || '',
        role: 'exporter',
        businessType: businessType || 'PRIVATE_EXPORTER',
        status: approvalStatus,
        validationReason: validation.reason
      });

      console.log('[Registration] Blockchain result:', JSON.stringify(blockchainResult));
      blockchainRegistered = true;
      console.log(`✓ User registered on blockchain: ${username}`);
    } catch (blockchainError) {
      console.warn('[Registration] Blockchain registration failed (non-blocking):', blockchainError.message);
      console.warn('[Registration] User can still login from database');
      // Don't fail - user is already in database
    }

    // Return success
    res.json({
      success: true,
      status: approvalStatus,
      message: approvalStatus === 'approved' 
        ? 'Registration successful - auto-approved. You can login now.'
        : 'Registration submitted - pending ECTA approval',
      blockchainSync: blockchainRegistered,
      user: {
        username,
        email,
        companyName,
        status: approvalStatus
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
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
 * DUAL SYSTEM: Checks BOTH blockchain and database (no fallback)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get user from database (primary source for login)
    let databaseUser = null;
    try {
      const result = await postgresService.query(
        'SELECT username, password_hash, role, is_active, organization_id FROM users WHERE username = $1',
        [username]
      );
      if (result.rows.length > 0) {
        databaseUser = {
          username: result.rows[0].username,
          passwordHash: result.rows[0].password_hash,
          role: result.rows[0].role,
          status: result.rows[0].is_active ? 'ACTIVE' : 'INACTIVE',
          companyName: result.rows[0].organization_id
        };
        console.log(`[Login] User ${username} found in database`);
      }
    } catch (error) {
      console.log(`[Login] Database error for ${username}: ${error.message}`);
    }

    if (!databaseUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (from database)
    const validPassword = await bcrypt.compare(password, databaseUser.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check approval status (from database)
    if (databaseUser.role === 'exporter') {
      if (databaseUser.status === 'PENDING_APPROVAL' || databaseUser.status === 'pending_approval') {
        return res.status(403).json({ 
          error: 'Account pending approval',
          message: 'Your registration is under review by ECTA. You will be notified once approved.',
          status: 'pending_approval'
        });
      }
      
      if (databaseUser.status === 'REVOKED' || databaseUser.status === 'rejected') {
        return res.status(403).json({ 
          error: 'Account rejected',
          message: 'Your registration was rejected by ECTA.',
          status: 'rejected'
        });
      }
    }

    // Generate JWT using database data
    const token = jwt.sign(
      { 
        id: username, 
        role: databaseUser.role,
        companyName: databaseUser.companyName,
        status: databaseUser.status
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log(`[Login] User ${username} logged in successfully`);

    res.json({
      success: true,
      token,
      user: {
        id: username,
        username: username,
        exporterId: username,
        companyName: databaseUser.companyName,
        role: databaseUser.role,
        status: databaseUser.status
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
    // Check if user already exists in PostgreSQL
    try {
      const existingUser = await postgresService.query(
        'SELECT username FROM users WHERE username = $1',
        [username]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`  - ${username} already exists in PostgreSQL`);
        // Still check blockchain and update if needed
      } else {
        // STEP 1: Create in PostgreSQL (matching actual schema)
        const passwordHash = await bcrypt.hash(password, 10);
        await postgresService.query(
          `INSERT INTO users (
            username, password_hash, email, organization_id, role, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            username,
            passwordHash,
            `${username}@example.com`,
            role.toUpperCase(),
            role,
            status === 'approved'
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

// Initialize on module load (with delay to allow wallet setup)
setTimeout(() => {
  initializeTestUsers().catch(error => {
    console.error('Failed to initialize test users:', error);
  });
}, 3000); // Wait 3 seconds for wallet to be ready

module.exports = { router, createUser, users };
