import axios from 'axios';

// Certificate downloads go through the gateway, not the ECTA service
// Use relative paths so nginx proxy routes them correctly
const ECTA_API_URL = `/api/preregistration`;

/**
 * ECTA Service
 * Handles API calls for ECTA preregistration, certificates, and licenses
 */

/**
 * Download competence certificate PDF
 * @param {string} certificateId - The certificate ID
 * @returns {Promise<{success: boolean}>}
 */
export const downloadCompetenceCertificate = async (certificateId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${ECTA_API_URL}/competence/${certificateId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file download
      }
    );

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `competence-certificate-${certificateId}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Failed to download competence certificate:', error);
    throw error;
  }
};

/**
 * Download export license PDF
 * @param {string} licenseId - The license ID
 * @returns {Promise<{success: boolean}>}
 */
export const downloadExportLicense = async (licenseId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${ECTA_API_URL}/licenses/${licenseId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      }
    );

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `export-license-${licenseId}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Failed to download export license:', error);
    throw error;
  }
};

/**
 * Get competence certificate metadata
 * @param {string} certificateId - The certificate ID
 * @returns {Promise<Object>} Certificate metadata
 */
export const getCompetenceCertificateMetadata = async (certificateId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${ECTA_API_URL}/competence/${certificateId}/metadata`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get certificate metadata:', error);
    throw error;
  }
};

/**
 * Get export license metadata
 * @param {string} licenseId - The license ID
 * @returns {Promise<Object>} License metadata
 */
export const getExportLicenseMetadata = async (licenseId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${ECTA_API_URL}/licenses/${licenseId}/metadata`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get license metadata:', error);
    throw error;
  }
};

/**
 * Get all exporters
 * @returns {Promise<Object>} List of exporters
 */
export const getAllExporters = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${ECTA_API_URL}/exporters`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get exporters:', error);
    throw error;
  }
};

/**
 * Get pending competence certificates
 * @returns {Promise<Object>} List of pending certificates
 */
export const getPendingCompetenceCertificates = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${ECTA_API_URL}/competence/pending`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get pending certificates:', error);
    throw error;
  }
};

/**
 * Get pending export licenses
 * @returns {Promise<Object>} List of pending licenses
 */
export const getPendingExportLicenses = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${ECTA_API_URL}/licenses/pending`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get pending licenses:', error);
    throw error;
  }
};

/**
 * Issue competence certificate
 * @param {string} exporterId - The exporter ID
 * @param {Object} data - Certificate data
 * @returns {Promise<Object>} Issued certificate
 */
export const issueCompetenceCertificate = async (exporterId, data) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${ECTA_API_URL}/competence/${exporterId}/issue`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to issue certificate:', error);
    throw error;
  }
};

/**
 * Issue export license
 * @param {string} exporterId - The exporter ID
 * @param {Object} data - License data
 * @returns {Promise<Object>} Issued license
 */
export const issueExportLicense = async (exporterId, data) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${ECTA_API_URL}/licenses/${exporterId}/issue`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to issue license:', error);
    throw error;
  }
};

/**
 * Get pending renewal requests
 * @param {string} type - Optional certificate type filter
 * @returns {Promise<Object>} List of pending renewals
 */
export const getPendingRenewals = async (type = null) => {
  try {
    const token = localStorage.getItem('token');
    const url = type 
      ? `${API_ENDPOINTS.ecta}/api/ecta/certificate/renewal/pending?type=${type}`
      : `${API_ENDPOINTS.ecta}/api/ecta/certificate/renewal/pending`;
    
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get pending renewals:', error);
    throw error;
  }
};

/**
 * Get renewal history
 * @param {Object} filters - Optional filters (type, status, limit)
 * @returns {Promise<Object>} Renewal history
 */
export const getRenewalHistory = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters).toString();
    const url = `${API_ENDPOINTS.ecta}/api/ecta/certificate/renewal/history${params ? `?${params}` : ''}`;
    
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get renewal history:', error);
    throw error;
  }
};

/**
 * Get expiring certificates
 * @param {number} daysThreshold - Days until expiry threshold
 * @returns {Promise<Object>} List of expiring certificates
 */
export const getExpiringCertificates = async (daysThreshold = 90) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_ENDPOINTS.ecta}/api/ecta/certificate/renewal/expiring?days=${daysThreshold}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get expiring certificates:', error);
    throw error;
  }
};

/**
 * Approve renewal request
 * @param {string} requestId - The renewal request ID
 * @param {Object} data - Approval data (newExpiryDate, approvalNotes)
 * @returns {Promise<Object>} Approval result
 */
export const approveRenewal = async (requestId, data) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_ENDPOINTS.ecta}/api/ecta/certificate/renewal/${requestId}/approve`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to approve renewal:', error);
    throw error;
  }
};

/**
 * Reject renewal request
 * @param {string} requestId - The renewal request ID
 * @param {Object} data - Rejection data (rejectionReason)
 * @returns {Promise<Object>} Rejection result
 */
export const rejectRenewal = async (requestId, data) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_ENDPOINTS.ecta}/api/ecta/certificate/renewal/${requestId}/reject`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to reject renewal:', error);
    throw error;
  }
};

export default {
  downloadCompetenceCertificate,
  downloadExportLicense,
  getCompetenceCertificateMetadata,
  getExportLicenseMetadata,
  getAllExporters,
  getPendingCompetenceCertificates,
  getPendingExportLicenses,
  issueCompetenceCertificate,
  issueExportLicense,
  getPendingRenewals,
  getRenewalHistory,
  getExpiringCertificates,
  approveRenewal,
  rejectRenewal
};
