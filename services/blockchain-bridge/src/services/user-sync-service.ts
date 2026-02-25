/**
 * User Sync Service
 * Synchronizes user data between PostgreSQL (CBC) and Hyperledger Fabric
 */

import { logger } from '../utils/logger';
import { FabricClient } from '../clients/fabric-client';
import { KafkaProducer } from './kafka-producer';
import pool from '../config/database';
import bcrypt from 'bcrypt';

interface User {
  id?: number;
  username: string;
  password_hash: string;
  email: string;
  phone: string;
  company_name: string;
  tin: string;
  capital_etb: number;
  address: string;
  contact_person: string;
  role: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export class UserSyncService {
  private static isInitialized = false;

  /**
   * Initialize test users in both PostgreSQL and Blockchain
   */
  static async initializeTestUsers(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Test users already initialized');
      return;
    }

    logger.info('Initializing test users in PostgreSQL and Blockchain...');

    const testUsers = [
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@ecta.gov.et',
        phone: '+251911234567',
        companyName: 'ECTA',
        tin: `TIN${Date.now()}_admin`,
        capitalETB: 50000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'admin',
        role: 'admin',
        status: 'approved'
      },
      {
        username: 'exporter1',
        password: 'password123',
        email: 'exporter1@example.com',
        phone: '+251911234567',
        companyName: 'Ethiopian Coffee Exports Ltd',
        tin: `TIN${Date.now()}_exporter1`,
        capitalETB: 5000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'exporter1',
        role: 'exporter',
        status: 'approved'
      },
      {
        username: 'exporter2',
        password: 'password123',
        email: 'exporter2@example.com',
        phone: '+251911234567',
        companyName: 'Addis Coffee Trading',
        tin: `TIN${Date.now()}_exporter2`,
        capitalETB: 3000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'exporter2',
        role: 'exporter',
        status: 'approved'
      },
      {
        username: 'bank1',
        password: 'password123',
        email: 'bank1@example.com',
        phone: '+251911234567',
        companyName: 'Commercial Bank of Ethiopia',
        tin: `TIN${Date.now()}_bank1`,
        capitalETB: 50000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'bank1',
        role: 'bank',
        status: 'approved'
      },
      {
        username: 'ecta1',
        password: 'password123',
        email: 'ecta1@example.com',
        phone: '+251911234567',
        companyName: 'ECTA Quality Control',
        tin: `TIN${Date.now()}_ecta1`,
        capitalETB: 50000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'ecta1',
        role: 'ecta',
        status: 'approved'
      },
      {
        username: 'customs1',
        password: 'password123',
        email: 'customs1@example.com',
        phone: '+251911234567',
        companyName: 'Ethiopian Customs Authority',
        tin: `TIN${Date.now()}_customs1`,
        capitalETB: 50000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'customs1',
        role: 'customs',
        status: 'approved'
      },
      {
        username: 'nbe1',
        password: 'password123',
        email: 'nbe1@example.com',
        phone: '+251911234567',
        companyName: 'National Bank of Ethiopia',
        tin: `TIN${Date.now()}_nbe1`,
        capitalETB: 50000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'nbe1',
        role: 'nbe',
        status: 'approved'
      },
      {
        username: 'ecx1',
        password: 'password123',
        email: 'ecx1@example.com',
        phone: '+251911234567',
        companyName: 'Ethiopian Commodity Exchange',
        tin: `TIN${Date.now()}_ecx1`,
        capitalETB: 50000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'ecx1',
        role: 'ecx',
        status: 'approved'
      },
      {
        username: 'shipping1',
        password: 'password123',
        email: 'shipping1@example.com',
        phone: '+251911234567',
        companyName: 'Ethiopian Shipping Lines',
        tin: `TIN${Date.now()}_shipping1`,
        capitalETB: 50000000,
        address: 'Addis Ababa, Ethiopia',
        contactPerson: 'shipping1',
        role: 'shipping',
        status: 'approved'
      }
    ];

    for (const userData of testUsers) {
      try {
        await this.createUserInBothSystems(userData);
        logger.info(`✓ Created user: ${userData.username} (${userData.role})`);
      } catch (error: any) {
        logger.error(`✗ Failed to create user ${userData.username}:`, {
          message: error.message,
          stack: error.stack,
          details: error
        });
      }
    }

