========================================
ECTA COFFEE EXPORT SDK - NODE.JS
========================================

Official SDK for Ethiopian Coffee Export Blockchain System

This SDK allows exporters to integrate the ECTA Coffee Export
Blockchain into their own applications.

========================================
INSTALLATION
========================================

1. Copy the SDK to your project:
   cp -r sdk/nodejs /path/to/your/project/ecta-sdk

2. Install dependencies:
   cd ecta-sdk
   npm install

3. Import in your application:
   const CoffeeExportSDK = require('./ecta-sdk');

========================================
QUICK START
========================================

const CoffeeExportSDK = require('./ecta-sdk');

// Initialize SDK
const sdk = new CoffeeExportSDK({
    gatewayUrl: 'http://localhost:3000'
});

// Login
await sdk.login('exporter1', 'password123');

// Get profile
const profile = await sdk.getProfile();
console.log('My Profile:', profile);

// Create export contract
const exportContract = await sdk.createExportContract({
    coffeeType: 'Arabica Sidamo',
    quantity: 1000,
    destinationCountry: 'Germany',
    estimatedValue: 50000,
    buyerCompanyName: 'German Coffee Importers GmbH',
    paymentTerms: 'LC at sight',
    deliveryTerms: 'FOB Djibouti',
    geographicalDesignation: 'Sidamo'
});

console.log('Export Created:', exportContract);

========================================
CONFIGURATION
========================================

const sdk = new CoffeeExportSDK({
    gatewayUrl: 'http://localhost:3000',  // Backend gateway URL
    apiKey: 'your-api-key',                // Optional API key
    exporterId: 'exporter1',               // Set after login
    token: 'jwt-token'                     // Set after login
});

========================================
AUTHENTICATION
========================================

// Login
const loginResponse = await sdk.login('username', 'password');
// SDK automatically stores token and exporterId

// Logout
sdk.logout();

// Manual token setting (if you have a token)
sdk.setToken('your-jwt-token');
sdk.setExporterId('exporter1');

========================================
EXPORTER FUNCTIONS
========================================

// Submit Pre-Registration
await sdk.submitPreRegistration({
    companyName: 'My Coffee Export Company',
    tin: 'TIN123456789',
    capitalETB: 50000000,
    address: 'Addis Ababa, Ethiopia',
    contactPerson: 'John Doe',
    phone: '+251911234567',
    email: 'contact@mycoffee.com'
});

// Get Profile
const profile = await sdk.getProfile();

// Update Profile
await sdk.updateProfile({
    phone: '+251911234568',
    email: 'newemail@mycoffee.com'
});

// Check License Expiry
const licenseStatus = await sdk.checkLicenseExpiry();
console.log('License expires in:', licenseStatus.daysUntilExpiry, 'days');

========================================
EXPORT CONTRACT FUNCTIONS
========================================

// Create Export Contract
const exportData = await sdk.createExportContract({
    coffeeType: 'Arabica Yirgacheffe',
    quantity: 2000,
    destinationCountry: 'USA',
    estimatedValue: 100000,
    buyerCompanyName: 'US Coffee Importers Inc',
    paymentTerms: 'LC at sight',
    deliveryTerms: 'FOB Djibouti',
    geographicalDesignation: 'Yirgacheffe'
});

// Get Export Details
const exportDetails = await sdk.getExportContract(exportData.exportId);

// Get All My Exports
const myExports = await sdk.getMyExports();

// Update Contract
await sdk.updateExportContract(exportId, {
    buyerCompanyName: 'Updated Buyer Name',
    paymentTerms: 'TT 30 days'
});

========================================
BANKING FUNCTIONS
========================================

// Update Banking Details
await sdk.updateBankingDetails(exportId, {
    lcNumber: 'LC-2026-001',
    lcIssuingBank: 'Deutsche Bank',
    lcAmount: 100000,
    lcCurrency: 'USD'
});

========================================
SHIPPING FUNCTIONS
========================================

