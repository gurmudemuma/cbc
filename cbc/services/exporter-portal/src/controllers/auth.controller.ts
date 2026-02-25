import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '@shared/database/pool';
import { SecurityConfig } from '@shared/security.config';
import { createLogger } from '@shared/logger';
import { ErrorCode, AppError } from '@shared/error-codes';

const logger = createLogger('ExporterPortalAuthController');

interface AuthJWTPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
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

  /**
   * Register new exporter user
   */
  public register = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { username, password, email } = req.body;

      if (!username || !password || !email) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Username, password, and email are required', 400);
      }

      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError(ErrorCode.INVALID_STATUS_TRANSITION, 'User already exists', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, organization_id, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, username, email, organization_id, role`,
        [username, email, hashedPassword, 'EXPORTER_PORTAL', 'exporter']
      );

      const newUser = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        {
          id: newUser.id,
          username: newUser.username,
          organizationId: newUser.organization_id,
          role: newUser.role,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS }
      );

      logger.info('Exporter registered', { userId: newUser.id });

      res.status(201).json({
        success: true,
        message: 'Exporter registered successfully',
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
   * Get qualification status by username (public endpoint for login page)
   */
  public getQualificationStatusByUsername = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { username } = req.params;

      if (!username) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Username is required', 400);
      }

      // Check if user exists
      const userResult = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (userResult.rows.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            exists: false,
            message: 'User not found. Please register first.',
          },
        });
        return;
      }

      const userId = userResult.rows[0].id;

      // Get exporter profile
      const profileResult = await client.query(
        `SELECT exporter_id as id, business_name, tin as tin_number, status, created_at 
         FROM exporter_profiles WHERE user_id = $1`,
        [userId]
      );

      if (profileResult.rows.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            exists: true,
            hasProfile: false,
            message: 'Please complete your exporter profile registration.',
          },
        });
        return;
      }

      const profile = profileResult.rows[0];
      const exporterId = profile.id;

      // Get qualification status
      const [laboratory, taster, competence, license] = await Promise.all([
        client.query(
          'SELECT laboratory_id as id, status FROM coffee_laboratories WHERE exporter_id = $1 LIMIT 1',
          [exporterId]
        ),
        client.query(
          'SELECT taster_id as id, status FROM coffee_tasters WHERE exporter_id = $1 LIMIT 1',
          [exporterId]
        ),
        client.query(
          'SELECT certificate_id as id, status FROM competence_certificates WHERE exporter_id = $1 LIMIT 1',
          [exporterId]
        ),
        client.query(
          'SELECT license_id as id, status FROM export_licenses WHERE exporter_id = $1 LIMIT 1',
          [exporterId]
        ),
      ]);

      const qualificationStatus = {
        profile: {
          status: profile.status,
          completed: profile.status === 'APPROVED',
        },
        laboratory: {
          status: laboratory.rows[0]?.status || 'NOT_STARTED',
          completed: laboratory.rows[0]?.status === 'CERTIFIED',
        },
        taster: {
          status: taster.rows[0]?.status || 'NOT_STARTED',
          completed: taster.rows[0]?.status === 'VERIFIED',
        },
        competence: {
          status: competence.rows[0]?.status || 'NOT_STARTED',
          completed: competence.rows[0]?.status === 'ISSUED',
        },
        license: {
          status: license.rows[0]?.status || 'NOT_STARTED',
          completed: license.rows[0]?.status === 'ACTIVE',
        },
      };

      const allCompleted =
        qualificationStatus.profile.completed &&
        qualificationStatus.laboratory.completed &&
        qualificationStatus.taster.completed &&
        qualificationStatus.competence.completed &&
        qualificationStatus.license.completed;

      res.status(200).json({
        success: true,
        data: {
          exists: true,
          hasProfile: true,
          exporterId,
          qualificationStatus,
          allCompleted,
          canLogin: allCompleted,
          message: allCompleted
            ? 'Pre-registration complete. You can now log in.'
            : 'Please complete all pre-registration steps before logging in.',
        },
      });
    } catch (error: any) {
      logger.error('Failed to get qualification status', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Login exporter user
   * Enhanced to include exporter ID and qualification status
   */
  public login = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Username and password are required', 400);
      }

      const result = await client.query(
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

      // Verify user is an exporter, admin, or agency user
      const allowedRoles = ['exporter', 'admin', 'AGENCY_USER', 'AGENCY_ADMIN'];
      if (!allowedRoles.includes(user.role)) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'Access denied. Only exporters, admins, and agency officials can access this portal.',
          403
        );
      }

      // Get exporter profile and ID
      let exporterId = null;
      let qualificationComplete = false;

      if (user.role === 'exporter') {
        const profileResult = await client.query(
          'SELECT exporter_id as id FROM exporter_profiles WHERE user_id = $1',
          [user.id]
        );

        if (profileResult.rows.length > 0) {
          exporterId = profileResult.rows[0].id;

          // Check if all pre-registration steps are complete
          const [profile, laboratory, taster, competence, license] = await Promise.all([
            client.query(
              'SELECT status FROM exporter_profiles WHERE exporter_id = $1',
              [exporterId]
            ),
            client.query(
              'SELECT status FROM coffee_laboratories WHERE exporter_id = $1 LIMIT 1',
              [exporterId]
            ),
            client.query(
              'SELECT status FROM coffee_tasters WHERE exporter_id = $1 LIMIT 1',
              [exporterId]
            ),
            client.query(
              'SELECT status FROM competence_certificates WHERE exporter_id = $1 LIMIT 1',
              [exporterId]
            ),
            client.query(
              'SELECT status FROM export_licenses WHERE exporter_id = $1 LIMIT 1',
              [exporterId]
            ),
          ]);

          qualificationComplete =
            profile.rows[0]?.status === 'APPROVED' &&
            laboratory.rows[0]?.status === 'CERTIFIED' &&
            taster.rows[0]?.status === 'VERIFIED' &&
            competence.rows[0]?.status === 'ISSUED' &&
            license.rows[0]?.status === 'ACTIVE';
        }
      }

      // Generate JWT token with exporter ID
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          organizationId: user.organization_id,
          role: user.role,
          exporterId,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS }
      );

      logger.info('Exporter logged in', { userId: user.id, exporterId });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organizationId: user.organization_id,
            role: user.role,
            exporterId,
          },
          token,
          qualificationComplete,
        },
      });
    } catch (error: any) {
      logger.error('Login failed', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Refresh JWT token
   */
  public refreshToken = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 'Token is required', 400);
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
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS }
      );

      logger.info('Token refreshed', { userId: decoded.id });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
        },
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
