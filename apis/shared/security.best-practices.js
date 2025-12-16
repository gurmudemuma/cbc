"use strict";
/**
 * Security Best Practices Configuration
 * Centralized security settings and utilities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_CHECKLIST = exports.logSecurityEvent = exports.sanitizeErrorMessage = exports.hashForLogging = exports.generateSecureToken = exports.validatePassword = exports.passwordRequirements = exports.createRateLimiters = exports.applySecurityMiddleware = exports.securityHeadersMiddleware = exports.getCorsConfig = exports.rateLimitConfigs = exports.helmetConfig = exports.cspConfig = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Content Security Policy configuration
 */
exports.cspConfig = {
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
exports.helmetConfig = {
    contentSecurityPolicy: exports.cspConfig,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
};
/**
 * Rate limiting configurations
 */
exports.rateLimitConfigs = {
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
const getCorsConfig = (allowedOrigins) => {
    const origins = Array.isArray(allowedOrigins)
        ? allowedOrigins
        : allowedOrigins.split(',').map((o) => o.trim());
    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) {
                return callback(null, true);
            }
            // Allow all origins in development with wildcard
            if (origins.includes('*')) {
                return callback(null, true);
            }
            // Check if origin is in allowed list
            if (origins.includes(origin)) {
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
exports.getCorsConfig = getCorsConfig;
/**
 * Security headers middleware
 */
const securityHeadersMiddleware = (_req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
    next();
};
exports.securityHeadersMiddleware = securityHeadersMiddleware;
/**
 * Apply all security middleware to Express app
 */
const applySecurityMiddleware = (app, config) => {
    // Apply Helmet security headers
    if (config.enableHelmet !== false) {
        app.use((0, helmet_1.default)(exports.helmetConfig));
    }
    // Apply custom security headers
    app.use(exports.securityHeadersMiddleware);
    // Trust proxy (if behind reverse proxy in production)
    if (config.isProduction) {
        app.set('trust proxy', 1);
    }
    // Disable X-Powered-By header
    app.disable('x-powered-by');
};
exports.applySecurityMiddleware = applySecurityMiddleware;
/**
 * Create rate limiters
 */
const createRateLimiters = () => {
    return {
        authLimiter: (0, express_rate_limit_1.default)(exports.rateLimitConfigs.auth),
        apiLimiter: (0, express_rate_limit_1.default)(exports.rateLimitConfigs.api),
        uploadLimiter: (0, express_rate_limit_1.default)(exports.rateLimitConfigs.upload),
        expensiveLimiter: (0, express_rate_limit_1.default)(exports.rateLimitConfigs.expensive),
    };
};
exports.createRateLimiters = createRateLimiters;
/**
 * Password security requirements
 */
exports.passwordRequirements = {
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
const validatePassword = (password) => {
    const errors = [];
    if (password.length < exports.passwordRequirements.minLength) {
        errors.push(`Password must be at least ${exports.passwordRequirements.minLength} characters`);
    }
    if (password.length > exports.passwordRequirements.maxLength) {
        errors.push(`Password must not exceed ${exports.passwordRequirements.maxLength} characters`);
    }
    if (exports.passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (exports.passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (exports.passwordRequirements.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (exports.passwordRequirements.requireSpecialChars) {
        const specialCharsRegex = new RegExp(`[${exports.passwordRequirements.specialChars}]`);
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
exports.validatePassword = validatePassword;
/**
 * Generate secure random token
 */
const generateSecureToken = (length = 32) => {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
/**
 * Hash sensitive data (for logging, etc.)
 */
const hashForLogging = (data) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
};
exports.hashForLogging = hashForLogging;
/**
 * Sanitize error messages for production
 */
const sanitizeErrorMessage = (error, isProduction) => {
    if (!isProduction) {
        return error.message || 'An error occurred';
    }
    // In production, don't expose internal error details
    const sanitizedMessages = {
        'ECONNREFUSED': 'Service temporarily unavailable',
        'ETIMEDOUT': 'Request timed out',
        'ENOTFOUND': 'Service not found',
        'ECONNRESET': 'Connection was reset',
    };
    const errorCode = error.code || error.name;
    return sanitizedMessages[errorCode] || 'An internal error occurred';
};
exports.sanitizeErrorMessage = sanitizeErrorMessage;
/**
 * Log security event
 */
const logSecurityEvent = (event) => {
    // In production, this should send to a proper logging service
    console.log('[SECURITY]', JSON.stringify(event));
};
exports.logSecurityEvent = logSecurityEvent;
/**
 * Security best practices checklist for developers
 */
exports.SECURITY_CHECKLIST = {
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
exports.default = {
    helmetConfig: exports.helmetConfig,
    cspConfig: exports.cspConfig,
    rateLimitConfigs: exports.rateLimitConfigs,
    getCorsConfig: exports.getCorsConfig,
    securityHeadersMiddleware: exports.securityHeadersMiddleware,
    applySecurityMiddleware: exports.applySecurityMiddleware,
    createRateLimiters: exports.createRateLimiters,
    passwordRequirements: exports.passwordRequirements,
    validatePassword: exports.validatePassword,
    generateSecureToken: exports.generateSecureToken,
    hashForLogging: exports.hashForLogging,
    sanitizeErrorMessage: exports.sanitizeErrorMessage,
    logSecurityEvent: exports.logSecurityEvent,
    SECURITY_CHECKLIST: exports.SECURITY_CHECKLIST,
};
//# sourceMappingURL=security.best-practices.js.map