// Update Shipping Details
await sdk.updateShippingDetails(exportId, {
    billOfLadingNumber: 'BL-2026-001',
    containerNumber: 'CONT-2026-12345',
    vesselName: 'MV Coffee Express',
    portOfLoading: 'Djibouti',
    portOfDischarge: 'Hamburg',
    estimatedDepartureDate: '2026-03-01',
    estimatedArrivalDate: '2026-03-15'
});

// Track Shipment
const tracking = await sdk.trackShipment(exportId);
console.log('Shipment Status:', tracking.status);

========================================
CERTIFICATE FUNCTIONS
========================================

// Get Quality Certificate
const certificate = await sdk.getQualityCertificate(exportId);
console.log('Grade:', certificate.grade);
console.log('Cup Score:', certificate.cupScore);

// Verify Certificate
const verification = await sdk.verifyCertificate(certificateId);
console.log('Certificate Valid:', verification.valid);

========================================
ESW FUNCTIONS
========================================

// Submit to ESW
const eswResponse = await sdk.submitToESW(exportId, [
    'export_permit_application.pdf',
    'commercial_invoice.pdf',
    'packing_list.pdf',
    'quality_certificate.pdf'
]);

// Get ESW Status
const eswStatus = await sdk.getESWStatus(eswResponse.requestId);
console.log('ESW Status:', eswStatus.status);
console.log('Approvals:', eswStatus.agencyApprovals);

========================================
DOCUMENT FUNCTIONS
========================================

// Upload Document
await sdk.uploadDocument({
    documentType: 'commercial_invoice',
    documentUrl: 'https://storage.example.com/invoice.pdf',
    entityId: exportId,
    entityType: 'export'
});

// Get Export Documents
const documents = await sdk.getExportDocuments(exportId);

========================================
AUDIT & HISTORY
========================================

// Get Export History
const history = await sdk.getExportHistory(exportId);
console.log('Transaction History:', history);

// Get Audit Trail
const auditTrail = await sdk.getAuditTrail(exportId);
console.log('Audit Trail:', auditTrail);

========================================
STATISTICS
========================================

// Get Exporter Statistics
const stats = await sdk.getStatistics();
console.log('Total Exports:', stats.totalExports);
console.log('Active Exports:', stats.activeExports);
console.log('Total Value:', stats.totalValue);

========================================
ERROR HANDLING
========================================

try {
    const result = await sdk.createExportContract(data);
    console.log('Success:', result);
} catch (error) {
    console.error('Error:', error.message);
    // Handle error appropriately
}

========================================
COMPLETE EXAMPLE
========================================

See: sdk/nodejs/examples/complete-export-flow.js

This example shows a complete export flow from
registration to shipment tracking.

========================================
API REFERENCE
========================================

All SDK methods return Promises and can be used with
async/await or .then()/.catch().

Authentication Methods:
- login(username, password)
- logout()
- setToken(token)
- setExporterId(exporterId)

Exporter Methods:
- submitPreRegistration(data)
- getProfile()
- updateProfile(updates)
- checkLicenseExpiry()

Export Contract Methods:
- createExportContract(data)
- getExportContract(exportId)
- getMyExports()
- updateExportContract(exportId, updates)

Banking Methods:
- updateBankingDetails(exportId, bankingDetails)

Shipping Methods:
- updateShippingDetails(exportId, shippingDetails)
- trackShipment(exportId)

Certificate Methods:
- getQualityCertificate(exportId)
- verifyCertificate(certificateId)

ESW Methods:
- submitToESW(exportId, documents)
- getESWStatus(eswId)

Document Methods:
- uploadDocument(documentData)
- getExportDocuments(exportId)

Audit Methods:
- getExportHistory(exportId)
- getAuditTrail(assetId)

Statistics Methods:
- getStatistics()

Utility Methods:
- healthCheck()

========================================
SUPPORT
========================================

For issues or questions:
1. Check the examples in sdk/nodejs/examples/
2. Review the API documentation
3. Contact ECTA support

========================================
