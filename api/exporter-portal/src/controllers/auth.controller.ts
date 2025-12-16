import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { FabricSDKGateway } from '../fabric/sdk-gateway';
import { config } from '../config';
import { createUserService } from '../../../shared/userService';

interface AuthJWTPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

export class AuthController {
  private fabricGateway: FabricSDKGateway;

  constructor() {
    this.fabricGateway = FabricSDKGateway.getInstance();
  }

  /**
   * Register new exporter user
   */
  public register = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { username, password, email } = req.body;

      const userContract = this.fabricGateway.getUserContract();
      const userService = createUserService(userContract);

      // Register exporter user
      const newUser = await userService.registerUser({
        username,
        password,
        email,
        organizationId: config.ORGANIZATION_ID,
        role: 'exporter', // All portal users are exporters
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: newUser.id,
          username: newUser.username,
          organizationId: newUser.organizationId,
          role: newUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN } as any
      );

      res.status(201).json({
        success: true,
        message: 'Exporter registered successfully',
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
      console.error('Error registering exporter:', error);
      const message = error instanceof Error ? error.message : 'Failed to register exporter';
      const statusCode = message.includes('already exists') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Login exporter user
   */
  public login = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { username, password } = req.body;

      const userContract = this.fabricGateway.getUserContract();
      const userService = createUserService(userContract);

      // Authenticate via blockchain
      const user = await userService.authenticateUser({ username, password });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Verify user is an exporter
      if (user.role !== 'exporter') {
        res.status(403).json({
          success: false,
          message: 'Access denied. This portal is for exporters only.',
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          organizationId: user.organizationId,
          role: user.role,
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN } as any
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
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
      console.error('Error logging in:', error);
      const message = error instanceof Error ? error.message : 'Failed to login';
      const statusCode = message.includes('deactivated') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Refresh JWT token
   */
  public refreshToken = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }

      // Verify old token
      const decoded = jwt.verify(token, config.JWT_SECRET) as AuthJWTPayload;

      // Generate new token
      const newToken = jwt.sign(
        {
          id: decoded.id,
          username: decoded.username,
          organizationId: decoded.organizationId,
          role: decoded.role,
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN } as any
      );

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
        },
      });
    } catch (error: unknown) {
      console.error('Error refreshing token:', error);
      const message = error instanceof Error ? error.message : 'Invalid or expired token';
      
      res.status(401).json({
        success: false,
        message,
        error: message,
      });
    }
  };
}
