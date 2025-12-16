"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityConfig = void 0;
class SecurityConfig {
    static validateJWTSecret(secret) {
        if (!secret) {
            throw new Error('SECURITY ERROR: JWT_SECRET environment variable is required. Generate with: openssl rand -base64 64');
        }
        if (process.env['NODE_ENV'] === 'production') {
            if (secret.length < 64) {
                throw new Error('SECURITY ERROR: JWT_SECRET must be at least 64 characters in production');
            }
            if (secret.includes('dev') || secret.includes('test') || secret.includes('change') || secret.includes('example')) {
                throw new Error('SECURITY ERROR: JWT_SECRET appears to be a development/example secret. Use a production-grade secret.');
            }
        }
        else {
            // Even in development, warn about weak secrets
            if (secret.length < 32) {
                console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long');
            }
        }
        return secret;
    }
    static getJWTSecret() {
        return this.validateJWTSecret(process.env['JWT_SECRET']);
    }
    static getJWTExpiresIn() {
        return process.env['JWT_EXPIRES_IN'] || '1h'; // Reduced from 24h for security
    }
    static getJWTRefreshExpiresIn() {
        return process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';
    }
}
exports.SecurityConfig = SecurityConfig;
//# sourceMappingURL=security.config.js.map