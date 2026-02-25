/**
 * Security Best Practices Configuration
 * Centralized security settings and utilities
 */
import type { Application } from 'express';
/**
 * Content Security Policy configuration
 */
export declare const cspConfig: {
    directives: {
        defaultSrc: string[];
        styleSrc: string[];
        scriptSrc: string[];
        imgSrc: string[];
        connectSrc: string[];
        fontSrc: string[];
        objectSrc: string[];
        mediaSrc: string[];
        frameSrc: string[];
    };
};
/**
 * Helmet security headers configuration
 */
export declare const helmetConfig: {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: string[];
            styleSrc: string[];
            scriptSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            fontSrc: string[];
            objectSrc: string[];
            mediaSrc: string[];
            frameSrc: string[];
        };
    };
    crossOriginEmbedderPolicy: boolean;
    crossOriginOpenerPolicy: boolean;
    crossOriginResourcePolicy: {
        policy: "cross-origin";
    };
    dnsPrefetchControl: boolean;
    frameguard: {
        action: string;
    };
    hidePoweredBy: boolean;
    hsts: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    ieNoOpen: boolean;
    noSniff: boolean;
    originAgentCluster: boolean;
    permittedCrossDomainPolicies: {
        permittedPolicies: string;
    };
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin";
    };
};
/**
 * Rate limiting configurations
 */
export declare const rateLimitConfigs: {
    auth: {
        windowMs: number;
        max: number;
        message: {
            success: boolean;
            message: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
    };
    api: {
        windowMs: number;
        max: number;
        message: {
            success: boolean;
            message: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    upload: {
        windowMs: number;
        max: number;
        message: {
            success: boolean;
            message: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    expensive: {
        windowMs: number;
        max: number;
        message: {
            success: boolean;
            message: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
};
/**
 * CORS configuration
 */
export declare const getCorsConfig: (allowedOrigins: string | string[]) => {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
};
/**
 * Security headers middleware
 */
export declare const securityHeadersMiddleware: (_req: any, res: any, next: any) => void;
/**
 * Apply all security middleware to Express app
 */
export declare const applySecurityMiddleware: (app: Application, config: {
    corsOrigins: string;
    enableHelmet?: boolean;
    enableRateLimiting?: boolean;
    isProduction?: boolean;
}) => void;
/**
 * Create rate limiters
 */
export declare const createRateLimiters: () => {
    authLimiter: import("express-rate-limit").RateLimitRequestHandler;
    apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
    uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
    expensiveLimiter: import("express-rate-limit").RateLimitRequestHandler;
};
/**
 * Password security requirements
 */
export declare const passwordRequirements: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    specialChars: string;
};
/**
 * Validate password strength
 */
export declare const validatePassword: (password: string) => {
    valid: boolean;
    errors: string[];
};
/**
 * Generate secure random token
 */
export declare const generateSecureToken: (length?: number) => string;
/**
 * Hash sensitive data (for logging, etc.)
 */
export declare const hashForLogging: (data: string) => string;
/**
 * Sanitize error messages for production
 */
export declare const sanitizeErrorMessage: (error: any, isProduction: boolean) => string;
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
export declare const logSecurityEvent: (event: SecurityAuditLog) => void;
/**
 * Security best practices checklist for developers
 */
export declare const SECURITY_CHECKLIST: {
    authentication: string[];
    authorization: string[];
    input: string[];
    output: string[];
    cryptography: string[];
    error_handling: string[];
    session: string[];
    dependencies: string[];
};
declare const _default: {
    helmetConfig: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                styleSrc: string[];
                scriptSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
                fontSrc: string[];
                objectSrc: string[];
                mediaSrc: string[];
                frameSrc: string[];
            };
        };
        crossOriginEmbedderPolicy: boolean;
        crossOriginOpenerPolicy: boolean;
        crossOriginResourcePolicy: {
            policy: "cross-origin";
        };
        dnsPrefetchControl: boolean;
        frameguard: {
            action: string;
        };
        hidePoweredBy: boolean;
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
        ieNoOpen: boolean;
        noSniff: boolean;
        originAgentCluster: boolean;
        permittedCrossDomainPolicies: {
            permittedPolicies: string;
        };
        referrerPolicy: {
            policy: "strict-origin-when-cross-origin";
        };
    };
    cspConfig: {
        directives: {
            defaultSrc: string[];
            styleSrc: string[];
            scriptSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            fontSrc: string[];
            objectSrc: string[];
            mediaSrc: string[];
            frameSrc: string[];
        };
    };
    rateLimitConfigs: {
        auth: {
            windowMs: number;
            max: number;
            message: {
                success: boolean;
                message: string;
            };
            standardHeaders: boolean;
            legacyHeaders: boolean;
            skipSuccessfulRequests: boolean;
        };
        api: {
            windowMs: number;
            max: number;
            message: {
                success: boolean;
                message: string;
            };
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
        upload: {
            windowMs: number;
            max: number;
            message: {
                success: boolean;
                message: string;
            };
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
        expensive: {
            windowMs: number;
            max: number;
            message: {
                success: boolean;
                message: string;
            };
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
    };
    getCorsConfig: (allowedOrigins: string | string[]) => {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
    };
    securityHeadersMiddleware: (_req: any, res: any, next: any) => void;
    applySecurityMiddleware: (app: Application, config: {
        corsOrigins: string;
        enableHelmet?: boolean;
        enableRateLimiting?: boolean;
        isProduction?: boolean;
    }) => void;
    createRateLimiters: () => {
        authLimiter: import("express-rate-limit").RateLimitRequestHandler;
        apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
        uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
        expensiveLimiter: import("express-rate-limit").RateLimitRequestHandler;
    };
    passwordRequirements: {
        minLength: number;
        maxLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        specialChars: string;
    };
    validatePassword: (password: string) => {
        valid: boolean;
        errors: string[];
    };
    generateSecureToken: (length?: number) => string;
    hashForLogging: (data: string) => string;
    sanitizeErrorMessage: (error: any, isProduction: boolean) => string;
    logSecurityEvent: (event: SecurityAuditLog) => void;
    SECURITY_CHECKLIST: {
        authentication: string[];
        authorization: string[];
        input: string[];
        output: string[];
        cryptography: string[];
        error_handling: string[];
        session: string[];
        dependencies: string[];
    };
};
export default _default;
//# sourceMappingURL=security.best-practices.d.ts.map