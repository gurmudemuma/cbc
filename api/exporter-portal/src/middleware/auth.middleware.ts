import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

/**
 * Authentication middleware for Exporter Portal
 * Validates JWT tokens issued by National Bank
 * Since National Bank manages all exporter portal users and export licenses
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      res.status(500).json({
        success: false,
        message: "Authentication configuration error",
      });
      return;
    }

    // Verify token issued by National Bank
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any): void => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        res.status(403).json({
          success: false,
          message: "Invalid or expired token",
        });
        return;
      }

      // Ensure this is an exporter portal user
      if (decoded.role !== "exporter-portal" && decoded.role !== "exporter") {
        res.status(403).json({
          success: false,
          message: "Access denied: Invalid role for exporter portal",
        });
        return;
      }

      // Add user info to request
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email || "",
        organizationId: decoded.organizationId,
        role: decoded.role,
      };

      next();
    });
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
    return;
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied: Insufficient permissions",
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Used for endpoints that can work with or without authentication
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return next(); // Continue without authentication if not configured
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (!err && decoded) {
        req.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email || "",
          organizationId: decoded.organizationId,
          role: decoded.role,
        };
      }
      next();
    });
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

export { AuthenticatedRequest };
