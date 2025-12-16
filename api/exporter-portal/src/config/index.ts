import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  // Application
  PORT: parseInt(process.env.PORT || '3007', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),

  // Fabric SDK
  ORGANIZATION_ID: process.env.ORGANIZATION_ID || 'exporter-portal',
  ORGANIZATION_NAME: process.env.ORGANIZATION_NAME || 'ExporterPortal',
  TARGET_PEER_MSP: process.env.TARGET_PEER_MSP || 'CommercialBankMSP',
  CHANNEL_NAME: process.env.CHANNEL_NAME || 'coffeechannel',
  CHAINCODE_NAME_EXPORT: process.env.CHAINCODE_NAME_EXPORT || 'coffee-export',
  CHAINCODE_NAME_USER: process.env.CHAINCODE_NAME_USER || 'user-management',
  CONNECTION_PROFILE_PATH: process.env.CONNECTION_PROFILE_PATH || path.resolve(__dirname, '../../../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.json'),
  WALLET_PATH: process.env.WALLET_PATH || './wallet',

  // File Upload
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx').split(','),

  // External APIs
  COMMERCIAL_BANK_API: process.env.COMMERCIAL_BANK_API || 'http://localhost:3001',
  ECX_API: process.env.ECX_API || 'http://localhost:3006',
  ECTA_API: process.env.ECTA_API || 'http://localhost:3003',
};
