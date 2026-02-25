/**
 * ECTA Coffee Export Blockchain SDK
 * 
 * This SDK allows exporters to interact with the Ethiopian Coffee Export
 * Blockchain system through a simple, easy-to-use interface.
 * 
 * Exporters use this SDK to:
 * - Register their company
 * - Submit export contracts
 * - Track shipments
 * - View certificates
 * - Monitor export status
 */

const axios = require('axios');

class CoffeeExportSDK {
    /**
     * Initialize the SDK
     * @param {Object} config - Configuration object
     * @param {string} config.gatewayUrl - URL of the backend gateway (default: http://localhost:3000)
     * @param {string} config.apiKey - API key for authentication (optional)
     * @param {string} config.exporterId - Exporter ID (required after login)
     * @param {string} config.token - JWT token (set after login)
     */
    constructor(config = {}) {
        this.gatewayUrl = config.gatewayUrl || 'http://localhost:3000';
        this.apiKey = config.apiKey || null;
        this.exporterId = config.exporterId || null;
        this.token = config.token || null;
        
        console.log(`[ECTA SDK] Initialized with gateway: ${this.gatewayUrl}`);
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token from login
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Set exporter ID
     * @param {string} exporterId - Exporter ID
     */
    setExporterId(exporterId) {
        this.exporterId = exporterId;
    }

    /**
     * Get request headers with authentication
     */
    _getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }
        
