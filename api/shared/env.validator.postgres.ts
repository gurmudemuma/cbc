/**
 * Environment Configuration Validator
 * PostgreSQL-Only Version (No Blockchain)
 */

import { createLogger } from './logger';

const _logger = createLogger('EnvValidator');

export interface Config {
  // Application
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // Security
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ENCRYPTION_KEY: string | undefined;
  CORS_ORIGIN: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  AUTH_RATE_LIMIT_MAX: number;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  DB_POOL_MIN: number;
  DB_POOL_MAX: number;

  // File Upload
  MAX_FILE_SIZE_MB: number;
  ALLOWED_FILE_TYPES: string;

  // WebSocket
  WEBSOCKET_ENABLED: boolean;

  // Email
  EMAIL_ENABLED: boolean;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_SECURE: boolean;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
  EMAIL_FROM: string;
  ECTA_ADMIN_EMAIL: string;

  // Pre-Registration System
  RENEWAL_REMINDERS_ENABLED: boolean;
  RENEWAL_CHECK_SCHEDULE: string;
  WEEKLY_SUMMARY_SCHEDULE: string;
  AUDIT_RETENTION_DAYS: number;
  ENHANCED_AUDIT_ENABLED: boolean;

  // Document Management
  MAX_DOCUMENT_SIZE_MB: number;
  ALLOWED_DOCUMENT_TYPES: string;

  // Monitoring
  ENABLE_REQUEST_LOGGING: boolean;
  ENABLE_METRICS: boolean;
  DEBUG: boolean;
  ENABLE_API_DOCS: boolean;
  ENABLE_HEALTH_CHECK: boolean;
}

class EnvironmentValidator {
  private config: Config | null = null;

