import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma";
import { SecurityConfig } from "../../../shared/security.config";

export class PortalAuthController {
  public login = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password } = req.body as {
        username: string;
        password: string;
      };

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !user.isActive) {
        res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
        return;
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
        return;
      }

      const payload = {
        id: user.id,
        username: user.username,
        organizationId: user.organizationId,
        role: user.role,
      };
      const secret = SecurityConfig.getJWTSecret();
      const options: SignOptions = {
        expiresIn: SecurityConfig.getJWTExpiresIn() as StringValue,
      };
      const token = jwt.sign(payload, secret, options);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            organizationId: user.organizationId,
            role: user.role,
          },
          token,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({ success: false, message: error?.message || "Failed to login" });
    }
  };
}
