const fabricService = require('./index'); // Use service loader for consistent Fabric implementation

/**
 * Record document issuance on blockchain
 */
async function recordDocumentIssuance(documentData) {
  try {
    const payload = {
      documentId: documentData.documentId,
      exporterId: documentData.exporterId,
      issuerMemberCode: documentData.issuerMemberCode,
      documentType: documentData.documentType,
      documentNumber: documentData.documentNumber,
      documentHash: documentData.documentHash,
      issuerSignature: documentData.issuerSignature,
      issuedAt: documentData.issuedAt,
      expiryDate: documentData.expiryDate || null
    };

    const result = await fabricService.submitTransaction(
      'admin', // Use admin identity for blockchain operations
      process.env.CHAINCODE_NAME || 'ecta',
      'RecordDocumentIssuance',
      JSON.stringify(payload)
    );

    return {
      success: true,
      transactionId: result.transactionId || 'blockchain-tx-' + Date.now(),
      message: 'Document issuance recorded on blockchain'
    };
  } catch (error) {
    console.error('[Blockchain Document] Record issuance error:', error);
    // Don't throw - blockchain failure shouldn't block document issuance
    return {
      success: false,
      error: error.message,
      message: 'Failed to record on blockchain (document still issued)'
    };
  }
}

/**
 * Verify document authenticity against blockchain
 */
async function verifyDocumentAuthenticity(documentId, documentHash) {
  try {
    const result = await fabricService.evaluateTransaction(
      'admin',
      process.env.CHAINCODE_NAME || 'ecta',
      'VerifyDocumentAuthenticity',
      documentId,
      documentHash
    );

    const verification = JSON.parse(result);
    
    return {
      success: true,
      isValid: verification.isValid,
      issuer: verification.issuer,
      issuedAt: verification.issuedAt,
      blockchainHash: verification.blockchainHash,
      hashMatch: verification.hashMatch
    };
  } catch (error) {
    console.error('[Blockchain Document] Verify authenticity error:', error);
    return {
      success: false,
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Record document authentication on blockchain
 */
async function recordDocumentAuthentication(authenticationData) {
  try {
    const payload = {
      authenticationId: authenticationData.authenticationId,
      submissionId: authenticationData.submissionId,
      documentId: authenticationData.documentId,
      authenticatorMemberCode: authenticationData.authenticatorMemberCode,
      authenticationStatus: authenticationData.authenticationStatus,
      authenticatedAt: authenticationData.authenticatedAt
    };

    const result = await fabricService.submitTransaction(
      'admin',
      process.env.CHAINCODE_NAME || 'ecta',
      'RecordDocumentAuthentication',
      JSON.stringify(payload)
    );

    return {
      success: true,
      transactionId: result.transactionId || 'blockchain-tx-' + Date.now(),
      message: 'Document authentication recorded on blockchain'
    };
  } catch (error) {
    console.error('[Blockchain Document] Record authentication error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Record document revocation on blockchain
 */
async function recordDocumentRevocation(documentId, revocationReason, revokedBy) {
  try {
    const payload = {
      documentId,
      revocationReason,
      revokedBy,
      revokedAt: new Date().toISOString()
    };

    const result = await fabricService.submitTransaction(
      'admin',
      process.env.CHAINCODE_NAME || 'ecta',
      'RecordDocumentRevocation',
      JSON.stringify(payload)
    );

    return {
      success: true,
      transactionId: result.transactionId || 'blockchain-tx-' + Date.now(),
      message: 'Document revocation recorded on blockchain'
    };
  } catch (error) {
    console.error('[Blockchain Document] Record revocation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  recordDocumentIssuance,
  verifyDocumentAuthenticity,
  recordDocumentAuthentication,
  recordDocumentRevocation
};