  public getConfig(): Config {
    if (this.config) {
      return this.config;
    }

    const errors: string[] = [];

    // Validate required environment variables
    const requiredVars = [
      'PORT',
      'NODE_ENV',
      'LOG_LEVEL',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'JWT_REFRESH_EXPIRES_IN',
      'CORS_ORIGIN',
      'RATE_LIMIT_WINDOW_MS',
      'RATE_LIMIT_MAX_REQUESTS',
      'AUTH_RATE_LIMIT_MAX',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'DB_SSL',
      'DB_POOL_MIN',
      'DB_POOL_MAX',
      'MAX_FILE_SIZE_MB',
      'ALLOWED_FILE_TYPES',
      'WEBSOCKET_ENABLED',
      'EMAIL_ENABLED',
      'EMAIL_HOST',
      'EMAIL_PORT',
      'EMAIL_SECURE',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'EMAIL_FROM',
      'ECTA_ADMIN_EMAIL',
      'RENEWAL_REMINDERS_ENABLED',
      'RENEWAL_CHECK_SCHEDULE',
      'WEEKLY_SUMMARY_SCHEDULE',
      'AUDIT_RETENTION_DAYS',
      'ENHANCED_AUDIT_ENABLED',
      'MAX_DOCUMENT_SIZE_MB',
      'ALLOWED_DOCUMENT_TYPES',
      'ENABLE_REQUEST_LOGGING',
      'ENABLE_METRICS',
      'DEBUG',
      'ENABLE_API_DOCS',
      'ENABLE_HEALTH_CHECK',
    ];

    // Check for missing variables
    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        errors.push(`Missing required environment variable: ${variable}`);
      }
    }

    // Validate PORT
    const port = parseInt(process.env.PORT || '', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`Invalid PORT: ${process.env.PORT}. Must be between 1 and 65535`);
    }

    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (!['development', 'production', 'test'].includes(nodeEnv || '')) {
      errors.push(`Invalid NODE_ENV: ${nodeEnv}. Must be 'development', 'production', or 'test'`);
    }

    // Validate LOG_LEVEL
    const logLevel = process.env.LOG_LEVEL;
    if (!['error', 'warn', 'info', 'debug'].includes(logLevel || '')) {
      errors.push(`Invalid LOG_LEVEL: ${logLevel}. Must be 'error', 'warn', 'info', or 'debug'`);
    }

    // Validate JWT_SECRET (minimum 32 characters)
    const jwtSecret = process.env.JWT_SECRET || '';
    if (jwtSecret.length < 32) {
      errors.push(`JWT_SECRET must be at least 32 characters long (current: ${jwtSecret.length})`);
    }

    // Validate Database settings
    const dbPort = parseInt(process.env.DB_PORT || '', 10);
    if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
      errors.push(`Invalid DB_PORT: ${process.env.DB_PORT}. Must be between 1 and 65535`);
    }

    const dbPoolMin = parseInt(process.env.DB_POOL_MIN || '', 10);
    if (isNaN(dbPoolMin) || dbPoolMin < 1) {
      errors.push(`Invalid DB_POOL_MIN: ${process.env.DB_POOL_MIN}. Must be at least 1`);
    }

    const dbPoolMax = parseInt(process.env.DB_POOL_MAX || '', 10);
    if (isNaN(dbPoolMax) || dbPoolMax < dbPoolMin) {
      errors.push(`Invalid DB_POOL_MAX: ${process.env.DB_POOL_MAX}. Must be >= DB_POOL_MIN`);
    }

    // Validate Email settings
    const emailPort = parseInt(process.env.EMAIL_PORT || '', 10);
    if (isNaN(emailPort) || emailPort < 1 || emailPort > 65535) {
      errors.push(`Invalid EMAIL_PORT: ${process.env.EMAIL_PORT}. Must be between 1 and 65535`);
    }

    // If there are errors, throw them
    if (errors.length > 0) {
      console.error('❌ Environment Configuration Errors:');
      errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error(`Invalid environment configuration: ${errors.join(', ')}`);
    }

    // Build config object
    this.config = {
      // Application
      PORT: port,
      NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
      LOG_LEVEL: logLevel as 'error' | 'warn' | 'info' | 'debug',

      // Security
      JWT_SECRET: jwtSecret,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      CORS_ORIGIN: process.env.CORS_ORIGIN!,

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10),
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '', 10),
      AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '', 10),

      // Database
      DB_HOST: process.env.DB_HOST!,
      DB_PORT: dbPort,
      DB_NAME: process.env.DB_NAME!,
      DB_USER: process.env.DB_USER!,
      DB_PASSWORD: process.env.DB_PASSWORD!,
      DB_SSL: process.env.DB_SSL === 'true',
      DB_POOL_MIN: dbPoolMin,
      DB_POOL_MAX: dbPoolMax,

      // File Upload
      MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '', 10),
      ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES!,

      // WebSocket
      WEBSOCKET_ENABLED: process.env.WEBSOCKET_ENABLED === 'true',

      // Email
      EMAIL_ENABLED: process.env.EMAIL_ENABLED === 'true',
      EMAIL_HOST: process.env.EMAIL_HOST!,
      EMAIL_PORT: emailPort,
      EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
      EMAIL_USER: process.env.EMAIL_USER!,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD!,
      EMAIL_FROM: process.env.EMAIL_FROM!,
      ECTA_ADMIN_EMAIL: process.env.ECTA_ADMIN_EMAIL!,

      // Pre-Registration System
      RENEWAL_REMINDERS_ENABLED: process.env.RENEWAL_REMINDERS_ENABLED === 'true',
      RENEWAL_CHECK_SCHEDULE: process.env.RENEWAL_CHECK_SCHEDULE!,
      WEEKLY_SUMMARY_SCHEDULE: process.env.WEEKLY_SUMMARY_SCHEDULE!,
      AUDIT_RETENTION_DAYS: parseInt(process.env.AUDIT_RETENTION_DAYS || '', 10),
      ENHANCED_AUDIT_ENABLED: process.env.ENHANCED_AUDIT_ENABLED === 'true',

      // Document Management
      MAX_DOCUMENT_SIZE_MB: parseInt(process.env.MAX_DOCUMENT_SIZE_MB || '', 10),
      ALLOWED_DOCUMENT_TYPES: process.env.ALLOWED_DOCUMENT_TYPES!,

      // Monitoring
      ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true',
      ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
      DEBUG: process.env.DEBUG === 'true',
      ENABLE_API_DOCS: process.env.ENABLE_API_DOCS === 'true',
      ENABLE_HEALTH_CHECK: process.env.ENABLE_HEALTH_CHECK === 'true',
    };

    // Log configuration (without sensitive data)
    console.log('✅ Environment Configuration Loaded:');
    console.log(`  Application: ${this.config.NODE_ENV} (Port ${this.config.PORT})`);
    console.log(`  Database: ${this.config.DB_HOST}:${this.config.DB_PORT}/${this.config.DB_NAME}`);
    console.log(`  Email: ${this.config.EMAIL_ENABLED ? 'Enabled' : 'Disabled'}`);
    console.log(`  WebSocket: ${this.config.WEBSOCKET_ENABLED ? 'Enabled' : 'Disabled'}`);
    console.log(`  Audit Retention: ${this.config.AUDIT_RETENTION_DAYS} days`);

    return this.config;
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();
