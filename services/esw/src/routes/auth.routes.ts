/**
 * ESW Agency Authentication Routes
 * Handles authentication for government agency users
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const router = Router();
const logger = createLogger('ESW-Auth');

// Agency codes mapping
const AGENCY_CODES = [
  'MOT', 'ERCA', 'NBE', 'MOA', 'MOH', 'EIC', 'EPA',
  'ECTA', 'ECX', 'MOFED', 'MOTI', 'MIDROC', 'QSAE',
  'FDRE_CUSTOMS', 'TRADE_REMEDY'
];

/**
 * POST /api/esw/auth/login
 * Authenticate government agency users
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    logger.info('Agency login attempt', { username });

    const pool = getPool();

    // Query user from database
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.role,
        u.agency_id as agency_code,
        a.agency_name as agency_name,
        a.agency_name as agency_full_name
      FROM users u
      LEFT JOIN esw_agencies a ON u.agency_id = a.agency_code
      WHERE u.username = $1
        AND u.role IN ('AGENCY_USER', 'AGENCY_ADMIN')
        AND u.agency_id IS NOT NULL
    `;

    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      logger.warn('Agency user not found', { username });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      logger.warn('Invalid password for agency user', { username });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify agency code is valid
    if (!AGENCY_CODES.includes(user.agency_code)) {
      logger.error('Invalid agency code', { 
        username, 
        agencyCode: user.agency_code 
      });
      return res.status(403).json({
        success: false,
        message: 'Invalid agency configuration',
      });
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      organization: 'government-agency',
      agencyCode: user.agency_code,
      agencyName: user.agency_name,
      agencyFullName: user.agency_full_name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '24h',
    });

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    logger.info('Agency user logged in successfully', {
      userId: user.id,
      username: user.username,
      agencyCode: user.agency_code,
    });

    // Return user data and token
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organization: 'government-agency',
          agencyCode: user.agency_code,
          agencyName: user.agency_name,
          agencyFullName: user.agency_full_name,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Agency login error', { error });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/esw/auth/profile
 * Get current agency user profile
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const pool = getPool();

    // Get fresh user data
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.agency_id as agency_code,
        a.agency_name as agency_name,
        a.agency_name as agency_full_name
      FROM users u
      LEFT JOIN esw_agencies a ON u.agency_id = a.agency_code
      WHERE u.id = $1
    `;

    const userResult = await pool.query(userQuery, [decoded.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization: 'government-agency',
        agencyCode: user.agency_code,
        agencyName: user.agency_name,
        agencyFullName: user.agency_full_name,
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    logger.error('Get profile error', { error });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
