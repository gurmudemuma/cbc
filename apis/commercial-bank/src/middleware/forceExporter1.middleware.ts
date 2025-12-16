import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Middleware to force requests to act as exporter1 (useful for local testing
 * and consolidation). When enabled (config.FORCE_EXPORTER1 === true) this
 * middleware creates a JWT for the configured exporter identity and attaches
 * it to the request as both the Authorization header and req.user.
 *
 * IMPORTANT: This is an opt-in testing helper. Do NOT enable in production.
 */
export const forceExporter1 = (req: Request, _res: Response, next: NextFunction): void => {
  if (!config.FORCE_EXPORTER1) {
    next();
    return;
  }

  const payload = {
    id: config.FORCE_EXPORTER1_ID,
    username: 'exporter1',
    organizationId: config.FORCE_EXPORTER1_ORG,
    role: 'exporter',
    email: config.FORCE_EXPORTER1_EMAIL,
  };

  try {
    const token = jwt.sign(payload as any, config.JWT_SECRET, {
      expiresIn: config.FORCE_EXPORTER1_EXPIRES_IN,
    } as any);

    // Attach to header for downstream auth middleware expecting Authorization
    (req.headers as any).authorization = `Bearer ${token}`;

    // Also attach a user object directly (so handlers that look at req.user work)
    (req as any).user = payload;
  } catch (error) {
    // If token creation fails, log and continue without forcing
    // We avoid throwing so the server can still run when config is mis-set
    // eslint-disable-next-line no-console
    console.error('Failed to create forced exporter1 token', error);
  }

  next();
};

export default forceExporter1;
