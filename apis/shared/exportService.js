"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusInfo = exports.getAvailableActions = exports.createExportService = exports.BlockchainExportService = void 0;
/**
 * BlockchainExportService - Handles all export-related blockchain operations
 */
class BlockchainExportService {
    constructor(contract) {
        this.contract = contract;
    }
    /**
     * Create a new export request (Exporter)
     */
    async createExport(exportId, commercialbankId, data) {
        // Generate temporary license number if not provided
        const licenseNumber = data.exportLicenseNumber || `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        // Generate temporary ECX lot number if not provided
        const ecxLotNumber = data.ecxLotNumber || `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        // Use default warehouse location if not provided
        const warehouseLocation = data.warehouseLocation || 'Pending Assignment';
        await this.contract.submitTransaction('CreateExportRequest', exportId, commercialbankId, data.exporterName, licenseNumber, data.coffeeType, data.quantity.toString(), data.destinationCountry, data.estimatedValue.toString(), ecxLotNumber, warehouseLocation);
        return this.getExport(exportId);
    }
    /**
     * Get a single export by ID
     */
    async getExport(exportId) {
        const result = await this.contract.evaluateTransaction('GetExport', exportId);
        return JSON.parse(result.toString());
    }
    /**
     * Get all exports
     */
    async getAllExports() {
        const result = await this.contract.evaluateTransaction('GetAllExports');
        const resultStr = result.toString().trim();
        // Handle empty result
        if (!resultStr || resultStr === '') {
            return [];
        }
        try {
            const exports = JSON.parse(resultStr);
            return Array.isArray(exports) ? exports : [];
        }
        catch (error) {
            console.error('Error parsing exports:', error);
            return [];
        }
    }
    /**
     * Get exports by status
     */
    async getExportsByStatus(status) {
        const result = await this.contract.evaluateTransaction('GetExportsByStatus', status);
        const resultStr = result.toString().trim();
        // Handle empty result
        if (!resultStr || resultStr === '') {
            return [];
        }
        try {
            const exports = JSON.parse(resultStr);
            return Array.isArray(exports) ? exports : [];
        }
        catch (error) {
            console.error('Error parsing exports by status:', error);
            return [];
        }
    }
    /**
     * Submit for quality inspection (Exporter)
     */
    async submitForQuality(exportId) {
        await this.contract.submitTransaction('SubmitForQuality', exportId);
    }
    /**
     * Approve quality and issue certificate (NCAT)
     */
    async approveQuality(exportId, data) {
        const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
        await this.contract.submitTransaction('ApproveQuality', exportId, data.qualityGrade, data.certifiedBy, documentCIDsJSON, data.originCertificateNumber || '');
    }
    /**
     * Reject quality (NCAT)
     */
    async rejectQuality(exportId, reason, rejectedBy) {
        await this.contract.submitTransaction('RejectQuality', exportId, reason, rejectedBy);
    }
    /**
     * Submit for FX approval (Exporter)
     */
    async submitForFX(exportId) {
        await this.contract.submitTransaction('SubmitForFX', exportId);
    }
    /**
     * Approve FX (National Bank)
     */
    async approveFX(exportId, data) {
        const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
        await this.contract.submitTransaction('ApproveFX', exportId, data.fxApprovalID, documentCIDsJSON);
    }
    /**
     * Reject FX (National Bank)
     */
    async rejectFX(exportId, reason) {
        await this.contract.submitTransaction('RejectFX', exportId, reason);
    }
    /**
     * Submit for banking review (Exporter)
     */
    async submitForBankingReview(exportId) {
        await this.contract.submitTransaction('SubmitForBankingReview', exportId);
    }
    /**
     * Approve banking/financial documents (commercialbank)
     */
    async approveBanking(exportId, data) {
        const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
        await this.contract.submitTransaction('ApproveBanking', exportId, data.bankingApprovalID, documentCIDsJSON);
    }
    /**
     * Reject banking (commercialbank)
     */
    async rejectBanking(exportId, reason) {
        await this.contract.submitTransaction('RejectBanking', exportId, reason);
    }
    /**
     * Submit to export customs (Exporter)
     */
    async submitToExportCustoms(exportId, declarationNumber) {
        await this.contract.submitTransaction('SubmitToExportCustoms', exportId, declarationNumber);
    }
    /**
     * Clear export customs (Customs Authorities)
     */
    async clearExportCustoms(exportId, data) {
        const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
        await this.contract.submitTransaction('ClearExportCustoms', exportId, data.clearedBy, documentCIDsJSON);
    }
    /**
     * Reject export customs (Customs Authorities)
     */
    async rejectExportCustoms(exportId, reason, rejectedBy) {
        await this.contract.submitTransaction('RejectExportCustoms', exportId, reason, rejectedBy);
    }
    /**
     * Schedule shipment (Shipping Line)
     */
    async scheduleShipment(exportId, data) {
        const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
        await this.contract.submitTransaction('ScheduleShipment', exportId, data.transportIdentifier, data.departureDate, data.arrivalDate, data.transportMode, documentCIDsJSON);
    }
    /**
     * Mark as shipped (Shipping Line)
     */
    async markAsShipped(exportId) {
        await this.contract.submitTransaction('MarkAsShipped', exportId);
    }
    /**
     * Mark as arrived (Shipping Line)
     */
    async markAsArrived(exportId, actualArrivalDate) {
        await this.contract.submitTransaction('MarkAsArrived', exportId, actualArrivalDate);
    }
    /**
     * Submit to import customs (Importer/Shipping Line)
     */
    async submitToImportCustoms(exportId, declarationNumber) {
        await this.contract.submitTransaction('SubmitToImportCustoms', exportId, declarationNumber);
    }
    /**
     * Clear import customs (Destination Customs)
     */
    async clearImportCustoms(exportId, data) {
        const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
        await this.contract.submitTransaction('ClearImportCustoms', exportId, data.clearedBy, documentCIDsJSON);
    }
    /**
     * Confirm delivery (Importer/Shipping Line)
     */
    async confirmDelivery(exportId, confirmedBy) {
        await this.contract.submitTransaction('ConfirmDelivery', exportId, confirmedBy);
    }
    /**
     * Confirm payment received (commercialbank)
     */
    async confirmPayment(exportId, paymentMethod, amount) {
        await this.contract.submitTransaction('ConfirmPayment', exportId, paymentMethod, amount.toString());
    }
    /**
     * Confirm FX repatriation (National Bank)
     */
    async confirmFXRepatriation(exportId, amount) {
        await this.contract.submitTransaction('ConfirmFXRepatriation', exportId, amount.toString());
    }
    /**
     * Cancel export (Exporter)
     */
    async cancelExport(exportId, reason) {
        await this.contract.submitTransaction('CancelExport', exportId, reason);
    }
    /**
     * Update rejected export (Exporter)
     */
    async updateRejectedExport(exportId, data) {
        await this.contract.submitTransaction('UpdateRejectedExport', exportId, data.coffeeType || '', data.quantity?.toString() || '', data.destinationCountry || '', data.estimatedValue?.toString() || '');
    }
}
exports.BlockchainExportService = BlockchainExportService;
/**
 * Factory function to create BlockchainExportService instance
 */
