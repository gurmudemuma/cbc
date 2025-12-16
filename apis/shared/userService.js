"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserService = exports.BlockchainUserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
class BlockchainUserService {
    constructor(contract) {
        this.contract = contract;
    }
    /**
     * Register a new user on the blockchain
     */
    async registerUser(data) {
        try {
            // Hash password before storing
            const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
            const userId = `USER-${(0, uuid_1.v4)()}`;
            // Submit transaction to blockchain
            await this.contract.submitTransaction('RegisterUser', userId, data.username, passwordHash, data.email, data.organizationId, data.role);
            // Retrieve the created user
            const user = await this.getUserById(userId);
            return user;
        }
        catch (error) {
            if (error.message.includes('already exists') || error.message.includes('already taken') || error.message.includes('already registered')) {
                throw new Error('User already exists');
            }
            throw error;
        }
    }
    /**
     * Authenticate a user
     */
    async authenticateUser(data) {
        try {
            // Get user from blockchain
            const result = await this.contract.evaluateTransaction('GetUserByUsername', data.username);
            const user = JSON.parse(result.toString());
            // Check if user is active
            if (!user.isActive) {
                throw new Error('User account is deactivated');
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(data.password, user.passwordHash);
            if (!isPasswordValid) {
                return null;
            }
            // Update last login timestamp
            await this.contract.submitTransaction('UpdateLastLogin', user.id);
            // Return user without password hash
            return user;
        }
        catch (error) {
            if (error.message.includes('does not exist')) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const result = await this.contract.evaluateTransaction('GetUser', userId);
            const user = JSON.parse(result.toString());
            return user;
        }
        catch (error) {
            if (error.message.includes('does not exist')) {
                throw new Error('User not found');
            }
            throw error;
        }
    }
    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        try {
            const result = await this.contract.evaluateTransaction('GetUserByUsername', username);
            const user = JSON.parse(result.toString());
            return user;
        }
        catch (error) {
            if (error.message.includes('does not exist')) {
                throw new Error('User not found');
            }
            throw error;
        }
    }
    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        try {
            const result = await this.contract.evaluateTransaction('GetUserByEmail', email);
            const user = JSON.parse(result.toString());
            return user;
        }
        catch (error) {
            if (error.message.includes('does not exist')) {
                throw new Error('User not found');
            }
            throw error;
        }
    }
    /**
     * Update user password
     */
    async updatePassword(userId, newPassword) {
        try {
            const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
            await this.contract.submitTransaction('UpdatePassword', userId, passwordHash);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Deactivate user account
     */
    async deactivateUser(userId) {
        try {
            await this.contract.submitTransaction('DeactivateUser', userId);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Activate user account
     */
    async activateUser(userId) {
        try {
            await this.contract.submitTransaction('ActivateUser', userId);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get all users (admin function)
     */
    async getAllUsers() {
        try {
            const result = await this.contract.evaluateTransaction('GetAllUsers');
            const users = JSON.parse(result.toString());
            return users;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get users by organization
     */
    async getUsersByOrganization(organizationId) {
        try {
            const result = await this.contract.evaluateTransaction('GetUsersByOrganization', organizationId);
            const users = JSON.parse(result.toString());
            return users;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Check if username exists
     */
    async usernameExists(username) {
        try {
            const result = await this.contract.evaluateTransaction('UsernameExists', username);
            return result.toString() === 'true';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if email exists
     */
    async emailExists(email) {
        try {
            const result = await this.contract.evaluateTransaction('EmailExists', email);
            return result.toString() === 'true';
        }
        catch (error) {
            return false;
        }
    }
}
exports.BlockchainUserService = BlockchainUserService;
/**
 * Factory function to create BlockchainUserService instance
 */
function createUserService(contract) {
    return new BlockchainUserService(contract);
}
exports.createUserService = createUserService;
//# sourceMappingURL=userService.js.map