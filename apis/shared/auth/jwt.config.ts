/**
 * Shared JWT Configuration
 * Centralized authentication settings for all CBC services
 */

export const JWT_CONFIG = {
  // Shared secret across all services for SSO
  SECRET:
    process.env['JWT_SECRET'] ||
    'cbc-shared-jwt-secret-change-in-production-min-64-chars-for-security',

  // Token expiration times
  ACCESS_TOKEN_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '24h',
  REFRESH_TOKEN_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',

  // Token issuer
  ISSUER: 'coffee-blockchain-consortium',

  // Audience (services that can use the token)
  AUDIENCE: 'cbc-services', // Simplified to string for better compatibility

  // Algorithm
  ALGORITHM: 'HS256',
};

/**
 * Validate JWT configuration
 */
export const validateJWTConfig = (): void => {
  if (!JWT_CONFIG.SECRET || JWT_CONFIG.SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (
    process.env['NODE_ENV'] === 'production' &&
    JWT_CONFIG.SECRET.includes('change-in-production')
  ) {
    throw new Error('JWT_SECRET must be changed in production environment');
  }
};

export default JWT_CONFIG;