function createExportService(contract) {
    return new BlockchainExportService(contract);
}
exports.createExportService = createExportService;
/**
 * Helper function to get available actions for a role and export status
 */
function getAvailableActions(role, status) {
    const actions = [];
    switch (role) {
        case 'exporter':
            if (status === 'DRAFT')
                actions.push('submit_to_ecx');
            if (status === 'ECX_VERIFIED')
                actions.push('submit_to_ecta');
            if (status === 'ECTA_CONTRACT_APPROVED')
                actions.push('submit_to_bank');
            if (status === 'FX_REJECTED' || status === 'BANK_DOCUMENT_REJECTED' || status === 'ECTA_LICENSE_REJECTED') {
                actions.push('update_export', 'cancel_export');
            }
            break;
        case 'ecx':
            if (status === 'ECX_PENDING')
                actions.push('verify_lot', 'reject_lot');
            break;
        case 'ecta': // ECTA (formerly NCAT)
            if (status === 'ECTA_LICENSE_PENDING')
                actions.push('approve_license', 'reject_license');
            if (status === 'ECTA_QUALITY_PENDING')
                actions.push('approve_quality', 'reject_quality');
            if (status === 'ECTA_CONTRACT_PENDING')
                actions.push('approve_contract', 'reject_contract');
            break;
        case 'bank':
            if (status === 'BANK_DOCUMENT_PENDING')
                actions.push('verify_documents', 'reject_documents');
            if (status === 'BANK_DOCUMENT_VERIFIED')
                actions.push('submit_fx_application');
            if (status === 'PAYMENT_RECEIVED')
                actions.push('confirm_payment');
            break;
        case 'nbe': // National Bank of Ethiopia
            if (status === 'FX_APPLICATION_PENDING')
                actions.push('approve_fx', 'reject_fx');
            if (status === 'FX_REPATRIATED')
                actions.push('confirm_fx_repatriation');
            break;
        case 'customs':
            if (status === 'CUSTOMS_PENDING')
                actions.push('clear_customs', 'reject_customs');
            break;
        case 'shipper':
            if (status === 'CUSTOMS_CLEARED')
                actions.push('schedule_shipment');
            if (status === 'SHIPMENT_SCHEDULED')
                actions.push('mark_as_shipped');
            if (status === 'SHIPPED')
                actions.push('mark_as_arrived');
            if (status === 'ARRIVED')
                actions.push('confirm_delivery');
            break;
    }
    return actions;
}
exports.getAvailableActions = getAvailableActions;
/**
 * Get status display information
 */
