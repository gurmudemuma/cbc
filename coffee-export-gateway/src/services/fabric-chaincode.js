/**
 * Fabric Chaincode Service
 * Connects to external chaincode server running the actual smart contract
 */

const axios = require('axios');

const CHAINCODE_URL = process.env.CHAINCODE_URL || 'http://localhost:3001';

class FabricChaincodeService {
    constructor() {
        this.chaincodeUrl = CHAINCODE_URL;
        console.log(`[Fabric Chaincode Service] Connecting to chaincode at ${this.chaincodeUrl}`);
    }

    /**
     * Submit a transaction (compatible with Fabric SDK interface)
     */
    async submitTransaction(userId, chaincodeName, functionName, ...args) {
        return await this.invokeChaincode(functionName, args);
    }

    /**
     * Evaluate a transaction (compatible with Fabric SDK interface)
     */
    async evaluateTransaction(userId, chaincodeName, functionName, ...args) {
        return await this.queryChaincode(functionName, args);
    }

    /**
     * Register exporter (compatible with Fabric SDK interface)
     */
    async registerExporter(username, attributes) {
        // In chaincode mode, this is handled by the smart contract
        console.log(`[Chaincode] Registering exporter: ${username}`);
        return { success: true, username };
    }

    /**
     * Get wallet (compatible with Fabric SDK interface)
     */
    async getWallet() {
        // In chaincode mode, wallet is managed by the chaincode server
        return {
            get: async (userId) => ({ userId, type: 'chaincode' })
        };
    }

    /**
     * Invoke a chaincode function (writes to ledger)
     */
    async invokeChaincode(fcn, args = []) {
        try {
            console.log(`[Chaincode Invoke] ${fcn}`, args);
            const response = await axios.post(`${this.chaincodeUrl}/invoke`, {
                fcn,
                args
            });
            
            if (response.data.success) {
                return response.data.result;
            } else {
                throw new Error(response.data.error || 'Chaincode invocation failed');
            }
        } catch (error) {
            console.error(`[Chaincode Error] ${fcn}:`, error.message);
            throw new Error(`Chaincode invocation failed: ${error.message}`);
        }
    }

    /**
     * Query a chaincode function (reads from ledger)
     */
    async queryChaincode(fcn, args = []) {
        try {
            console.log(`[Chaincode Query] ${fcn}`, args);
            const response = await axios.post(`${this.chaincodeUrl}/query`, {
                fcn,
                args
            });
            
            if (response.data.success) {
                return response.data.result;
            } else {
                throw new Error(response.data.error || 'Chaincode query failed');
            }
        } catch (error) {
            console.error(`[Chaincode Error] ${fcn}:`, error.message);
            throw new Error(`Chaincode query failed: ${error.message}`);
        }
    }

    /**
     * Initialize the ledger with sample data
     */
    async initLedger() {
        return await this.invokeChaincode('InitLedger', []);
    }

    // ==================== User Management Functions ====================

    async registerUser(userData) {
        return await this.invokeChaincode('RegisterUser', [JSON.stringify(userData)]);
    }

    async getUser(username) {
        const result = await this.queryChaincode('GetUser', [username]);
        return JSON.parse(result);
    }

    async updateUserStatus(username, statusData) {
        return await this.invokeChaincode('UpdateUserStatus', [username, JSON.stringify(statusData)]);
    }

    async getUsersByRole(role) {
        const result = await this.queryChaincode('GetUsersByRole', [role]);
        return JSON.parse(result);
    }

    async getPendingUsers() {
        const result = await this.queryChaincode('GetPendingUsers', []);
        return JSON.parse(result);
    }

    async getUsersByStatus(status) {
        const result = await this.queryChaincode('GetUsersByStatus', [status]);
        return JSON.parse(result);
    }

    // ==================== Statutory Documents (Directive No. 1106/2025) ====================

    async uploadStatutoryDocument(exporterId, documentType, documentData) {
        return await this.invokeChaincode('UploadStatutoryDocument', [exporterId, documentType, JSON.stringify(documentData)]);
    }