    this.isInitialized = true;
    logger.info('✓ Test users initialized successfully');
  }

  /**
   * Create user in both PostgreSQL and Blockchain
   */
  static async createUserInBothSystems(userData: {
    username: string;
    password: string;
    email: string;
    phone: string;
    companyName: string;
    tin: string;
    capitalETB: number;
    address: string;
    contactPerson: string;
    role: string;
    status: string;
  }): Promise<void> {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // 1. Check if user exists in PostgreSQL
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [userData.username]
    );

    let userId: number;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      logger.info(`User ${userData.username} already exists in PostgreSQL`);
    } else {
      // 2. Create user in PostgreSQL
      const result = await pool.query(
        `INSERT INTO users (
          username, password_hash, email, phone, company_name, tin,
          capital_etb, address, contact_person, role, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id`,
        [
          userData.username,
          passwordHash,
          userData.email,
          userData.phone,
          userData.companyName,
          userData.tin,
          userData.capitalETB,
          userData.address,
          userData.contactPerson,
          userData.role,
          userData.status
        ]
      );
      userId = result.rows[0].id;
      logger.info(`Created user ${userData.username} in PostgreSQL with ID: ${userId}`);
    }

    // 3. Create user on Blockchain
    try {
      await FabricClient.registerUser({
        username: userData.username,
        passwordHash,
        email: userData.email,
        phone: userData.phone,
        companyName: userData.companyName,
        tin: userData.tin,
        capitalETB: userData.capitalETB,
        address: userData.address,
        contactPerson: userData.contactPerson,
        role: userData.role
      });

      // 4. Update user status on blockchain if approved
      if (userData.status === 'approved') {
        await FabricClient.updateUserStatus(userData.username, {
          status: 'approved',
          approvedBy: 'system',
          comments: 'Test user initialization'
        });
      }

      logger.info(`Created user ${userData.username} on Blockchain`);
    } catch (error: any) {
      // If user already exists on blockchain, that's okay
      if (error.message && error.message.includes('already exists')) {
        logger.info(`User ${userData.username} already exists on Blockchain`);
      } else {
        throw error;
      }
    }

    // 5. Publish user creation event to Kafka
    await KafkaProducer.publish('user.created', {
      userId,
      username: userData.username,
      role: userData.role,
      status: userData.status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sync user from PostgreSQL to Blockchain
   */
  static async syncUserToBlockchain(username: string): Promise<void> {
    try {
      // Get user from PostgreSQL
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        throw new Error(`User ${username} not found in PostgreSQL`);
      }

      const user = result.rows[0];

      // Sync to blockchain
      await FabricClient.registerUser({
        username: user.username,
        passwordHash: user.password_hash,
        email: user.email,
        phone: user.phone,
        companyName: user.company_name,
        tin: user.tin,
        capitalETB: user.capital_etb,
        address: user.address,
        contactPerson: user.contact_person,
        role: user.role
      });

      if (user.status === 'approved') {
        await FabricClient.updateUserStatus(user.username, {
          status: 'approved',
          approvedBy: 'system',
          comments: 'Synced from PostgreSQL'
        });
      }

      logger.info(`Synced user ${username} to blockchain`);
    } catch (error) {
      logger.error(`Failed to sync user ${username} to blockchain:`, error);
      throw error;
    }
  }

  /**
   * Sync all users from PostgreSQL to Blockchain
   */
  static async syncAllUsers(): Promise<void> {
    try {
      const result = await pool.query('SELECT username FROM users');
      
      logger.info(`Syncing ${result.rows.length} users to blockchain...`);

      for (const row of result.rows) {
        try {
          await this.syncUserToBlockchain(row.username);
        } catch (error: any) {
          logger.error(`Failed to sync user ${row.username}:`, error.message);
        }
      }

      logger.info('User sync completed');
    } catch (error) {
      logger.error('Failed to sync users:', error);
      throw error;
    }
  }

  /**
   * Handle user status update from Kafka
   */
  static async handleUserStatusUpdate(message: any): Promise<void> {
    try {
      const { username, status, approvedBy, comments } = message;
      
      logger.info(`Updating user status: ${username} -> ${status}`);

      // Update in PostgreSQL
      await pool.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE username = $2',
        [status, username]
      );

      // Update on Blockchain
      await FabricClient.updateUserStatus(username, {
        status,
        approvedBy,
        comments
      });

      logger.info(`User status updated: ${username}`);
    } catch (error) {
      logger.error('Failed to update user status:', error);
      throw error;
    }
  }
}