function getStatusInfo(status) {
    const statusMap = {
        // Initial States
        DRAFT: { label: 'Draft', color: 'gray', description: 'Export request created' },
        PENDING: { label: 'Pending', color: 'yellow', description: 'Awaiting submission' },
        // ECX Stage
        ECX_PENDING: { label: 'ECX Pending', color: 'yellow', description: 'Awaiting ECX verification' },
        ECX_VERIFIED: { label: 'ECX Verified', color: 'green', description: 'Verified by ECX' },
        ECX_REJECTED: { label: 'ECX Rejected', color: 'red', description: 'Rejected by ECX' },
        // ECTA Stage
        ECTA_LICENSE_PENDING: { label: 'License Pending', color: 'yellow', description: 'Awaiting ECTA license approval' },
        ECTA_LICENSE_APPROVED: { label: 'License Approved', color: 'green', description: 'Export license approved' },
        ECTA_LICENSE_REJECTED: { label: 'License Rejected', color: 'red', description: 'Export license rejected' },
        LICENSE_REJECTED: { label: 'License Rejected', color: 'red', description: 'Export license rejected' }, // Alias
        ECTA_QUALITY_PENDING: { label: 'Quality Pending', color: 'yellow', description: 'Awaiting ECTA quality certification' },
        ECTA_QUALITY_APPROVED: { label: 'Quality Approved', color: 'green', description: 'Quality certified by ECTA' },
        ECTA_QUALITY_REJECTED: { label: 'Quality Rejected', color: 'red', description: 'Quality certification rejected' },
        QUALITY_PENDING: { label: 'Quality Pending', color: 'yellow', description: 'Awaiting quality certification' }, // Alias
        QUALITY_CERTIFIED: { label: 'Quality Certified', color: 'green', description: 'Quality certified' }, // Alias
        QUALITY_REJECTED: { label: 'Quality Rejected', color: 'red', description: 'Quality rejected' }, // Alias
        ECTA_ORIGIN_PENDING: { label: 'Origin Pending', color: 'yellow', description: 'Awaiting origin verification' },
        ECTA_ORIGIN_APPROVED: { label: 'Origin Approved', color: 'green', description: 'Origin verified' },
        ECTA_ORIGIN_REJECTED: { label: 'Origin Rejected', color: 'red', description: 'Origin verification failed' },
        ECTA_CONTRACT_PENDING: { label: 'Contract Pending', color: 'yellow', description: 'Awaiting contract approval' },
        ECTA_CONTRACT_APPROVED: { label: 'Contract Approved', color: 'green', description: 'Contract approved by ECTA' },
        ECTA_CONTRACT_REJECTED: { label: 'Contract Rejected', color: 'red', description: 'Contract rejected' },
        CONTRACT_REJECTED: { label: 'Contract Rejected', color: 'red', description: 'Contract rejected' }, // Alias
        // Commercial Bank Stage
        BANK_DOCUMENT_PENDING: { label: 'Bank Review', color: 'yellow', description: 'Awaiting bank document verification' },
        BANK_DOCUMENT_VERIFIED: { label: 'Documents Verified', color: 'green', description: 'Documents verified by bank' },
        BANK_DOCUMENT_REJECTED: { label: 'Documents Rejected', color: 'red', description: 'Documents rejected by bank' },
        // NBE Stage
        FX_APPLICATION_PENDING: { label: 'FX Pending', color: 'yellow', description: 'Awaiting NBE FX approval' },
        FX_PENDING: { label: 'FX Pending', color: 'yellow', description: 'Awaiting FX approval' }, // Alias
        FX_APPROVED: { label: 'FX Approved', color: 'green', description: 'FX approved by NBE' },
        FX_REJECTED: { label: 'FX Rejected', color: 'red', description: 'FX approval rejected' },
        // Customs Stage
        CUSTOMS_PENDING: { label: 'Customs Pending', color: 'yellow', description: 'Awaiting customs clearance' },
        CUSTOMS_CLEARED: { label: 'Customs Cleared', color: 'green', description: 'Cleared by customs' },
        CUSTOMS_REJECTED: { label: 'Customs Rejected', color: 'red', description: 'Customs clearance rejected' },
        EXPORT_CUSTOMS_PENDING: { label: 'Export Customs Pending', color: 'yellow', description: 'Awaiting export customs clearance' }, // Alias
        EXPORT_CUSTOMS_CLEARED: { label: 'Export Customs Cleared', color: 'green', description: 'Export customs cleared' }, // Alias
        EXPORT_CUSTOMS_REJECTED: { label: 'Export Customs Rejected', color: 'red', description: 'Export customs rejected' }, // Alias
        IMPORT_CUSTOMS_PENDING: { label: 'Import Customs Pending', color: 'yellow', description: 'Awaiting import customs clearance' },
        IMPORT_CUSTOMS_CLEARED: { label: 'Import Customs Cleared', color: 'green', description: 'Import customs cleared' },
        IMPORT_CUSTOMS_REJECTED: { label: 'Import Customs Rejected', color: 'red', description: 'Import customs rejected' },
        // Shipping Stage
        SHIPMENT_PENDING: { label: 'Shipment Pending', color: 'yellow', description: 'Awaiting shipment scheduling' },
        SHIPMENT_SCHEDULED: { label: 'Shipment Scheduled', color: 'blue', description: 'Shipment scheduled' },
        SHIPPED: { label: 'Shipped', color: 'blue', description: 'In transit' },
        SHIPMENT_REJECTED: { label: 'Shipment Rejected', color: 'red', description: 'Shipment rejected' },
        ARRIVED: { label: 'Arrived', color: 'blue', description: 'Arrived at destination' },
        // Final States
        DELIVERED: { label: 'Delivered', color: 'green', description: 'Delivered to buyer' },
        PAYMENT_PENDING: { label: 'Payment Pending', color: 'yellow', description: 'Awaiting payment' },
        PAYMENT_RECEIVED: { label: 'Payment Received', color: 'green', description: 'Payment received' },
        FX_REPATRIATED: { label: 'FX Repatriated', color: 'green', description: 'Foreign exchange repatriated' },
        COMPLETED: { label: 'Completed', color: 'green', description: 'Export process completed' },
        CANCELLED: { label: 'Cancelled', color: 'gray', description: 'Export cancelled' },
    };
    return statusMap[status] || { label: status, color: 'gray', description: 'Unknown status' };
}
exports.getStatusInfo = getStatusInfo;
//# sourceMappingURL=exportService.js.map