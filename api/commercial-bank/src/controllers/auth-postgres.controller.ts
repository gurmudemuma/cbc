import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../../../shared/database/pool";
import { SecurityConfig } from "../../../shared/security.config";
import { createLogger } from "../../../shared/logger";
import { ErrorCode, AppError } from "../../../shared/error-codes";

const logger = createLogger('AuthPostgresController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class AuthPostgresController {
  private JWT_SECRET: string;
  private JWT_EXPIRES_IN: string;
  private JWT_EXPIRES_IN_SECONDS: number;

  constructor() {
    this.JWT_SECRET = SecurityConfig.getJWTSecret();
    this.JWT_EXPIRES_IN = SecurityConfig.getJWTExpiresIn();
    this.JWT_EXPIRES_IN_SECONDS = this.parseExpiresIn(this.JWT_EXPIRES_IN);
  }

  /**
   * Parse JWT expiration time string (e.g., "24h", "7d")
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1]) {
      throw new Error("Invalid expiresIn format");
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 3600;
      case "d":
        return value * 86400;
      default:
        throw new Error("Invalid unit");
    }
  }

  /**
   * Register a new user
   */
  public register = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { username, password, email, organizationId, role } = req.body;

      // Validate required fields
      if (!username || !password || !email) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Username, password, and email are required',
          400
        );
      }

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          'User already exists',
          400
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, organization_id, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, username, email, organization_id, role`,
        [username, email, hashedPassword, organizationId || 'DEFAULT', role || 'user']
      );

      const newUser = result.rows[0];

      // Generate token
      const token = jwt.sign(
        {
          id: newUser.id,
          username: newUser.username,
          organizationId: newUser.organization_id,
          role: newUser.role,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS },
      );

      logger.info('User registered successfully', { userId: newUser.id, username });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            organizationId: newUser.organization_id,
            role: newUser.role,
          },
          token,
        },
      });
    } catch (error: any) {
      logger.error('Registration failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Login user
   */
  public login = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password } = req.body;

      // Validate required fields
      if (!username || !password) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Username and password are required',
          400
        );
      }

      // Get user from database
      const result = await pool.query(
        'SELECT id, username, email, password_hash, organization_id, role FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'Invalid credentials',
          401
        );
      }

      const user = result.rows[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'Invalid credentials',
          401
        );
      }

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          organizationId: user.organization_id,
          role: user.role,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS },
      );

      logger.info('User logged in successfully', { userId: user.id, username });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organizationId: user.organization_id,
            role: user.role,
          },
          token,
        },
      });
    } catch (error: any) {
      logger.error('Login failed', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Refresh JWT token
   */
  public refreshToken = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Token is required',
          400
        );
      }

      // Verify old token
      const decoded = jwt.verify(token, this.JWT_SECRET) as AuthJWTPayload;

      // Generate new token
      const newToken = jwt.sign(
        {
          id: decoded.id,
          username: decoded.username,
          organizationId: decoded.organizationId,
          role: decoded.role,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS },
      );

      logger.info('Token refreshed', { userId: decoded.id });

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          token: newToken,
        },
      });
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get current user profile
   */
  public getProfile = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'User not authenticated',
          401
        );
      }

      // Get user from database
      const result = await pool.query(
        'SELECT id, username, email, organization_id, role, created_at FROM users WHERE id = $1',
        [user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          'User not found',
          404
        );
      }

      const userProfile = result.rows[0];

      res.json({
        success: true,
        data: {
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          organizationId: userProfile.organization_id,
          role: userProfile.role,
          createdAt: userProfile.created_at,
        },
      });
    } catch (error: any) {
      logger.error('Get profile failed', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Update user profile
   */
  public updateProfile = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user;
      const { email, role } = req.body;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'User not authenticated',
          401
        );
      }

      // Update user
      const result = await pool.query(
        `UPDATE users 
         SET email = COALESCE($1, email), 
             role = COALESCE($2, role),
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, username, email, organization_id, role`,
        [email || null, role || null, user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          'User not found',
          404
        );
      }

      const updatedUser = result.rows[0];

      logger.info('User profile updated', { userId: user.id });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          organizationId: updatedUser.organization_id,
          role: updatedUser.role,
        },
      });
    } catch (error: any) {
      logger.error('Update profile failed', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Change password
   */
  public changePassword = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'User not authenticated',
          401
        );
      }

      if (!currentPassword || !newPassword) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Current password and new password are required',
          400
        );
      }

      // Get user from database
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          'User not found',
          404
        );
      }

      const userRecord = result.rows[0];

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, userRecord.password_hash);

      if (!passwordMatch) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'Current password is incorrect',
          401
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, user.id]
      );

      logger.info('Password changed', { userId: user.id });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password failed', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Centralized error handling
   */
  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.httpStatus).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Invalid token',
        },
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Token expired',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      },
    });
  }
}
