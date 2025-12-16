import { Contract } from 'fabric-network';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  organizationId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface UserRegistrationData {
  username: string;
  password: string;
  email: string;
  organizationId: string;
  role: string;
}

export interface UserLoginData {
  username: string;
  password: string;
}

export class BlockchainUserService {
  private contract: Contract;

  constructor(contract: Contract) {
    this.contract = contract;
  }

  /**
   * Register a new user on the blockchain
   */
  async registerUser(data: UserRegistrationData): Promise<User> {
    try {
      // Hash password before storing
      const passwordHash = await bcrypt.hash(data.password, 10);
      const userId = `USER-${uuidv4()}`;

      // Submit transaction to blockchain
      await this.contract.submitTransaction(
        'RegisterUser',
        userId,
        data.username,
        passwordHash,
        data.email,
        data.organizationId,
        data.role
      );

      // Retrieve the created user
      const user = await this.getUserById(userId);
      return user;
    } catch (error: any) {
      if (
        error.message.includes('already exists') ||
        error.message.includes('already taken') ||
        error.message.includes('already registered')
      ) {
        throw new Error('User already exists');
      }
      throw error;
    }
  }

  /**
   * Authenticate a user
   */
  async authenticateUser(data: UserLoginData): Promise<User | null> {
    try {
      // Get user from blockchain
      const result = await this.contract.evaluateTransaction('GetUserByUsername', data.username);

      const user: User = JSON.parse(result.toString());

      // Check if user is active
      if (!user.isActive) {
        throw new Error('User account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        return null;
      }

      // Update last login timestamp
      await this.contract.submitTransaction('UpdateLastLogin', user.id);

      // Return user without password hash
      return user;
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const result = await this.contract.evaluateTransaction('GetUser', userId);
      const user: User = JSON.parse(result.toString());
      return user;
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User> {
    try {
      const result = await this.contract.evaluateTransaction('GetUserByUsername', username);
      const user: User = JSON.parse(result.toString());
      return user;
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User> {
    try {
      const result = await this.contract.evaluateTransaction('GetUserByEmail', email);
      const user: User = JSON.parse(result.toString());
      return user;
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.contract.submitTransaction('UpdatePassword', userId, passwordHash);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      await this.contract.submitTransaction('DeactivateUser', userId);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<void> {
    try {
      await this.contract.submitTransaction('ActivateUser', userId);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.contract.evaluateTransaction('GetAllUsers');
      const users: User[] = JSON.parse(result.toString());
      return users;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get users by organization
   */
  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    try {
      const result = await this.contract.evaluateTransaction(
        'GetUsersByOrganization',
        organizationId
      );
      const users: User[] = JSON.parse(result.toString());
      return users;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    try {
      const result = await this.contract.evaluateTransaction('UsernameExists', username);
      return result.toString() === 'true';
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const result = await this.contract.evaluateTransaction('EmailExists', email);
      return result.toString() === 'true';
    } catch (error: any) {
      return false;
    }
  }
}

/**
 * Factory function to create BlockchainUserService instance
 */
export function createUserService(contract: Contract): BlockchainUserService {
  return new BlockchainUserService(contract);
}
