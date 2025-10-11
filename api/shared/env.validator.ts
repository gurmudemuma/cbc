/**
 * Environment Variable Validator
 * Validates and provides type-safe access to environment variables
 */

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY: string;
  ORGANIZATION_ID: string;
  ORGANIZATION_NAME: string;
  PEER_ENDPOINT: string;
  MSP_ID: string;
  CHANNEL_NAME: string;
  CHAINCODE_NAME_EXPORT: string;
  CHAINCODE_NAME_USER: string;
  CONNECTION_PROFILE_PATH: string;
  WALLET_PATH: string;
  ADMIN_CERT_PATH: string;
  ADMIN_KEY_PATH: string;
  IPFS_HOST: string;
  IPFS_PORT: number;
  IPFS_PROTOCOL: string;
  ENCRYPTION_KEY: string | undefined;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CORS_ORIGIN: string;
  MAX_FILE_SIZE_MB: number;
  WEBSOCKET_ENABLED: boolean;
}

class EnvValidator {
  private static instance: EnvValidator;
  private config: EnvConfig | null = null;

  private constructor() {}

  public static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator();
    }
    return EnvValidator.instance;
  }

  /**
   * Validate and parse environment variables
   */
  public validate(): EnvConfig {
    if (this.config) {
      return this.config;
    }

    const errors: string[] = [];

    // Required string variables
    const requiredStrings = [
      'JWT_SECRET',
      'ORGANIZATION_ID',
      'ORGANIZATION_NAME',
      'PEER_ENDPOINT',
      'MSP_ID',
      'CHANNEL_NAME',
      'CHAINCODE_NAME_EXPORT',
      'CHAINCODE_NAME_USER',
      'CONNECTION_PROFILE_PATH',
      'WALLET_PATH',
    ];

    for (const key of requiredStrings) {
      if (!process.env[key] || process.env[key]?.trim() === '') {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }

    // Validate NODE_ENV
    const nodeEnv = process.env['NODE_ENV'] || 'development';
    if (!['development', 'production', 'test'].includes(nodeEnv)) {
      errors.push(
        `Invalid NODE_ENV: ${nodeEnv}. Must be 'development', 'production', or 'test'`
      );
    }

    // Validate PORT
    const port = parseInt(process.env['PORT'] || '3000', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`Invalid PORT: ${process.env['PORT']}. Must be between 1 and 65535`);
    }

    // Validate JWT_SECRET strength (in production)
    if (nodeEnv === 'production') {
      const jwtSecret = process.env['JWT_SECRET'] || '';
      if (jwtSecret.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters in production');
      }
    }

    // Validate IPFS settings
    const ipfsPort = parseInt(process.env['IPFS_PORT'] || '5001', 10);
    if (isNaN(ipfsPort) || ipfsPort < 1 || ipfsPort > 65535) {
      errors.push(`Invalid IPFS_PORT: ${process.env['IPFS_PORT']}`);
    }

    const ipfsProtocol = process.env['IPFS_PROTOCOL'] || 'http';
    if (!['http', 'https'].includes(ipfsProtocol)) {
      errors.push(`Invalid IPFS_PROTOCOL: ${ipfsProtocol}. Must be 'http' or 'https'`);
    }

    // Validate log level
    const logLevel = process.env['LOG_LEVEL'] || 'info';
    if (!['error', 'warn', 'info', 'debug'].includes(logLevel)) {
      errors.push(
        `Invalid LOG_LEVEL: ${logLevel}. Must be 'error', 'warn', 'info', or 'debug'`
      );
    }

    // Validate rate limiting
    const rateLimitWindow = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10);
    if (isNaN(rateLimitWindow) || rateLimitWindow < 1000) {
      errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000 milliseconds');
    }

    const rateLimitMax = parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10);
    if (isNaN(rateLimitMax) || rateLimitMax < 1) {
      errors.push('RATE_LIMIT_MAX_REQUESTS must be at least 1');
    }

    // Validate file size
    const maxFileSize = parseInt(process.env['MAX_FILE_SIZE_MB'] || '10', 10);
    if (isNaN(maxFileSize) || maxFileSize < 1 || maxFileSize > 100) {
      errors.push('MAX_FILE_SIZE_MB must be between 1 and 100');
    }

    // If there are validation errors, throw
    if (errors.length > 0) {
      console.error('Environment validation failed:');
      errors.forEach((error) => console.error(`  ❌ ${error}`));
      throw new Error(`Environment validation failed with ${errors.length} error(s)`);
    }

    // Build validated config
    this.config = {
      PORT: port,
      NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
      JWT_SECRET: process.env['JWT_SECRET']!,
      JWT_EXPIRY: process.env['JWT_EXPIRY'] || '24h',
      REFRESH_TOKEN_EXPIRY: process.env['REFRESH_TOKEN_EXPIRY'] || '7d',
      ORGANIZATION_ID: process.env['ORGANIZATION_ID']!,
      ORGANIZATION_NAME: process.env['ORGANIZATION_NAME']!,
      PEER_ENDPOINT: process.env['PEER_ENDPOINT']!,
      MSP_ID: process.env['MSP_ID']!,
      CHANNEL_NAME: process.env['CHANNEL_NAME']!,
      CHAINCODE_NAME_EXPORT: process.env['CHAINCODE_NAME_EXPORT']!,
      CHAINCODE_NAME_USER: process.env['CHAINCODE_NAME_USER']!,
      CONNECTION_PROFILE_PATH: process.env['CONNECTION_PROFILE_PATH']!,
      WALLET_PATH: process.env['WALLET_PATH']!,
      ADMIN_CERT_PATH: process.env['ADMIN_CERT_PATH'] || '',
      ADMIN_KEY_PATH: process.env['ADMIN_KEY_PATH'] || '',
      IPFS_HOST: process.env['IPFS_HOST'] || 'localhost',
      IPFS_PORT: ipfsPort,
      IPFS_PROTOCOL: ipfsProtocol,
      ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'],
      LOG_LEVEL: logLevel as 'error' | 'warn' | 'info' | 'debug',
      RATE_LIMIT_WINDOW_MS: rateLimitWindow,
      RATE_LIMIT_MAX_REQUESTS: rateLimitMax,
      CORS_ORIGIN: process.env['CORS_ORIGIN'] || '*',
      MAX_FILE_SIZE_MB: maxFileSize,
      WEBSOCKET_ENABLED: process.env['WEBSOCKET_ENABLED'] !== 'false',
    };

    console.log('✅ Environment validation successful');
    return this.config;
  }

  /**
   * Get validated configuration
   */
  public getConfig(): EnvConfig {
    if (!this.config) {
      return this.validate();
    }
    return this.config;
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.getConfig().NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.getConfig().NODE_ENV === 'development';
  }

  /**
   * Check if running in test mode
   */
  public isTest(): boolean {
    return this.getConfig().NODE_ENV === 'test';
  }

  /**
   * Print configuration summary (without sensitive data)
   */
  public printSummary(): void {
    const config = this.getConfig();
    console.log('\n📋 Configuration Summary:');
    console.log(`  Environment: ${config.NODE_ENV}`);
    console.log(`  Port: ${config.PORT}`);
    console.log(`  Organization: ${config.ORGANIZATION_NAME} (${config.ORGANIZATION_ID})`);
    console.log(`  MSP ID: ${config.MSP_ID}`);
    console.log(`  Channel: ${config.CHANNEL_NAME}`);
    console.log(`  Export Chaincode: ${config.CHAINCODE_NAME_EXPORT}`);
    console.log(`  User Chaincode: ${config.CHAINCODE_NAME_USER}`);
    console.log(`  IPFS: ${config.IPFS_PROTOCOL}://${config.IPFS_HOST}:${config.IPFS_PORT}`);
    console.log(`  WebSocket: ${config.WEBSOCKET_ENABLED ? 'Enabled' : 'Disabled'}`);
    console.log(`  Log Level: ${config.LOG_LEVEL}`);
    console.log(`  CORS Origin: ${config.CORS_ORIGIN}`);
    console.log('');
  }
}

// Export singleton instance
export const envValidator = EnvValidator.getInstance();

// Export helper function
export function getEnvConfig(): EnvConfig {
  return envValidator.getConfig();
}