    async verifyStatutoryDocument(exporterId, documentType, verificationData) {
        return await this.invokeChaincode('VerifyStatutoryDocument', [exporterId, documentType, JSON.stringify(verificationData)]);
    }

    async updateNBEStatus(exporterId, nbeStatus) {
        return await this.invokeChaincode('UpdateNBEStatus', [exporterId, JSON.stringify(nbeStatus)]);
    }

    async getPendingDocumentVerifications() {
        const result = await this.queryChaincode('GetPendingDocumentVerifications', []);
        return JSON.parse(result);
    }

    async checkStatutoryCompliance(exporterId) {
        const result = await this.queryChaincode('CheckStatutoryCompliance', [exporterId]);
        return JSON.parse(result);
    }

    // ==================== Exporter Functions ====================

    async registerExporter(exporterData) {
        return await this.invokeChaincode('RegisterExporter', [JSON.stringify(exporterData)]);
    }

    async getExporter(exporterId) {
        const result = await this.queryChaincode('GetExporter', [exporterId]);
        return JSON.parse(result);
    }

    async updateExporter(exporterId, updates) {
        return await this.invokeChaincode('UpdateExporter', [exporterId, JSON.stringify(updates)]);
    }

    async getAllExporters() {
        const result = await this.queryChaincode('GetAllExporters', []);
        return JSON.parse(result);
    }

    async queryExportersByStatus(status) {
        const result = await this.queryChaincode('QueryExportersByStatus', [status]);
        return JSON.parse(result);
    }

    // ==================== License Functions ====================

    async issueLicense(licenseData) {
        return await this.invokeChaincode('IssueLicense', [JSON.stringify(licenseData)]);
    }

    async getLicense(licenseId) {
        const result = await this.queryChaincode('GetLicense', [licenseId]);
        return JSON.parse(result);
    }

    async renewLicense(licenseId, newExpiryDate) {
        return await this.invokeChaincode('RenewLicense', [licenseId, newExpiryDate]);
    }

    async revokeLicense(licenseId, reason) {
        return await this.invokeChaincode('RevokeLicense', [licenseId, reason]);
    }

    async queryLicensesByExporter(exporterId) {
        const result = await this.queryChaincode('QueryLicensesByExporter', [exporterId]);
        return JSON.parse(result);
    }

    // ==================== Contract Functions ====================

    async createContract(contractData) {
        return await this.invokeChaincode('CreateContract', [JSON.stringify(contractData)]);
    }

    async getContract(contractId) {
        const result = await this.queryChaincode('GetContract', [contractId]);
        return JSON.parse(result);
    }

    async approveContract(contractId, approver, comments) {
        return await this.invokeChaincode('ApproveContract', [contractId, approver, comments || '']);
    }

    async rejectContract(contractId, approver, reason) {
        return await this.invokeChaincode('RejectContract', [contractId, approver, reason]);
    }

    async queryContractsByExporter(exporterId) {
        const result = await this.queryChaincode('QueryContractsByExporter', [exporterId]);
        return JSON.parse(result);
    }

    // ==================== Quality Certificate Functions ====================

    async issueQualityCertificate(certData) {
        return await this.invokeChaincode('IssueQualityCertificate', [JSON.stringify(certData)]);
    }

    async getQualityCertificate(certId) {
        const result = await this.queryChaincode('GetQualityCertificate', [certId]);
        return JSON.parse(result);
    }

    async queryQualityCertsByContract(contractId) {
        const result = await this.queryChaincode('QueryQualityCertsByContract', [contractId]);
        return JSON.parse(result);
    }

    // ==================== ESW Functions ====================

    async submitESW(eswData) {
        return await this.invokeChaincode('SubmitESW', [JSON.stringify(eswData)]);
    }

    async getESW(eswId) {
        const result = await this.queryChaincode('GetESW', [eswId]);
        return JSON.parse(result);
    }

    async approveESW(eswId, approver, stage, comments) {
        return await this.invokeChaincode('ApproveESW', [eswId, approver, stage, comments || '']);
    }

