/**
 * Phase 4: Logistics & Customs Service
 * Frontend API wrapper for customs declarations, shipping, containers, and vessels
 */

import apiClient from './api';

// ==================== Types ====================

export interface CustomsDeclaration {
    declarationId?: string;
    shipmentId: string;
    exporterId: string;
    hsCode: string;
    tariffDescription: string;
    customsValue: number;
    currency: string;
    declarationType: string;
    customsOffice: string;
    dutyAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    status?: string;
    attachedCertificates?: string[];
    attachedInvoices?: string[];
    submittedAt?: string;
    approvedAt?: string;
    clearedAt?: string;
    createdAt?: string;
}

export interface FumigationCertificate {
    fumigationId?: string;
    shipmentId: string;
    containerId: string;
    fumigationType: string;
    chemical?: string;
    dosage?: number;
    issuingCompany: string;
    companyLicense: string;
    treatmentDate?: string;
    treatmentDuration?: number;
    ispm15Compliant?: boolean;
    certificateNumber?: string;
    validUntil?: string;
    status?: string;
    createdAt?: string;
}

export interface ShippingInstruction {
    instructionId?: string;
    shipmentId: string;
    exporterId?: string;
    shippingLine: string;
    bookingNumber: string;
    containerType: string;
    containerCount: number;
    portOfLoading: string;
    portOfLoadingCode?: string;
    portOfDischarge: string;
    portOfDischargeCode?: string;
    finalDestination?: string;
    cargoDescription?: string;
    grossWeight?: number;
    netWeight?: number;
    volume?: number;
    specialInstructions?: string;
    status?: string;
    createdAt?: string;
}

export interface BillOfLading {
    blNumber?: string;
    shipmentId: string;
    instructionId: string;
    blType: string;
    shipper: { name: string; address: string; country: string; contact: string };
    consignee: { name: string; address: string; country: string; contact: string };
    notifyParty?: { name: string; address: string; country: string; contact: string };
    vesselName: string;
    vesselId?: string;
    voyageNumber: string;
    portOfLoading: string;
    portOfDischarge: string;
    placeOfReceipt?: string;
    placeOfDelivery?: string;
    containers: Array<{
        containerNumber: string;
        sealNumber: string;
        marksAndNumbers?: string;
        numberOfPackages: number;
        description: string;
        grossWeight: number;
        measurement?: number;
    }>;
    freightTerms: string;
    freightAmount?: number;
    freightCurrency?: string;
    numberOfOriginals?: number;
    issuedBy?: string;
    status?: string;
    createdAt?: string;
}

export interface Container {
    containerId?: string;
    containerNumber: string;
    shipmentId: string;
    containerType: string;
    size?: string;
    sealNumber?: string;
    sealType?: string;
    sealedBy?: string;
    loadedWeight?: number;
    loadedDate?: string;
    status?: string;
    currentLocation?: string;
    vesselId?: string;
    statusHistory?: Array<{ status: string; location: string; timestamp: string; remarks?: string }>;
    createdAt?: string;
}

export interface Vessel {
    vesselId?: string;
    vesselName: string;
    imoNumber: string;
    voyageNumber: string;
    shippingLine: string;
    departurePort: string;
    departurePortCode?: string;
    arrivalPort: string;
    arrivalPortCode?: string;
    scheduledDeparture?: string;
    estimatedArrival?: string;
    actualDeparture?: string;
    actualArrival?: string;
    status?: string;
    currentLocation?: { latitude?: number; longitude?: number; port?: string };
    locationHistory?: Array<{ latitude: number; longitude: number; port?: string; timestamp: string }>;
    containers?: string[];
    delays?: Array<{ reason: string; duration: string; timestamp: string }>;
    createdAt?: string;
}

// ==================== Customs API ====================

