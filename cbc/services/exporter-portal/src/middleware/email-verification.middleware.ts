import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './rbac.middleware';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface EmailVerificationToken {
  email: string;
  token: string;
  expiresAt: Date;
  verified: boolean;
}

// In-memory store for email verification tokens (in production, use database)
const emailVerificationTokens = new Map<string, EmailVerificationToken>();

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (email: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  emailVerificationTokens.set(token, {
    email: email.toLowerCase(),
    token,
    expiresAt,
    verified: false,
  });

  logger.info(`Generated email verification token for ${email}`);
  return token;
};

/**
 * Verify email token
 */
export const verifyEmailToken = (token: string): boolean => {
  const verification = emailVerificationTokens.get(token);

  if (!verification) {
    logger.warn(`Invalid email verification token: ${token}`);
    return false;
  }

  if (new Date() > verification.expiresAt) {
    logger.warn(`Expired email verification token for ${verification.email}`);
    emailVerificationTokens.delete(token);
    return false;
  }

  verification.verified = true;
  logger.info(`Email verified: ${verification.email}`);
  return true;
};

/**
 * Check if email is verified
 */
export const isEmailVerified = (email: string): boolean => {
  for (const [_, verification] of emailVerificationTokens) {
    if (
      verification.email === email.toLowerCase() &&
      verification.verified &&
      new Date() <= verification.expiresAt
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Middleware to require email verification for buyer responses
 */
export const requireEmailVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const buyerEmail = req.body.buyer_email || req.query.buyer_email || req.user?.email;

    if (!buyerEmail) {
      return res.status(400).json({ error: 'Buyer email is required' });
    }

    // Check if email is verified
    if (!isEmailVerified(buyerEmail)) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email address before responding to contracts',
        action: 'SEND_VERIFICATION_EMAIL',
      });
    }

    next();
  } catch (err) {
    logger.error('Error checking email verification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to send email verification link
 */
export const sendEmailVerificationLink = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = req.body.email || req.user?.email;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate token
    const token = generateEmailVerificationToken(email);

    // In production, send email with verification link
    // For now, just return the token
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    logger.info(`Email verification link generated for ${email}`);

    // Attach to request for use in controller
    (req as any).verificationToken = token;
    (req as any).verificationLink = verificationLink;

    next();
  } catch (err) {
    logger.error('Error sending email verification link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to verify email token from query parameter
 */
export const verifyEmailTokenFromQuery = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    if (!verifyEmailToken(token)) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    next();
  } catch (err) {
    logger.error('Error verifying email token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to verify email token from request body
 */
export const verifyEmailTokenFromBody = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.body.verification_token;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    if (!verifyEmailToken(token)) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    next();
  } catch (err) {
    logger.error('Error verifying email token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Endpoint to send verification email
 */
export const sendVerificationEmail = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const email = req.body.email || req.user?.email;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate token
    const token = generateEmailVerificationToken(email);
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // In production, send email with verification link
    // For now, just return the link
    logger.info(`Verification email sent to ${email}`);

    res.json({
      success: true,
      message: 'Verification email sent',
      verificationLink, // Remove in production
    });
  } catch (err) {
    logger.error('Error sending verification email:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Endpoint to verify email
 */
export const verifyEmail = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    if (!verifyEmailToken(token)) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (err) {
    logger.error('Error verifying email:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
