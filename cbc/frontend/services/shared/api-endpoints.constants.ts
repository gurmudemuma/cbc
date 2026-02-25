/**
 * Shared API Endpoints Constants
 * Single source of truth for service definitions
 * Used by both backend and frontend
 */

export interface ServiceConfig {
  id: string;
  name: string;
  port: number;
  mspId: string | null;
  description: string;
  order: number;
  type?: 'external' | 'consortium';
  hasAuth?: boolean;
}

export const SERVICES: Record<string, ServiceConfig> = {
  EXPORTER_PORTAL: {
    id: 'exporter-portal',
    name: 'Exporter Portal',
    port: 3000,
    mspId: null,
    description: 'Coffee exporter management portal',
    order: 1,
    type: 'external',
    hasAuth: true,
  },
  COMMERCIAL_BANK: {
    id: 'commercial-bank',
    name: 'Commercial Bank',
    port: 3001,
    mspId: 'CommercialBankMSP',
    description: 'Commercial banking services',
    order: 2,
    type: 'consortium',
    hasAuth: true,
  },
  NATIONAL_BANK: {
    id: 'national-bank',
    name: 'National Bank of Ethiopia (NBE)',
    port: 3002,
    mspId: 'NationalBankMSP',
    description: 'Central bank and forex approval',
    order: 3,
    type: 'consortium',
    hasAuth: true,
  },
  ECTA: {
    id: 'ecta',
    name: 'Ethiopian Coffee & Tea Authority (ECTA)',
    port: 3003,
    mspId: 'ECTAMSP',
    description: 'Coffee quality certification and licensing',
    order: 4,
    type: 'consortium',
    hasAuth: true,
  },
  CUSTOM_AUTHORITIES: {
    id: 'custom-authorities',
    name: 'Ethiopian Revenues and Customs Authority (ERCA)',
    port: 3004,
    mspId: 'CustomsMSP',
    description: 'Customs clearance and compliance',
    order: 5,
    type: 'consortium',
    hasAuth: true,
  },
  ECX: {
    id: 'ecx',
    name: 'Ethiopian Commodity Exchange (ECX)',
    port: 3005,
    mspId: 'ECXMSP',
    description: 'Commodity exchange verification',
    order: 6,
    type: 'consortium',
    hasAuth: true,
  },
  ESW: {
    id: 'esw',
    name: 'Electronic Single Window (ESW)',
    port: 3008,
    mspId: null,
    description: 'Unified government agency approvals',
    order: 7,
    type: 'external',
    hasAuth: true,
  },
  SHIPPING_LINE: {
    id: 'shipping-line',
    name: 'Shipping Line',
    port: 3007,
    mspId: 'ShippingMSP',
    description: 'Shipping and logistics services',
    order: 8,
    type: 'consortium',
    hasAuth: true,
  },
};

export const getAllServices = (): ServiceConfig[] => {
  return Object.values(SERVICES).sort((a, b) => a.order - b.order);
};

export const getServiceById = (id: string): ServiceConfig | undefined => {
  return Object.values(SERVICES).find(s => s.id === id);
};

export const getServiceByPort = (port: number): ServiceConfig | undefined => {
  return Object.values(SERVICES).find(s => s.port === port);
};

export default {
  SERVICES,
  getAllServices,
  getServiceById,
  getServiceByPort,
};