export const customsService = {
    createDeclaration: async (data: Partial<CustomsDeclaration>) => {
        const response = await apiClient.post('/api/customs/declaration', data);
        return response.data;
    },

    submitDeclaration: async (declarationId: string) => {
        const response = await apiClient.post(`/api/customs/declaration/${declarationId}/submit`);
        return response.data;
    },

    reviewDeclaration: async (declarationId: string, reviewData: { approved: boolean; reviewedBy: string; comments: string }) => {
        const response = await apiClient.post(`/api/customs/declaration/${declarationId}/review`, reviewData);
        return response.data;
    },

    clearCustoms: async (declarationId: string, clearanceData: { clearedBy: string; comments?: string }) => {
        const response = await apiClient.post(`/api/customs/declaration/${declarationId}/clear`, clearanceData);
        return response.data;
    },

    getDeclaration: async (declarationId: string) => {
        const response = await apiClient.get(`/api/customs/declaration/${declarationId}`);
        return response.data;
    },
};

// ==================== Fumigation API ====================

export const fumigationService = {
    requestFumigation: async (data: Partial<FumigationCertificate>) => {
        const response = await apiClient.post('/api/shipping/fumigation/request', data);
        return response.data;
    },

    issueCertificate: async (fumigationId: string, certData: { issuedBy: string; treatmentDate: string; treatmentDuration: number; ispm15Compliant: boolean }) => {
        const response = await apiClient.post(`/api/shipping/fumigation/${fumigationId}/issue`, certData);
        return response.data;
    },

    getCertificate: async (fumigationId: string) => {
        const response = await apiClient.get(`/api/shipping/fumigation/${fumigationId}`);
        return response.data;
    },
};

// ==================== Shipping API ====================

export const shippingService = {
    createInstructions: async (data: Partial<ShippingInstruction>) => {
        const response = await apiClient.post('/api/shipping/instructions', data);
        return response.data;
    },

    confirmInstructions: async (instructionId: string, data: { confirmedBy: string }) => {
        const response = await apiClient.post(`/api/shipping/instructions/${instructionId}/confirm`, data);
        return response.data;
    },

    generateBillOfLading: async (data: Partial<BillOfLading>) => {
        const response = await apiClient.post('/api/shipping/bill-of-lading', data);
        return response.data;
    },

    getBillOfLading: async (blNumber: string) => {
        const response = await apiClient.get(`/api/shipping/bill-of-lading/${blNumber}`);
        return response.data;
    },
};

// ==================== Container API ====================

export const containerService = {
    assignContainer: async (data: Partial<Container>) => {
        const response = await apiClient.post('/api/container/assign', data);
        return response.data;
    },

    updateStatus: async (containerId: string, statusData: { status: string; location: string; remarks?: string }) => {
        const response = await apiClient.put(`/api/container/${containerId}/status`, statusData);
        return response.data;
    },

    sealContainer: async (containerId: string, sealData: { sealNumber: string; sealType: string; sealedBy: string }) => {
        const response = await apiClient.post(`/api/container/${containerId}/seal`, sealData);
        return response.data;
    },

    getContainer: async (containerId: string) => {
        const response = await apiClient.get(`/api/container/${containerId}`);
        return response.data;
    },

    getByShipment: async (shipmentId: string) => {
        const response = await apiClient.get(`/api/container/shipment/${shipmentId}`);
        return response.data;
    },
};

// ==================== Vessel API ====================

export const vesselService = {
    createVessel: async (data: Partial<Vessel>) => {
        const response = await apiClient.post('/api/vessel/create', data);
        return response.data;
    },

    updateLocation: async (vesselId: string, locationData: { latitude: number; longitude: number; port?: string; speed?: number; heading?: number }) => {
        const response = await apiClient.put(`/api/vessel/${vesselId}/location`, locationData);
        return response.data;
    },

    updateStatus: async (vesselId: string, statusData: { status: string; delay?: { reason: string; duration: string } }) => {
        const response = await apiClient.put(`/api/vessel/${vesselId}/status`, statusData);
        return response.data;
    },

    getVessel: async (vesselId: string) => {
        const response = await apiClient.get(`/api/vessel/${vesselId}`);
        return response.data;
    },
};

export default {
    customs: customsService,
    fumigation: fumigationService,
    shipping: shippingService,
    container: containerService,
    vessel: vesselService,
};