    async rejectESW(eswId, approver, stage, reason) {
        return await this.invokeChaincode('RejectESW', [eswId, approver, stage, reason]);
    }

    async queryESWByExporter(exporterId) {
        const result = await this.queryChaincode('QueryESWByExporter', [exporterId]);
        return JSON.parse(result);
    }

    async queryESWByStatus(status) {
        const result = await this.queryChaincode('QueryESWByStatus', [status]);
        return JSON.parse(result);
    }

    // ==================== Shipment Functions (Phase 2: Per-Shipment Workflow) ====================

    async createShipment(shipmentData) {
        return await this.invokeChaincode('CreateShipment', [JSON.stringify(shipmentData)]);
    }

    async getShipment(shipmentId) {
        const result = await this.queryChaincode('GetShipment', [shipmentId]);
        return JSON.parse(result);
    }

    async getShipmentsByExporter(exporterId) {
        const result = await this.queryChaincode('GetShipmentsByExporter', [exporterId]);
        return JSON.parse(result);
    }

    async registerSalesContract(shipmentId) {
        return await this.invokeChaincode('RegisterSalesContract', [shipmentId]);
    }

    async validateMinimumPrice(shipmentId, minimumPriceData) {
        return await this.invokeChaincode('ValidateMinimumPrice', [shipmentId, JSON.stringify(minimumPriceData)]);
    }

    async approveSalesContract(shipmentId, approvalData) {
        return await this.invokeChaincode('ApproveSalesContract', [shipmentId, JSON.stringify(approvalData)]);
    }

    async generateCommercialInvoice(shipmentId) {
        return await this.invokeChaincode('GenerateCommercialInvoice', [shipmentId]);
    }

    async updatePaymentDetails(shipmentId, paymentData) {
        return await this.invokeChaincode('UpdatePaymentDetails', [shipmentId, JSON.stringify(paymentData)]);
    }

    async verifyPayment(shipmentId, verificationData) {
        return await this.invokeChaincode('VerifyPayment', [shipmentId, JSON.stringify(verificationData)]);
    }

    async updatePackingList(shipmentId, packingData) {
        return await this.invokeChaincode('UpdatePackingList', [shipmentId, JSON.stringify(packingData)]);
    }

    async getPendingContractApprovals() {
        const result = await this.queryChaincode('GetPendingContractApprovals', []);
        return JSON.parse(result);
    }

    async getPendingPaymentVerifications() {
        const result = await this.queryChaincode('GetPendingPaymentVerifications', []);
        return JSON.parse(result);
    }

    // ==================== Minimum Price Management ====================

    async setMinimumPrice(priceData) {
        return await this.invokeChaincode('SetMinimumPrice', [JSON.stringify(priceData)]);
    }

    async getMinimumPrice(grade, coffeeType) {
        const result = await this.queryChaincode('GetMinimumPrice', [grade, coffeeType]);
        return JSON.parse(result);
    }

    async getPriceHistory(grade, coffeeType) {
        const result = await this.queryChaincode('GetPriceHistory', [grade, coffeeType]);
        return JSON.parse(result);
    }

    // Legacy method for backward compatibility
    async updateShipmentStatus(shipmentId, status, location, updatedBy) {
        return await this.invokeChaincode('UpdateShipmentStatus', [shipmentId, status, location, updatedBy]);
    }

    async queryShipmentsByExporter(exporterId) {
        return await this.getShipmentsByExporter(exporterId);
    }

    // ==================== Payment Functions ====================

    async recordPayment(paymentData) {
        return await this.invokeChaincode('RecordPayment', [JSON.stringify(paymentData)]);
    }

    async getPayment(paymentId) {
        const result = await this.queryChaincode('GetPayment', [paymentId]);
        return JSON.parse(result);
    }

    async queryPaymentsByContract(contractId) {
        const result = await this.queryChaincode('QueryPaymentsByContract', [contractId]);
        return JSON.parse(result);
    }

    // ==================== Document Functions ====================