        return headers;
    }

    /**
     * Make API request
     */
    async _request(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${this.gatewayUrl}${endpoint}`,
                headers: this._getHeaders()
            };
            
            if (data) {
                config.data = data;
            }
            
            const response = await axios(config);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            throw new Error(`SDK Error: ${errorMessage}`);
        }
    }

    // ==================== Authentication ====================

    /**
     * Register new exporter (PUBLIC - no authentication required)
     * @param {Object} data - Registration data
     * @param {string} data.username - Desired username
     * @param {string} data.password - Password
     * @param {string} data.email - Email address
     * @param {string} data.phone - Phone number
     * @param {string} data.companyName - Company name
     * @param {string} data.tin - Tax Identification Number
     * @param {number} data.capitalETB - Capital in ETB (minimum 50,000,000)
     * @param {string} data.address - Company address
     * @param {string} data.contactPerson - Contact person name
     * @returns {Promise<Object>} Registration response
     */
    async register(data) {
        if (!data.username || !data.password || !data.email || !data.companyName || !data.tin || !data.capitalETB) {
            throw new Error('Missing required fields: username, password, email, companyName, tin, capitalETB');
        }
        
        if (data.capitalETB < 50000000) {
            throw new Error('Minimum capital requirement is 50,000,000 ETB');
        }
        
        // Make request WITHOUT authentication
        try {
            const config = {
                method: 'POST',
                url: `${this.gatewayUrl}/api/auth/register`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data
            };
            
            const response = await axios(config);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            throw new Error(`Registration Error: ${errorMessage}`);
        }
    }

    /**
     * Check registration status (PUBLIC - no authentication required)
     * @param {string} username - Username to check
     * @returns {Promise<Object>} Registration status
     */
    async checkRegistrationStatus(username) {
        try {
            const config = {
                method: 'GET',
                url: `${this.gatewayUrl}/api/auth/registration-status/${username}`,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const response = await axios(config);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            throw new Error(`Status Check Error: ${errorMessage}`);
        }
    }

    /**
     * Login to the system
     * @param {string} username - Exporter username
     * @param {string} password - Password
     * @returns {Promise<Object>} Login response with token
     */
    async login(username, password) {
        const response = await this._request('POST', '/api/auth/login', {
            username,
            password
        });
        
        if (response.token) {
            this.setToken(response.token);
            this.setExporterId(response.user.exporterId || response.user.id || username);
        }
        
        return response;
    }

    /**
     * Logout from the system
     */
    logout() {
        this.token = null;
        this.exporterId = null;
    }

    // ==================== Qualification Documents ====================

    /**
     * Submit qualification document (laboratory, taster, competence)
     * @param {string} stage - Qualification stage (laboratory, taster, competenceCertificate)
     * @param {Object} data - Qualification data
     * @returns {Promise<Object>} Submission response
     */
    async submitQualification(stage, data) {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        const validStages = ['laboratory', 'taster', 'competenceCertificate'];
        if (!validStages.includes(stage)) {
            throw new Error(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
        }
        
        return await this._request('POST', `/api/ecta/qualifications/${stage}`, data);
    }

    /**
     * Get qualification status
     * @returns {Promise<Object>} Qualification status
     */
    async getQualificationStatus() {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        return await this._request('GET', '/api/ecta/qualifications/status');
    }

    // ==================== Pre-Registration ====================

    /**
     * Submit pre-registration application
     * @param {Object} data - Pre-registration data
     * @param {string} data.companyName - Company name
     * @param {string} data.tin - Tax Identification Number
     * @param {number} data.capitalETB - Capital in ETB (minimum 50,000,000)
     * @param {string} data.address - Company address
     * @param {string} data.contactPerson - Contact person name
     * @param {string} data.phone - Phone number
     * @param {string} data.email - Email address
     * @returns {Promise<Object>} Registration response
     */
    async submitPreRegistration(data) {
        if (!data.companyName || !data.tin) {
            throw new Error('Company name and TIN are required');
        }
        
        if (data.capitalETB < 50000000) {
            throw new Error('Minimum capital requirement is 50,000,000 ETB');
        }
        
        return await this._request('POST', '/api/exporter/pre-registration', {
            exporterId: this.exporterId,
            ...data
        });
    }

    /**
     * Get exporter profile
     * @returns {Promise<Object>} Exporter profile
     */
    async getProfile() {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        return await this._request('GET', `/api/exporter/profile/${this.exporterId}`);
    }

    /**
     * Update exporter profile
     * @param {Object} updates - Profile updates
     * @returns {Promise<Object>} Update response
     */
    async updateProfile(updates) {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        return await this._request('PUT', `/api/exporter/profile/${this.exporterId}`, updates);
    }

    /**
     * Check license expiry status
     * @returns {Promise<Object>} License expiry information
     */
    async checkLicenseExpiry() {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        return await this._request('GET', `/api/exporter/license/expiry/${this.exporterId}`);
    }

    // ==================== Export Contracts ====================

    /**
     * Create export contract
     * @param {Object} data - Contract data
     * @param {string} data.coffeeType - Type of coffee (e.g., "Arabica Sidamo")
     * @param {number} data.quantity - Quantity in kg
     * @param {string} data.destinationCountry - Destination country
     * @param {number} data.estimatedValue - Estimated value in USD
     * @param {string} data.buyerCompanyName - Buyer company name
     * @param {string} data.paymentTerms - Payment terms (e.g., "LC at sight")
     * @param {string} data.deliveryTerms - Delivery terms (e.g., "FOB Djibouti")
     * @param {string} data.geographicalDesignation - Geographical designation
     * @returns {Promise<Object>} Contract creation response
     */
    async createExportContract(data) {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        if (!data.coffeeType || !data.quantity || !data.destinationCountry) {
            throw new Error('Coffee type, quantity, and destination country are required');
        }
        
        return await this._request('POST', '/api/exports', {
            exporterId: this.exporterId,
            ...data
        });
    }

    /**
     * Get export contract details
     * @param {string} exportId - Export ID
     * @returns {Promise<Object>} Export contract details
     */
    async getExportContract(exportId) {
        return await this._request('GET', `/api/exports/${exportId}`);
    }

    /**
     * Get all exports for this exporter
     * @returns {Promise<Array>} List of exports
     */
    async getMyExports() {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        return await this._request('GET', `/api/exports/exporter/${this.exporterId}`);
    }

    /**
     * Update export contract details
     * @param {string} exportId - Export ID
     * @param {Object} updates - Contract updates
     * @returns {Promise<Object>} Update response
     */
    async updateExportContract(exportId, updates) {
        return await this._request('PUT', `/api/exports/${exportId}/contract`, updates);
    }

    // ==================== Banking & Payments ====================

    /**
     * Update banking details for export
     * @param {string} exportId - Export ID
     * @param {Object} bankingDetails - Banking information
     * @param {string} bankingDetails.lcNumber - LC number
     * @param {string} bankingDetails.lcIssuingBank - LC issuing bank
     * @param {number} bankingDetails.lcAmount - LC amount
     * @param {string} bankingDetails.lcCurrency - LC currency
     * @returns {Promise<Object>} Update response
     */
    async updateBankingDetails(exportId, bankingDetails) {
        return await this._request('PUT', `/api/exports/${exportId}/banking`, bankingDetails);
    }

    // ==================== Shipping ====================

    /**
     * Update shipping details
     * @param {string} exportId - Export ID
     * @param {Object} shippingDetails - Shipping information
     * @param {string} shippingDetails.billOfLadingNumber - Bill of Lading number
     * @param {string} shippingDetails.containerNumber - Container number
     * @param {string} shippingDetails.vesselName - Vessel name
     * @param {string} shippingDetails.portOfLoading - Port of loading
     * @param {string} shippingDetails.portOfDischarge - Port of discharge
     * @param {string} shippingDetails.estimatedDepartureDate - Estimated departure date
     * @param {string} shippingDetails.estimatedArrivalDate - Estimated arrival date
     * @returns {Promise<Object>} Update response
     */
    async updateShippingDetails(exportId, shippingDetails) {
        return await this._request('PUT', `/api/exports/${exportId}/shipping`, shippingDetails);
    }

    /**
     * Track shipment status
     * @param {string} exportId - Export ID
     * @returns {Promise<Object>} Shipment tracking information
     */
    async trackShipment(exportId) {
        return await this._request('GET', `/api/exports/${exportId}/tracking`);
    }

    // ==================== Certificates ====================

    /**
     * Get quality certificate for export
     * @param {string} exportId - Export ID
     * @returns {Promise<Object>} Quality certificate
     */
    async getQualityCertificate(exportId) {
        return await this._request('GET', `/api/certificates/export/${exportId}`);
    }

    /**
     * Verify certificate authenticity
     * @param {string} certificateId - Certificate ID
     * @returns {Promise<Object>} Certificate verification result
     */
    async verifyCertificate(certificateId) {
        return await this._request('GET', `/api/certificates/verify/${certificateId}`);
    }

    // ==================== ESW (Electronic Single Window) ====================

    /**
     * Submit to ESW
     * @param {string} exportId - Export ID
     * @param {Array<string>} documents - List of document references
     * @returns {Promise<Object>} ESW submission response
     */
    async submitToESW(exportId, documents) {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        return await this._request('POST', '/api/esw/submit', {
            exportId,
            exporterId: this.exporterId,
            documents
        });
    }

    /**
     * Get ESW status
     * @param {string} eswId - ESW request ID
     * @returns {Promise<Object>} ESW status
     */
    async getESWStatus(eswId) {
        return await this._request('GET', `/api/esw/${eswId}`);
    }

    // ==================== Documents ====================

    /**
     * Upload document
     * @param {Object} documentData - Document information
     * @param {string} documentData.documentType - Type of document
     * @param {string} documentData.documentUrl - URL or reference to document
     * @param {string} documentData.entityId - Related entity ID (export ID, etc.)
     * @param {string} documentData.entityType - Entity type (export, exporter, etc.)
     * @returns {Promise<Object>} Upload response
     */
    async uploadDocument(documentData) {
        return await this._request('POST', '/api/documents/upload', documentData);
    }

    /**
     * Get documents for export
     * @param {string} exportId - Export ID
     * @returns {Promise<Array>} List of documents
     */
    async getExportDocuments(exportId) {
        return await this._request('GET', `/api/documents/export/${exportId}`);
    }

    // ==================== Audit & History ====================

    /**
     * Get transaction history for export
     * @param {string} exportId - Export ID
     * @returns {Promise<Array>} Transaction history
     */
    async getExportHistory(exportId) {
        return await this._request('GET', `/api/exports/${exportId}/history`);
    }

    /**
     * Get audit trail
     * @param {string} assetId - Asset ID (export ID, exporter ID, etc.)
     * @returns {Promise<Array>} Audit trail
     */
    async getAuditTrail(assetId) {
        return await this._request('GET', `/api/audit/${assetId}`);
    }

    // ==================== Statistics ====================

    /**
     * Get exporter statistics
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics() {
        if (!this.exporterId) {
            throw new Error('Exporter ID not set. Please login first.');
        }
        
        return await this._request('GET', `/api/exporter/statistics/${this.exporterId}`);
    }

    // ==================== Health Check ====================

    /**
     * Check if the gateway is reachable
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        return await this._request('GET', '/health');
    }
}

module.exports = CoffeeExportSDK;
