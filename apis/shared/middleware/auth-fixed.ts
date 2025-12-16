import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { createLogger } from '../logger';

const logger = createLogger('AuthMiddleware');

const verifyAsync = promisify(jwt.verify) as (token: string, secret: string, options?: jwt.VerifyOptions) => Promise<any>;
const signAsync = promisify(jwt.sign) as (payload: any, secret: string, options?: jwt.SignOptions) => Promise<string>;

// Use RS256 for better security (asymmetric encryption)
const JWT_ALGORITHM = 'RS256';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || '';
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
const JWT_ISSUER = 'coffee-export-consortium';
const JWT_AUDIENCE = 'api-services';
const JWT_EXPIRY = '1h';
const JWT_REFRESH_EXPIRY = '7d';

interface TokenPayload {
  userId: string;
  username: string;
  organization: string;
  role: string;
  permissions?: string[];
}

interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;
}

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set<string>();

/**
 * Generate access token
 */
export const generateToken = async (payload: TokenPayload): Promise<string> => {
  if (!JWT_PRIVATE_KEY) {
    throw new Error('JWT_PRIVATE_KEY not configured');
  }

  const jti = `${payload.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return await signAsync(
    payload,
    JWT_PRIVATE_KEY,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: jti,
    }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = async (payload: TokenPayload): Promise<string> => {
  if (!JWT_PRIVATE_KEY) {
    throw new Error('JWT_PRIVATE_KEY not configured');
  }

  const jti = `refresh-${payload.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return await signAsync(
    { userId: payload.userId, type: 'refresh' },
    JWT_PRIVATE_KEY,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: jti,
    }
  );
};

/**
 * Verify token
 */
export const verifyToken = async (token: string): Promise<DecodedToken> => {
  if (!JWT_PUBLIC_KEY) {
    throw new Error('JWT_PUBLIC_KEY not configured');
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    throw new Error('Token has been revoked');
  }

  try {
    const decoded = await verifyAsync(token, JWT_PUBLIC_KEY, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as DecodedToken;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Revoke token (add to blacklist)
 */
export const revokeToken = (token: string): void => {
  tokenBlacklist.add(token);
  
  // In production, store in Redis with TTL equal to token expiry
  // redis.setex(`blacklist:${token}`, 3600, '1');
};

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = await verifyToken(token);

    // Attach user info to request
    (req as any).user = {
      userId: decoded.userId,
      username: decoded.username,
      organization: decoded.organization,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    // Attach token for potential revocation
    (req as any).token = token;

    next();
  } catch (error: any) {
    logger.error('Authentication failed', { error: error.message });
    res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed',
    });
  }
};

/**
 * Authorization middleware - check if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn('Authorization failed', {
        userId: user.userId,
        role: user.role,
        requiredRoles: allowedRoles,
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based authorization
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const hasPermission = requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn('Permission check failed', {
        userId: user.userId,
        userPermissions: user.permissions,
        requiredPermissions,
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Organization-based authorization
 */
export const requireOrganization = (...allowedOrgs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    if (!allowedOrgs.includes(user.organization)) {
      logger.warn('Organization check failed', {
        userId: user.userId,
        organization: user.organization,
        allowedOrgs,
      });

      res.status(403).json({
        success: false,
        error: 'Organization not authorized',
      });
      return;
    }

    next();
  };
};

/**
 * Logout - revoke token
 */
export const logout = (req: Request, res: Response): void => {
  const token = (req as any).token;

  if (token) {
    revokeToken(token);
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  revokeToken,
  authenticate,
  authorize,
  requirePermission,
  requireOrganization,
  logout,
};
