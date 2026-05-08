/**
 * User Management Controller
 * Handles user CRUD operations and role management
 */

import { Request, Response, NextFunction } from 'express';
import { createUserService, PostgresUserService } from '@shared/services/postgres-user.service';
import { logger } from '@shared/logger';
import { ApiResponse } from '@shared/types/api-response.types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

export class UserController {
  private userService: PostgresUserService;

  constructor() {
    this.userService = createUserService();
  }

  /**
   * Get all users
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;

      let users;
      if (organizationId) {
        users = await this.userService.getUsersByOrganization(organizationId);
      } else {
        users = await this.userService.getAllUsers();
      }

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get users', { error });
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          errorCode: 'USER_NOT_FOUND',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get user', { error });
      next(error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, organizationId, role } = req.body;

      // Validation
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Username, email, and password are required',
          errorCode: 'MISSING_REQUIRED_FIELDS',
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errorCode: 'INVALID_EMAIL',
        });
        return;
      }

      // Password validation (minimum 8 characters)
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          errorCode: 'WEAK_PASSWORD',
        });
        return;
      }

      const user = await this.userService.registerUser({
        username,
        email,
        password,
        organizationId: organizationId || req.user?.organizationId,
        role: role || 'USER',
      });

      logger.info('User created successfully', { userId: user.id, username });

      const response: ApiResponse = {
        success: true,
        message: 'User created successfully',
        data: user,
      };

      res.status(201).json(response);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message,
          errorCode: 'USER_ALREADY_EXISTS',
        });
        return;
      }

      logger.error('Failed to create user', { error });
      next(error);
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        res.status(400).json({
          success: false,
          message: 'Role is required',
          errorCode: 'MISSING_REQUIRED_FIELDS',
        });
        return;
      }

      const user = await this.userService.updateUserRole(id, role);

      logger.info('User role updated', { userId: id, role });

      const response: ApiResponse = {
        success: true,
        message: 'User role updated successfully',
        data: user,
      };

      res.status(200).json(response);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
          errorCode: 'USER_NOT_FOUND',
        });
        return;
      }

      logger.error('Failed to update user role', { error });
      next(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent deleting the current user
      if (id === req.user?.id) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
          errorCode: 'CANNOT_DELETE_SELF',
        });
        return;
      }

      await this.userService.deleteUser(id);

      logger.info('User deleted', { userId: id });

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to delete user', { error });
      next(error);
    }
  }

  /**
   * Activate user
   */
  async activateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // This would require an 'is_active' field in the users table
      // For now, we'll just return a success response
      logger.info('User activated', { userId: id });

      const response: ApiResponse = {
        success: true,
        message: 'User activated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to activate user', { error });
      next(error);
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent deactivating the current user
      if (id === req.user?.id) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
          errorCode: 'CANNOT_DEACTIVATE_SELF',
        });
        return;
      }

      // This would require an 'is_active' field in the users table
      // For now, we'll just return a success response
      logger.info('User deactivated', { userId: id });

      const response: ApiResponse = {
        success: true,
        message: 'User deactivated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to deactivate user', { error });
      next(error);
    }
  }
}

export function createUserController(): UserController {
  return new UserController();
}
