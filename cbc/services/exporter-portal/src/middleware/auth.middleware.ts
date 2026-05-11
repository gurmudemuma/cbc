import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { createLogger } from '@shared/logger';

const logger = createLogger('AuthMiddleware');

interface JWTPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
  exporterId?: string;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  logger.info('Auth check', { 
    url: req.url, 
    hasAuthHeader: !!authHeader,
    hasToken: !!token 
  });

  if (!token) {
    logger.warn('No token provided', { url: req.url });
    res.status(401).json({
      success: false,
      message: 'Access token required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    logger.info('Token decoded successfully', { 
      userId: decoded.id, 
      role: decoded.role,
      exporterId: decoded.exporterId,
      url: req.url
    });

    // Verify user is an exporter or admin (case-insensitive)
    const allowedRoles = ['exporter', 'admin'];
    const userRole = (decoded.role || '').toLowerCase();
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role not allowed', { role: decoded.role, url: req.url });
      res.status(403).json({
        success: false,
        message: 'Access denied. Only exporters and admins can access this portal.',
      });
      return;
    }

    (req as any).user = decoded;
    logger.info('User authenticated', { userId: decoded.id, url: req.url });
    next();
  } catch (error) {
    logger.error('Token verification failed', { error, url: req.url });
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
