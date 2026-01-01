/**
 * Shared Authentication Middleware
 * Centralized JWT authentication for all CBC services
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { Algorithm } from 'jsonwebtoken';
import { JWT_CONFIG, validateJWTConfig } from '../auth/jwt.config';
import { ApiResponse, ApiErrorCode } from '../types/api-response.types';

// Validate JWT config on import
validateJWTConfig();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    organization: string;
    mspId: string;
    role: string;
    permissions: string[];
  };
}

export interface JWTPayload {
  id: string;
  username: string;
  organization?: string;
  organizationId?: string;
  mspId?: string;
  role: string;
  permissions?: string[];
  iat: number;
  exp: number;
  iss?: string;
  aud?: string | string[];
}

/**
 * Centralized JWT authentication middleware
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        ApiResponse.error(
          'Access token is required',
          ApiErrorCode.UNAUTHORIZED,
          'Authorization header must be provided with Bearer token format',
          undefined,
          req.headers['x-service-name'] as string || 'CBC-API'
        )
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with shared secret (without strict issuer/audience validation for backward compatibility)
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM as Algorithm],
    });

    const payload = decoded as JWTPayload;

    // Attach user info to request
    req.user = {
      id: payload.id,
      username: payload.username,
      organization: payload.organization || payload.organizationId || 'DEFAULT',
      mspId: payload.mspId || 'DEFAULT',
      role: payload.role,
      permissions: payload.permissions || [],
    };

    return next();
  } catch (error) {
    let errorCode = ApiErrorCode.INVALID_TOKEN;
    let message = 'Invalid access token';
    let details = 'Token verification failed';

    if (error instanceof jwt.TokenExpiredError) {
      errorCode = ApiErrorCode.TOKEN_EXPIRED;
      message = 'Access token has expired';
      details = 'Please refresh your token or login again';
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorCode = ApiErrorCode.INVALID_TOKEN;
      message = 'Invalid access token';
      details = error.message;
    }

    return res.status(401).json(
      ApiResponse.error(
        message,
        errorCode,
        details,
        undefined,
        req.headers['x-service-name'] as string || 'CBC-API'
      )
    );
  }
};

/**
 * Generate JWT token with standardized payload
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string => {
  return jwt.sign(
    payload,
    JWT_CONFIG.SECRET,
    {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithm: JWT_CONFIG.ALGORITHM,
    } as any
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string => {
  return jwt.sign(
    payload,
    JWT_CONFIG.SECRET,
    {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithm: JWT_CONFIG.ALGORITHM,
    } as any
  );
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(
        ApiResponse.error(
          'Authentication required',
          ApiErrorCode.UNAUTHORIZED,
          'User must be authenticated to access this resource'
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        ApiResponse.error(
          'Insufficient permissions',
          ApiErrorCode.INSUFFICIENT_PERMISSIONS,
          `Required roles: ${allowedRoles.join(', ')}. User role: ${req.user.role}`
        )
      );
    }

    next();
    return;
  };
};

/**
 * Organization-based authorization middleware
 */
export const requireOrganization = (allowedOrganizations: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(
        ApiResponse.error(
          'Authentication required',
          ApiErrorCode.UNAUTHORIZED,
          'User must be authenticated to access this resource'
        )
      );
    }

    if (!allowedOrganizations.includes(req.user.organization)) {
      return res.status(403).json(
        ApiResponse.error(
          'Organization access denied',
          ApiErrorCode.INSUFFICIENT_PERMISSIONS,
          `Required organizations: ${allowedOrganizations.join(', ')}. User organization: ${req.user.organization}`
        )
      );
    }

    next();
    return;
  };
};

/**
 * Action-based authorization middleware using role permissions
 */
export const requireAction = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(
        ApiResponse.error(
          'Authentication required',
          ApiErrorCode.UNAUTHORIZED,
          'User must be authenticated to access this resource'
        )
      );
    }

    // Check if user has the required action in their permissions
    if (!req.user.permissions || !req.user.permissions.includes(action)) {
      return res.status(403).json(
        ApiResponse.error(
          'Action not permitted',
          ApiErrorCode.INSUFFICIENT_PERMISSIONS,
          `Your organization (${req.user.organization}) is not authorized to perform this action (${action})`
        )
      );
    }

    next();
    return;
  };
};

export default authMiddleware;
