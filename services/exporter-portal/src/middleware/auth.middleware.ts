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
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
<<<<<<< HEAD

=======
    
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    // Verify user is an exporter or admin
    const allowedRoles = ['exporter', 'admin'];
    if (!allowedRoles.includes(decoded.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only exporters and admins can access this portal.',
      });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
<<<<<<< HEAD
    res.status(401).json({
=======
    res.status(403).json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
