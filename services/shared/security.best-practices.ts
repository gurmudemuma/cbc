/**
 * Security Best Practices Configuration
 * Centralized security settings and utilities
 */

import helmet from 'helmet';
import type { Application } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

/**
 * Content Security Policy configuration
 */
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
};

/**
 * Helmet security headers configuration
 */
export const helmetConfig = {
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
};

/**
 * Rate limiting configurations
 */
export const rateLimitConfigs = {
  // Strict rate limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 attempts per window (increased for development)
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  },

  // Moderate rate limit for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window (increased for development)
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Strict rate limit for file uploads
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: {
      success: false,
      message: 'Upload limit reached. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Rate limit for expensive operations
  expensive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per hour
    message: {
      success: false,
      message: 'Rate limit exceeded for this operation.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
};

/**
 * CORS configuration
 */
export const getCorsConfig = (allowedOrigins: string | string[]) => {
  const origins = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : allowedOrigins.split(',').map((o) => o.trim());

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all origins in development
      if (origins.includes('*')) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (origins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost on any port
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = (_req: any, res: any, next: any) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  next();
};

/**
 * Apply all security middleware to Express app
 */
export const applySecurityMiddleware = (
  app: Application,
  config: {
    corsOrigins: string;
    enableHelmet?: boolean;
    enableRateLimiting?: boolean;
    isProduction?: boolean;
  }
) => {
  // Apply Helmet security headers
  if (config.enableHelmet !== false) {
    app.use(helmet(helmetConfig as any));
  }

  // Apply custom security headers
  app.use(securityHeadersMiddleware);

  // Trust proxy (if behind reverse proxy in production)
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  // Disable X-Powered-By header
  app.disable('x-powered-by');
};

/**
 * Create rate limiters
 */
export const createRateLimiters = () => {
  return {
    authLimiter: rateLimit(rateLimitConfigs.auth),
    apiLimiter: rateLimit(rateLimitConfigs.api),
    uploadLimiter: rateLimit(rateLimitConfigs.upload),
    expensiveLimiter: rateLimit(rateLimitConfigs.expensive),
  };
};

/**
 * Password security requirements
 */
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters`);
  }

  if (password.length > passwordRequirements.maxLength) {
    errors.push(`Password must not exceed ${passwordRequirements.maxLength} characters`);
  }

  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (passwordRequirements.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${passwordRequirements.specialChars}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password',
    '12345678',
    'qwerty',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data (for logging, etc.)
 */
export const hashForLogging = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
};

/**
 * Sanitize error messages for production
 */
export const sanitizeErrorMessage = (error: any, isProduction: boolean): string => {
  if (!isProduction) {
    return error.message || 'An error occurred';
  }

  // In production, don't expose internal error details
  const sanitizedMessages: { [key: string]: string } = {
    'ECONNREFUSED': 'Service temporarily unavailable',
    'ETIMEDOUT': 'Request timed out',
    'ENOTFOUND': 'Service not found',
    'ECONNRESET': 'Connection was reset',
  };

  const errorCode = error.code || error.name;
  return sanitizedMessages[errorCode] || 'An internal error occurred';
};

/**
 * Security audit log structure
 */
export interface SecurityAuditLog {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log security event
 */
export const logSecurityEvent = (event: SecurityAuditLog): void => {
  // In production, this should send to a proper logging service
  console.log('[SECURITY]', JSON.stringify(event));
};

/**
 * Security best practices checklist for developers
 */
export const SECURITY_CHECKLIST = {
  authentication: [
    'Use strong JWT secrets (min 32 chars)',
    'Implement token expiration and refresh',
    'Use bcrypt with salt rounds >= 10',
    'Implement account lockout after failed attempts',
  ],
  authorization: [
    'Validate user permissions on every request',
    'Use principle of least privilege',
    'Implement role-based access control',
  ],
  input: [
    'Sanitize all user inputs',
    'Validate input types and ranges',
    'Use parameterized queries',
    'Implement file upload restrictions',
  ],
  output: [
    'Escape output for different contexts',
    'Set proper Content-Type headers',
    'Implement CORS correctly',
  ],
  cryptography: [
    'Use strong encryption algorithms (AES-256)',
    'Secure key management',
    'Use HTTPS in production',
    'Implement certificate pinning',
  ],
  error_handling: [
    'Never expose stack traces to users',
    'Log errors securely',
    'Implement proper error messages',
  ],
  session: [
    'Use secure session cookies',
    'Implement session timeout',
    'Regenerate session ID after login',
  ],
  dependencies: [
    'Keep dependencies up to date',
    'Audit dependencies regularly (npm audit)',
    'Use lock files',
  ],
};

export default {
  helmetConfig,
  cspConfig,
  rateLimitConfigs,
  getCorsConfig,
  securityHeadersMiddleware,
  applySecurityMiddleware,
  createRateLimiters,
  passwordRequirements,
  validatePassword,
  generateSecureToken,
  hashForLogging,
  sanitizeErrorMessage,
  logSecurityEvent,
  SECURITY_CHECKLIST,
};
