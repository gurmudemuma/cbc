/**
 * PostgreSQL User Service
 * Handles all user-related database operations
 */

import { getPool } from '../database/pool';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';

const pool = getPool();

export interface UserData {
  username: string;
  email: string;
  password: string;
  organizationId?: string;
  role?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  organization_id?: string;
  role: string;
  created_at: Date;
}

export class PostgresUserService {
  /**
   * Register a new user
   */
  async registerUser(data: UserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByUsername(data.username);
      if (existingUser) {
        throw new Error(`User already exists: ${data.username}`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const query = `
        INSERT INTO users (
          id, username, email, password_hash, organization_id, role
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username, email, organization_id, role, created_at;
      `;

      const result = await pool.query(query, [
        uuidv4(),
        data.username,
        data.email,
        hashedPassword,
        data.organizationId || null,
        data.role || 'USER',
      ]);

      logger.info('User registered successfully', { username: data.username });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to register user', { error, username: data.username });
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async authenticateUser(username: string, password: string): Promise<User> {
    try {
      const user = await this.getUserByUsername(username);

      if (!user) {
        throw new Error('User not found');
      }

      // Get password hash
      const query = 'SELECT password_hash FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);

      if (!result.rows[0]) {
        throw new Error('User not found');
      }

      const isValid = await bcrypt.compare(password, result.rows[0].password_hash);

      if (!isValid) {
        throw new Error('Invalid password');
      }

      logger.info('User authenticated successfully', { username });
      return user;
    } catch (error) {
      logger.error('Failed to authenticate user', { error, username });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE id = $1;
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get user by ID', { error, userId });
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE username = $1;
      `;

      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get user by username', { error, username });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE email = $1;
      `;

      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get user by email', { error, email });
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users ORDER BY created_at DESC;
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get all users', { error });
      throw error;
    }
  }

  /**
   * Get users by organization
   */
  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    try {
      const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE organization_id = $1 ORDER BY created_at DESC;
      `;

      const result = await pool.query(query, [organizationId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get users by organization', { error, organizationId });
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string): Promise<User> {
    try {
      const query = `
        UPDATE users SET role = $1 WHERE id = $2
        RETURNING id, username, email, organization_id, role, created_at;
      `;

      const result = await pool.query(query, [role, userId]);

      if (!result.rows[0]) {
        throw new Error(`User not found: ${userId}`);
      }

      logger.info('User role updated', { userId, role });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update user role', { error, userId, role });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      await pool.query(query, [userId]);
      logger.info('User deleted', { userId });
    } catch (error) {
      logger.error('Failed to delete user', { error, userId });
      throw error;
    }
  }
}

/**
 * Factory function to create PostgresUserService instance
 */
export function createUserService(): PostgresUserService {
  return new PostgresUserService();
}
