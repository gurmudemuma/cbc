"use strict";
/**
 * PostgreSQL User Service
 * Handles all user-related database operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserService = exports.PostgresUserService = void 0;
const pool_1 = require("../database/pool");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const logger_1 = require("../logger");
const pool = (0, pool_1.getPool)();
class PostgresUserService {
    /**
     * Register a new user
     */
    async registerUser(data) {
        try {
            // Check if user already exists
            const existingUser = await this.getUserByUsername(data.username);
            if (existingUser) {
                throw new Error(`User already exists: ${data.username}`);
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
            const query = `
        INSERT INTO users (
          id, username, email, password_hash, organization_id, role
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username, email, organization_id, role, created_at;
      `;
            const result = await pool.query(query, [
                (0, uuid_1.v4)(),
                data.username,
                data.email,
                hashedPassword,
                data.organizationId || null,
                data.role || 'USER',
            ]);
            logger_1.logger.info('User registered successfully', { username: data.username });
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error('Failed to register user', { error, username: data.username });
            throw error;
        }
    }
    /**
     * Authenticate user
     */
    async authenticateUser(username, password) {
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
            const isValid = await bcryptjs_1.default.compare(password, result.rows[0].password_hash);
            if (!isValid) {
                throw new Error('Invalid password');
            }
            logger_1.logger.info('User authenticated successfully', { username });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to authenticate user', { error, username });
            throw error;
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE id = $1;
      `;
            const result = await pool.query(query, [userId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by ID', { error, userId });
            throw error;
        }
    }
    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        try {
            const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE username = $1;
      `;
            const result = await pool.query(query, [username]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by username', { error, username });
            throw error;
        }
    }
    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        try {
            const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE email = $1;
      `;
            const result = await pool.query(query, [email]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by email', { error, email });
            throw error;
        }
    }
    /**
     * Get all users
     */
    async getAllUsers() {
        try {
            const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users ORDER BY created_at DESC;
      `;
            const result = await pool.query(query);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to get all users', { error });
            throw error;
        }
    }
    /**
     * Get users by organization
     */
    async getUsersByOrganization(organizationId) {
        try {
            const query = `
        SELECT id, username, email, organization_id, role, created_at 
        FROM users WHERE organization_id = $1 ORDER BY created_at DESC;
      `;
            const result = await pool.query(query, [organizationId]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to get users by organization', { error, organizationId });
            throw error;
        }
    }
    /**
     * Update user role
     */
    async updateUserRole(userId, role) {
        try {
            const query = `
        UPDATE users SET role = $1 WHERE id = $2
        RETURNING id, username, email, organization_id, role, created_at;
      `;
            const result = await pool.query(query, [role, userId]);
            if (!result.rows[0]) {
                throw new Error(`User not found: ${userId}`);
            }
            logger_1.logger.info('User role updated', { userId, role });
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error('Failed to update user role', { error, userId, role });
            throw error;
        }
    }
    /**
     * Delete user
     */
    async deleteUser(userId) {
        try {
            const query = 'DELETE FROM users WHERE id = $1';
            await pool.query(query, [userId]);
            logger_1.logger.info('User deleted', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user', { error, userId });
            throw error;
        }
    }
}
exports.PostgresUserService = PostgresUserService;
/**
 * Factory function to create PostgresUserService instance
 */
function createUserService() {
    return new PostgresUserService();
}
exports.createUserService = createUserService;
//# sourceMappingURL=postgres-user.service.js.map