    async uploadDocument(docData) {
        return await this.invokeChaincode('UploadDocument', [JSON.stringify(docData)]);
    }

    async getDocument(docId) {
        const result = await this.queryChaincode('GetDocument', [docId]);
        return JSON.parse(result);
    }

    async verifyDocument(docId, verifier, status, comments) {
        return await this.invokeChaincode('VerifyDocument', [docId, verifier, status, comments || '']);
    }

    async queryDocumentsByEntity(entityId, entityType) {
        const result = await this.queryChaincode('QueryDocumentsByEntity', [entityId, entityType]);
        return JSON.parse(result);
    }

    // ==================== History Functions ====================

    async getAssetHistory(assetId) {
        const result = await this.queryChaincode('GetAssetHistory', [assetId]);
        return JSON.parse(result);
    }

    // ==================== Health Check ====================

    async healthCheck() {
        try {
            const response = await axios.get(`${this.chaincodeUrl}/health`);
            return response.data;
        } catch (error) {
            throw new Error(`Chaincode server not reachable: ${error.message}`);
        }
    }

    // ==================== PHASE 3: Certificate Functions ====================

    async requestCertificate(certificateRequest) {
        return await this.invokeChaincode('RequestCertificate', [JSON.stringify(certificateRequest)]);
    }

    async issueCQICAuthorization(certificateId, authorizationData) {
        return await this.invokeChaincode('IssueCQICAuthorization', [certificateId, JSON.stringify(authorizationData)]);
    }

    async issuePhytosanitaryCertificate(certificateId, inspectionData) {
        return await this.invokeChaincode('IssuePhytosanitaryCertificate', [certificateId, JSON.stringify(inspectionData)]);
    }

    async issueCertificateOfOrigin(certificateId, originData) {
        return await this.invokeChaincode('IssueCertificateOfOrigin', [certificateId, JSON.stringify(originData)]);
    }

    async issueEUDRCompliance(certificateId, eudrData) {
        return await this.invokeChaincode('IssueEUDRCompliance', [certificateId, JSON.stringify(eudrData)]);
    }

    async issueICOCertificate(certificateId, icoData) {
        return await this.invokeChaincode('IssueICOCertificate', [certificateId, JSON.stringify(icoData)]);
    }

    async getCertificate(certificateId) {
        const result = await this.queryChaincode('GetCertificate', [certificateId]);
        return JSON.parse(result);
    }

    async getCertificatesByShipment(shipmentId) {
        const result = await this.queryChaincode('GetCertificatesByShipment', [shipmentId]);
        return JSON.parse(result);
    }

    async getPendingCertificates(certificateType, agency) {
        const result = await this.queryChaincode('GetPendingCertificates', [certificateType || '', agency || '']);
        return JSON.parse(result);
    }

    async revokeCertificate(certificateId, revocationData) {
        return await this.invokeChaincode('RevokeCertificate', [certificateId, JSON.stringify(revocationData)]);
    }

    async verifyCertificate(certificateNumber) {
        const result = await this.queryChaincode('VerifyCertificate', [certificateNumber]);
        return JSON.parse(result);
    }

    // ==================== GPS Tracking Functions ====================

    async recordGPSPlot(gpsPlotData) {
        return await this.invokeChaincode('RecordGPSPlot', [JSON.stringify(gpsPlotData)]);
    }

    async updateDeforestationCheck(plotId, checkData) {
        return await this.invokeChaincode('UpdateDeforestationCheck', [plotId, JSON.stringify(checkData)]);
    }

    async getGPSPlotsByShipment(shipmentId) {
        const result = await this.queryChaincode('GetGPSPlotsByShipment', [shipmentId]);
        return JSON.parse(result);
    }

    async verifyGPSPlot(plotId, verificationData) {
        return await this.invokeChaincode('VerifyGPSPlot', [plotId, JSON.stringify(verificationData)]);
    }

    // ==================== Certificate Bundle Functions ====================

