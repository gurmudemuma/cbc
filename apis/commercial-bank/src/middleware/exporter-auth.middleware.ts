import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface JWTPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

    // Verify user is an exporter
    if (decoded.role !== 'exporter') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Exporters only.',
      });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
