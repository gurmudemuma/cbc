import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
<<<<<<< HEAD
import { SecurityConfig } from "@shared/security.config";
=======
import { SecurityConfig } from "../../../shared/security.config";
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

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
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
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