    async generateCertificateBundle(shipmentId) {
        return await this.invokeChaincode('GenerateCertificateBundle', [shipmentId]);
    }

    async getCertificateBundle(bundleId) {
        const result = await this.queryChaincode('GetCertificateBundle', [bundleId]);
        return JSON.parse(result);
    }

    // ==================== PHASE 4: Customs Management ====================

    async createCustomsDeclaration(declarationData) {
        return await this.invokeChaincode('CreateCustomsDeclaration', [JSON.stringify(declarationData)]);
    }

    async submitCustomsDeclaration(declarationId) {
        return await this.invokeChaincode('SubmitCustomsDeclaration', [declarationId]);
    }

    async reviewCustomsDeclaration(declarationId, reviewData) {
        return await this.invokeChaincode('ReviewCustomsDeclaration', [declarationId, JSON.stringify(reviewData)]);
    }

    async clearCustoms(declarationId, clearanceData) {
        return await this.invokeChaincode('ClearCustoms', [declarationId, JSON.stringify(clearanceData)]);
    }

    async getCustomsDeclaration(declarationId) {
        const result = await this.queryChaincode('GetCustomsDeclaration', [declarationId]);
        return JSON.parse(result);
    }

    // ==================== PHASE 4: Fumigation Management ====================

    async requestFumigation(fumigationData) {
        return await this.invokeChaincode('RequestFumigation', [JSON.stringify(fumigationData)]);
    }

    async issueFumigationCertificate(fumigationId, certificateData) {
        return await this.invokeChaincode('IssueFumigationCertificate', [fumigationId, JSON.stringify(certificateData)]);
    }

    async getFumigationCertificate(fumigationId) {
        const result = await this.queryChaincode('GetFumigationCertificate', [fumigationId]);
        return JSON.parse(result);
    }

    // ==================== PHASE 4: Shipping Documentation ====================

    async createShippingInstructions(instructionsData) {
        return await this.invokeChaincode('CreateShippingInstructions', [JSON.stringify(instructionsData)]);
    }

    async confirmShippingInstructions(instructionId, confirmationData) {
        return await this.invokeChaincode('ConfirmShippingInstructions', [instructionId, JSON.stringify(confirmationData)]);
    }

    async generateBillOfLading(blData) {
        return await this.invokeChaincode('GenerateBillOfLading', [JSON.stringify(blData)]);
    }

    async getBillOfLading(blNumber) {
        const result = await this.queryChaincode('GetBillOfLading', [blNumber]);
        return JSON.parse(result);
    }

    // ==================== PHASE 4: Container Management ====================

    async assignContainer(containerData) {
        return await this.invokeChaincode('AssignContainer', [JSON.stringify(containerData)]);
    }

    async updateContainerStatus(containerId, statusData) {
        return await this.invokeChaincode('UpdateContainerStatus', [containerId, JSON.stringify(statusData)]);
    }

    async sealContainer(containerId, sealData) {
        return await this.invokeChaincode('SealContainer', [containerId, JSON.stringify(sealData)]);
    }

    async getContainer(containerId) {
        const result = await this.queryChaincode('GetContainer', [containerId]);
        return JSON.parse(result);
    }

    async getContainersByShipment(shipmentId) {
        const result = await this.queryChaincode('GetContainersByShipment', [shipmentId]);
        return JSON.parse(result);
    }

    // ==================== PHASE 4: Vessel Management ====================

    async createVessel(vesselData) {
        return await this.invokeChaincode('CreateVessel', [JSON.stringify(vesselData)]);
    }

    async updateVesselLocation(vesselId, locationData) {
        return await this.invokeChaincode('UpdateVesselLocation', [vesselId, JSON.stringify(locationData)]);
    }

    async updateVesselStatus(vesselId, statusData) {
        return await this.invokeChaincode('UpdateVesselStatus', [vesselId, JSON.stringify(statusData)]);
    }

    async getVessel(vesselId) {
        const result = await this.queryChaincode('GetVessel', [vesselId]);
        return JSON.parse(result);
    }
}

module.exports = new FabricChaincodeService();

