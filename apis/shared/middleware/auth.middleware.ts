import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { createLogger } from '../logger';

const logger = createLogger('AuthMiddleware');
const verifyAsync = promisify(jwt.verify) as (token: string, secret: string, options?: jwt.VerifyOptions) => Promise<any>;
const signAsync = promisify(jwt.sign) as (payload: any, secret: string, options?: jwt.SignOptions) => Promise<string>;

const JWT_ALGORITHM = 'RS256';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || process.env.JWT_SECRET || '';
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') || process.env.JWT_SECRET || '';
const JWT_ISSUER = 'coffee-export-consortium';
const JWT_AUDIENCE = 'api-services';

interface TokenPayload {
  userId: string;
  username: string;
  organization: string;
  role: string;
  permissions?: string[];
}

const tokenBlacklist = new Set<string>();

export const generateToken = async (payload: TokenPayload): Promise<string> => {
  if (!JWT_PRIVATE_KEY) throw new Error('JWT_PRIVATE_KEY not configured');
  
  const useRS256 = JWT_PRIVATE_KEY.includes('BEGIN RSA PRIVATE KEY') || JWT_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');
  
  return await signAsync(payload, JWT_PRIVATE_KEY, {
    algorithm: useRS256 ? JWT_ALGORITHM : 'HS256',
    expiresIn: '1h',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    jwtid: `${payload.userId}-${Date.now()}`,
  });
};

export const verifyToken = async (token: string): Promise<any> => {
  if (!JWT_PUBLIC_KEY) throw new Error('JWT_PUBLIC_KEY not configured');
  if (tokenBlacklist.has(token)) throw new Error('Token has been revoked');
  
  const useRS256 = JWT_PUBLIC_KEY.includes('BEGIN PUBLIC KEY') || JWT_PUBLIC_KEY.includes('BEGIN RSA PUBLIC KEY');
  
  return await verifyAsync(token, JWT_PUBLIC_KEY, {
    algorithms: [useRS256 ? JWT_ALGORITHM : 'HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    (req as any).user = decoded;
    (req as any).token = token;
    next();
  } catch (error: any) {
    logger.error('Authentication failed', { error: error.message });
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

export const requireOrganization = (...allowedOrgs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !allowedOrgs.includes(user.organization)) {
      res.status(403).json({ success: false, error: 'Organization not authorized' });
      return;
    }
    next();
  };
};

export default { generateToken, verifyToken, authenticate, authorize, requireOrganization };
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../logger';
import { envValidator } from '../env.validator';

/**
 * Authentication and Authorization Middleware
 * Implements JWT-based authentication with role-based access control
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AuthJWTPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
  mspId: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthJWTPayload;
  token?: string;
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  ECTA_OFFICER = 'ECTA_OFFICER',
  ECX_OFFICER = 'ECX_OFFICER',
  BANK_OFFICER = 'BANK_OFFICER',
  NBE_OFFICER = 'NBE_OFFICER',
  CUSTOMS_OFFICER = 'CUSTOMS_OFFICER',
  SHIPPING_OFFICER = 'SHIPPING_OFFICER',
  EXPORTER = 'EXPORTER',
  IMPORTER = 'IMPORTER',
  AUDITOR = 'AUDITOR',
}

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'manage_users',
    'manage_roles',
    'view_audit_logs',
    'manage_system',
    'approve_all',
    'reject_all',
  ],
  [UserRole.ECTA_OFFICER]: [
    'validate_license',
    'approve_quality',
    'reject_quality',
    'approve_contract',
    'reject_contract',
    'issue_origin_certificate',
    'view_exports',
  ],
  [UserRole.ECX_OFFICER]: ['verify_lot', 'reject_lot', 'view_lots', 'view_exports'],
  [UserRole.BANK_OFFICER]: [
    'verify_documents',
    'reject_documents',
    'submit_fx_application',
    'view_exports',
    'confirm_payment',
  ],
  [UserRole.NBE_OFFICER]: ['approve_fx', 'reject_fx', 'confirm_fx_repatriation', 'view_exports'],
  [UserRole.CUSTOMS_OFFICER]: ['clear_customs', 'reject_customs', 'view_exports'],
  [UserRole.SHIPPING_OFFICER]: [
    'schedule_shipment',
    'confirm_shipment',
    'notify_arrival',
    'view_exports',
  ],
  [UserRole.EXPORTER]: [
    'create_export',
    'submit_to_ecx',
    'submit_to_ecta',
    'submit_to_bank',
    'view_own_exports',
    'update_profile',
  ],
  [UserRole.IMPORTER]: ['view_exports', 'confirm_delivery', 'submit_to_import_customs'],
  [UserRole.AUDITOR]: ['view_audit_logs', 'view_exports', 'view_all_data'],
};

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Extract JWT token from request
 */
const extractToken = (req: AuthenticatedRequest): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Verify JWT token
 */
const verifyToken = (token: string): AuthJWTPayload | null => {
  try {
    const config = envValidator.getConfig();
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthJWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Authentication middleware - Verify JWT token
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Missing authentication token',
        code: 'NO_TOKEN',
      });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    req.user = payload;
    req.token = token;

    return next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * Authorization middleware - Check user role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        userRole,
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
        userPermissions,
      });
    }

    next();
  };
};

/**
 * Organization-based authorization middleware
 */
export const requireOrganization = (...allowedOrganizations: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    if (!allowedOrganizations.includes(req.user.organizationId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this organization',
        code: 'ORG_FORBIDDEN',
        userOrganization: req.user.organizationId,
        allowedOrganizations,
      });
    }

    next();
  };
};

/**
 * MSP-based authorization middleware (for Fabric)
 */
export const requireMSP = (...allowedMSPs: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    if (!allowedMSPs.includes(req.user.mspId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this MSP',
        code: 'MSP_FORBIDDEN',
        userMSP: req.user.mspId,
        allowedMSPs,
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Verify ownership middleware - Check if user owns the resource
 */
export const verifyOwnership = (resourceOwnerField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const resourceOwnerId = req.body[resourceOwnerField] || req.params[resourceOwnerField];

    if (resourceOwnerId && resourceOwnerId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
        code: 'OWNERSHIP_DENIED',
      });
    }

    next();
  };
};

/**
 * Rate limiting per user
 */
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitPerUser = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequestCounts.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      userRequestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
    }

    userLimit.count++;
    next();
  };
};

/**
 * Audit logging middleware
 */
export const auditLog = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        userId: req.user?.id || 'ANONYMOUS',
        username: req.user?.username || 'ANONYMOUS',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestBody: req.body,
        responseData: typeof data === 'string' ? JSON.parse(data) : data,
      };

      // Log to console (in production, send to audit service)
      logger.info('AUDIT', logEntry);

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: Omit<AuthJWTPayload, 'iat' | 'exp'>): string => {
  const config = envValidator.getConfig();
  const expiresIn: string = config.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: expiresIn as any });
};

/**
 * Refresh token middleware
 */
export const refreshToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
      code: 'NOT_AUTHENTICATED',
    });
  }

  const newToken = generateToken({
    id: req.user.id,
    username: req.user.username,
    organizationId: req.user.organizationId,
    role: req.user.role,
    mspId: req.user.mspId,
    permissions: req.user.permissions,
  });

  res.json({
    success: true,
    message: 'Token refreshed',
    token: newToken,
  });
};

// ============================================================================
// EXPORT ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Alias for authenticate middleware (for backward compatibility)
 */
export const authMiddleware = authenticate;

/**
 * Action-based authorization middleware
 * Checks if user has permission to perform a specific action
 */
export const requireAction = (action: string) => {
  return requirePermission(action);
};
