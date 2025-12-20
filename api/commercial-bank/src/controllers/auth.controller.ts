import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../../../shared/database/pool";
import { SecurityConfig } from "../../../shared/security.config";
import { createLogger } from "../../../shared/logger";
import { ErrorCode, AppError } from "../../../shared/error-codes";

const logger = createLogger('CommercialBankAuthController');

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class AuthController {
  private JWT_SECRET: string;
  private JWT_EXPIRES_IN: string;
  private JWT_EXPIRES_IN_SECONDS: number;

  constructor() {
    this.JWT_SECRET = SecurityConfig.getJWTSecret();
    this.JWT_EXPIRES_IN = SecurityConfig.getJWTExpiresIn();
    this.JWT_EXPIRES_IN_SECONDS = this.parseExpiresIn(this.JWT_EXPIRES_IN);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1]) {
      throw new Error("Invalid expiresIn format");
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case "s": return value;
      case "m": return value * 60;
      case "h": return value * 3600;
      case "d": return value * 86400;
      default: throw new Error("Invalid unit");
    }
  }

  public register = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const client = await pool.connect();
    try {
      const { username, password, email, organizationId, role } = req.body;

      if (!username || !password || !email) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Username, password, and email are required', 400);
      }

      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError(ErrorCode.INVALID_STATUS_TRANSITION, 'User already exists', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, organization_id, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, username, email, organization_id, role`,
        [username, email, hashedPassword, organizationId || 'COMMERCIAL_BANK', role || 'banker']
      );

      const newUser = result.rows[0];
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

      logger.info('User registered', { userId: newUser.id });

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

  public login = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Username and password are required', 400);
      }

      const result = await pool.query(
        'SELECT id, username, email, password_hash, organization_id, role FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid credentials', 401);
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid credentials', 401);
      }

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

      logger.info('User logged in', { userId: user.id });

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

  public refreshToken = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Token is required', 400);
      }

      const decoded = jwt.verify(token, this.JWT_SECRET) as AuthJWTPayload;

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
        data: { token: newToken },
      });
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      this.handleError(error, res);
    }
  };

  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.httpStatus).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: { code: ErrorCode.UNAUTHORIZED, message: 'Invalid token' },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { code: ErrorCode.INTERNAL_SERVER_ERROR, message: 'An unexpected error occurred' },
    });
  }
}
