/**
 * Shared JWT Configuration
 * Centralized authentication settings for all CBC services
 */
export declare const JWT_CONFIG: {
    SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    ISSUER: string;
    AUDIENCE: string;
    ALGORITHM: string;
};
/**
 * Validate JWT configuration
 */
export declare const validateJWTConfig: () => void;
export default JWT_CONFIG;
//# sourceMappingURL=jwt.config.d.ts.map