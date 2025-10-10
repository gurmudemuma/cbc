#!/bin/bash

# Script to apply security fixes across all services
# This updates NCAT and Shipping Line services with the same security improvements

echo "🔒 Applying security fixes to NCAT and Shipping Line services..."

# Update NCAT auth middleware
echo "Updating NCAT auth middleware..."
cat > api/ncat/src/middleware/auth.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SecurityConfig } from "../../../shared/security.config";

// Define the structure of the JWT payload
interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

// Extend the Express Request interface to include the user property
interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export const authMiddleware = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Use centralized security config - no hardcoded fallback
    const JWT_SECRET = SecurityConfig.getJWTSecret();

    const decoded = jwt.verify(token, JWT_SECRET) as AuthJWTPayload;
    req.user = decoded;

    next();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown auth error";
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: message,
    });
  }
};
EOF

# Update Shipping Line auth middleware
echo "Updating Shipping Line auth middleware..."
cat > api/shipping-line/src/middleware/auth.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SecurityConfig } from "../../../shared/security.config";

// Define the structure of the JWT payload
interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

// Extend the Express Request interface to include the user property
interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export const authMiddleware = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Use centralized security config - no hardcoded fallback
    const JWT_SECRET = SecurityConfig.getJWTSecret();

    const decoded = jwt.verify(token, JWT_SECRET) as AuthJWTPayload;
    req.user = decoded;

    next();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown auth error";
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: message,
    });
  }
};
EOF

echo "✅ Security fixes applied to auth middleware"
echo "⚠️  Note: Auth controllers for NCAT and Shipping Line need manual update"
echo "   Add: import { SecurityConfig } from '../../../shared/security.config';"
echo "   Replace constructor JWT_SECRET initialization with: SecurityConfig.getJWTSecret()"

chmod +x apply-security-fixes.sh
