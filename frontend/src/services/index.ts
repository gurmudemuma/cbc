/**
 * Service Integration Index
 * Centralized export of all API services
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('ServiceInitializer');

// Core API client
export { default as apiClient, setApiBaseUrl } from './api';

// Specialized services
import ectaPreRegistrationService from './ectaPreRegistration';
import exporterService from './exporterService';
import bankingService from './bankingService';
import lotService from './lotService';
import monetaryService from './monetaryService';

export { default as ectaPreRegistrationService } from './ectaPreRegistration';
export { default as exporterService } from './exporterService';
export { default as bankingService } from './bankingService';
export { default as lotService } from './lotService';
export { default as monetaryService } from './monetaryService';

// Service configuration
interface ServiceConfig {
  [key: string]: any;
}

interface ServicesStructure {
  exporter: ServiceConfig;
  banking: ServiceConfig;
  monetary: ServiceConfig;
  ecx: ServiceConfig;
  ecta: ServiceConfig;
  shipping: ServiceConfig;
  customs: ServiceConfig;
}

export const services: ServicesStructure = {
  // Exporter Portal Services (SDK-based external entity)
  exporter: {
    profile: exporterService,
    preRegistration: ectaPreRegistrationService,
    applications: exporterService,
    exports: exporterService,
    support: exporterService,
  },

  // Commercial Bank Services (consortium member)
  banking: {
    operations: bankingService,
    documents: bankingService,
    financing: bankingService,
    compliance: bankingService,
    blockchain: bankingService,
    gateway: bankingService,
  },

  // National Bank Services (consortium member)
  monetary: {
    policy: monetaryService,
    fx: monetaryService,
    controls: monetaryService,
    compliance: monetaryService,
    oversight: monetaryService,
  },

  // ECX Services (consortium member)
  ecx: {
    lots: lotService,
    trading: lotService,
    warehouse: lotService,
    verification: lotService,
  },

  // ECTA Services (consortium member)
  ecta: {
    preRegistration: ectaPreRegistrationService,
    licenses: ectaPreRegistrationService,
    quality: ectaPreRegistrationService,
    contracts: ectaPreRegistrationService,
  },

  // Shipping Line Services (consortium member)
  shipping: {
    // TODO: Create shipping service
    shipments: null,
    vessels: null,
    logistics: null,
  },

  // Custom Authorities Services (consortium member)
  customs: {
    // TODO: Create customs service
    clearance: null,
    documentation: null,
    border: null,
  },
};

interface ValidationResult {
  success: boolean;
  issues: string[];
}

// Service validation
export const validateServices = (): string[] => {
  const issues: string[] = [];

  Object.entries(services).forEach(([portal, portalServices]) => {
    Object.entries(portalServices).forEach(([service, implementation]) => {
      if (!implementation) {
        issues.push(`${portal}.${service} service not implemented`);
      }
    });
  });

  if (issues.length > 0) {
    logger.warn('Service integration issues', { count: issues.length, issues });
  }

  return issues;
};

// Initialize services
export const initializeServices = (): ValidationResult => {
  logger.info('Initializing CBC services...');

  const issues = validateServices();

  if (issues.length === 0) {
    logger.info('All services properly integrated');
  } else {
    logger.warn(`${issues.length} service integration issues found`, { issues });
  }

  return {
    success: issues.length === 0,
    issues,
  };
};
