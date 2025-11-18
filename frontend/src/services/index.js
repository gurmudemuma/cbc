/**
 * Service Integration Index
 * Centralized export of all API services
 */

// Core API client
export { default as apiClient, setApiBaseUrl } from './api';

// Specialized services
export { default as ectaPreRegistrationService } from './ectaPreRegistration';
export { default as exporterService } from './exporterService';
export { default as bankingService } from './bankingService';
export { default as lotService } from './lotService';
export { default as monetaryService } from './monetaryService';

// Service configuration
export const services = {
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

// Service validation
export const validateServices = () => {
  const issues = [];
  
  Object.entries(services).forEach(([portal, portalServices]) => {
    Object.entries(portalServices).forEach(([service, implementation]) => {
      if (!implementation) {
        issues.push(`${portal}.${service} service not implemented`);
      }
    });
  });
  
  if (issues.length > 0) {
    console.warn('Service integration issues:', issues);
  }
  
  return issues;
};

// Initialize services
export const initializeServices = () => {
  console.log('Initializing CBC services...');
  
  const issues = validateServices();
  
  if (issues.length === 0) {
    console.log('✅ All services properly integrated');
  } else {
    console.warn(`⚠️ ${issues.length} service integration issues found`);
  }
  
  return {
    success: issues.length === 0,
    issues,
  };
};
