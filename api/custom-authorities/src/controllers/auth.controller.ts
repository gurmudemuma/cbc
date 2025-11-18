import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { FabricGateway } from "../fabric/gateway";
import { SecurityConfig } from "../../../shared/security.config";
import {
  BlockchainUserService,
  createUserService,
} from "../../../shared/userService";

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

export class AuthController {
  private JWT_SECRET: string;
  private JWT_EXPIRES_IN: string;
  private JWT_EXPIRES_IN_SECONDS: number;
  private fabricGateway: FabricGateway;

  constructor() {
    // Use centralized security config - no hardcoded fallback
    this.JWT_SECRET = SecurityConfig.getJWTSecret();
    this.JWT_EXPIRES_IN = SecurityConfig.getJWTExpiresIn();
    this.JWT_EXPIRES_IN_SECONDS = this.parseExpiresIn(this.JWT_EXPIRES_IN);
    this.fabricGateway = FabricGateway.getInstance();
  }

  private parseExpiresIn(expiresIn: string | undefined): number {
    if (!expiresIn) {
      return 86400; // Default to 24 hours
    }
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1]) {
      throw new Error("Invalid expiresIn format");
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 3600;
      case "d":
        return value * 86400;
      default:
        throw new Error("Invalid unit");
    }
  }

  private async getUserService(): Promise<BlockchainUserService> {
    const userContract = await this.fabricGateway.getUserContract();
    return createUserService(userContract);
  }

  public register = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password, email, organizationId, role } = req.body;

      const userService = await this.getUserService();

      // Register user on blockchain
      const newUser = await userService.registerUser({
        username,
        password,
        email,
        organizationId: organizationId || "CUSTOM-AUTHORITIES-001",
        role: role || "customs_officer",
      });

      // Generate token
      const token = jwt.sign(
        {
          id: newUser.id,
          username: newUser.username,
          organizationId: newUser.organizationId,
          role: newUser.role,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS },
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            organizationId: newUser.organizationId,
            role: newUser.role,
          },
          token,
        },
      });
    } catch (error: unknown) {
      console.error("Error registering user:", error);
      let message = "Failed to register user";
      let statusCode = 500;
      if (error instanceof Error) {
        message = error.message;
        if (error.message.includes("already exists")) {
          statusCode = 400;
        }
      }
      res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  public login = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password } = req.body;

      const userService = await this.getUserService();

      // Authenticate user via blockchain
      const user = await userService.authenticateUser({ username, password });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
        return;
      }

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          organizationId: user.organizationId,
          role: user.role,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS },
      );

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
    } catch (error: unknown) {
      console.error("Error logging in:", error);
      let statusCode = 500;
      let message = "Failed to login";
      if (error instanceof Error) {
        message = error.message;
        if (error.message.includes("deactivated")) {
          statusCode = 403;
        }
      }
      res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  public refreshToken = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Token is required",
        });
        return;
      }

      // Verify old token
      const decoded = jwt.verify(token, this.JWT_SECRET) as AuthJWTPayload;

      // Generate new token
      const newToken = jwt.sign(
        {
          id: decoded.id,
          username: decoded.username,
          organizationId: decoded.organizationId,
          role: decoded.role,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN_SECONDS },
      );

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          token: newToken,
        },
      });
    } catch (error: unknown) {
      console.error("Error refreshing token:", error);
      let message = "Invalid or expired token";
      if (error instanceof Error) {
        message = error.message;
      }
      res.status(401).json({
        success: false,
        message,
        error: message,
      });
    }
  };
}
