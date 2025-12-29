/**
 * ECTA Pre-Registration API Service
 * Handles exporter qualification and ECTA approval workflows
 */

import apiClient from './api';

const ectaPreRegistrationService = {
  // ============================================================================
  // EXPORTER PROFILE
  // ============================================================================

  /**
   * Register exporter profile (Exporter Portal)
   */
  registerProfile: async (profileData) => {
    const response = await apiClient.post('/exporter/profile/register', profileData);
    return response.data;
  },

  /**
   * Get own profile (Exporter Portal)
   */
  getMyProfile: async () => {
    const response = await apiClient.get('/exporter/profile');
    return response.data;
  },

  /**
   * Get all exporters (ECTA)
   */
  getAllExporters: async () => {
    const response = await apiClient.get('/preregistration/exporters');
    return response.data;
  },

  /**
   * Get pending exporter applications (ECTA)
   */
  getPendingApplications: async () => {
    const response = await apiClient.get('/preregistration/exporters/pending');
    return response.data;
  },

  /**
   * Approve exporter profile (ECTA)
   */
  approveExporter: async (exporterId) => {
    const response = await apiClient.post(`/preregistration/exporters/${exporterId}/approve`);
    return response.data;
  },

  /**
   * Reject exporter profile (ECTA)
   */
  rejectExporter: async (exporterId, reason) => {
    const response = await apiClient.post(`/preregistration/exporters/${exporterId}/reject`, { reason });
    return response.data;
  },

  /**
<<<<<<< HEAD
   * Resubmit exporter profile after rejection (Exporter Portal)
   */
  resubmitProfile: async (exporterId) => {
    const response = await apiClient.post(`/preregistration/exporters/${exporterId}/resubmit`);
    return response.data;
  },

  /**
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
   * Validate exporter qualification (ECTA)
   */
  validateExporter: async (exporterId) => {
    const response = await apiClient.get(`/preregistration/exporters/${exporterId}/validate`);
    return response.data;
  },

  // ============================================================================
  // LABORATORY CERTIFICATION
  // ============================================================================

  /**
   * Register laboratory (Exporter Portal)
   */
  registerLaboratory: async (laboratoryData) => {
    const response = await apiClient.post('/exporter/laboratory/register', laboratoryData);
    return response.data;
  },

  /**
   * Get pending laboratory certifications (ECTA)
   */
  getPendingLaboratories: async () => {
    const response = await apiClient.get('/preregistration/laboratories/pending');
    return response.data;
  },

  /**
   * Certify laboratory (ECTA)
   */
  certifyLaboratory: async (laboratoryId, certificationData) => {
<<<<<<< HEAD
    // Map frontend field names to backend expected names
    const payload = {
      certificationNumber: certificationData.certificateNumber, // Map certificateNumber → certificationNumber
      inspectionPassed: true, // Always true when certifying
      validityYears: certificationData.validityYears || 1,
      issueDate: certificationData.issueDate,
      expiryDate: certificationData.expiryDate,
    };
    const response = await apiClient.post(`/preregistration/laboratories/${laboratoryId}/certify`, payload);
    return response.data;
  },

  /**
   * Reject laboratory certification (ECTA)
   */
  rejectLaboratory: async (laboratoryId, reason) => {
    const response = await apiClient.post(`/preregistration/laboratories/${laboratoryId}/reject`, { reason });
    return response.data;
  },

  // ============================================================================
  // TASTER VERIFICATION
  // ============================================================================

  /**
   * Get pending taster verifications (ECTA)
   */
  getPendingTasters: async () => {
    const response = await apiClient.get('/preregistration/tasters/pending');
    return response.data;
  },

  /**
   * Verify taster (ECTA)
   */
  verifyTaster: async (tasterId) => {
    const response = await apiClient.post(`/preregistration/tasters/${tasterId}/verify`);
    return response.data;
  },

  /**
   * Reject taster verification (ECTA)
   */
  rejectTaster: async (tasterId, reason) => {
    const response = await apiClient.post(`/preregistration/tasters/${tasterId}/reject`, { reason });
    return response.data;
  },

  /**
   * Resubmit laboratory after rejection (Exporter Portal)
   */
  resubmitLaboratory: async (laboratoryId) => {
    const response = await apiClient.post(`/preregistration/laboratories/${laboratoryId}/resubmit`);
=======
    const response = await apiClient.post(`/preregistration/laboratories/${laboratoryId}/certify`, certificationData);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // TASTER REGISTRATION
  // ============================================================================

  /**
   * Register coffee taster (Exporter Portal)
   */
  registerTaster: async (tasterData) => {
    const response = await apiClient.post('/exporter/taster/register', tasterData);
    return response.data;
  },

  // ============================================================================
  // COMPETENCE CERTIFICATE
  // ============================================================================

  /**
   * Apply for competence certificate (Exporter Portal)
   */
  applyForCompetenceCertificate: async () => {
    const response = await apiClient.post('/exporter/competence/apply');
    return response.data;
  },

  /**
   * Get pending competence certificate applications (ECTA)
   */
  getPendingCompetenceCertificates: async () => {
    const response = await apiClient.get('/preregistration/competence/pending');
    return response.data;
  },

  /**
   * Issue competence certificate (ECTA)
   */
  issueCompetenceCertificate: async (exporterId, certificateData) => {
<<<<<<< HEAD
    // Map frontend field names to backend expected names
    const payload = {
      certificateNumber: certificateData.certificateNumber,
      laboratoryId: certificateData.laboratoryId,
      tasterId: certificateData.tasterId,
      facilityInspectionPassed: true, // Always true when issuing
      inspectionReport: certificateData.inspectionReport || '',
      validityYears: certificateData.validityYears || 1,
    };
    const response = await apiClient.post(`/preregistration/competence/${exporterId}/issue`, payload);
    return response.data;
  },

  /**
   * Reject competence certificate (ECTA)
   */
  rejectCompetenceCertificate: async (exporterId, reason) => {
    const response = await apiClient.post(`/preregistration/competence/${exporterId}/reject`, { reason });
=======
    const response = await apiClient.post(`/preregistration/competence/${exporterId}/issue`, certificateData);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // EXPORT LICENSE
  // ============================================================================

  /**
   * Apply for export license (Exporter Portal)
   */
  applyForExportLicense: async (licenseData) => {
    const response = await apiClient.post('/exporter/license/apply', {
      eicRegistrationNumber: licenseData.eicRegistrationNumber || 'EIC-' + Date.now(),
<<<<<<< HEAD
      requestedCoffeeTypes: licenseData.requestedCoffeeTypes || ['ARABICA', 'ROBUSTA'],
      requestedOrigins: licenseData.requestedOrigins || ['SIDAMA', 'YIRGACHEFFE', 'HARRAR'],
=======
      requestedCoffeeTypes: licenseData.coffeeTypes || ['ARABICA', 'ROBUSTA'],
      requestedOrigins: licenseData.origins || ['SIDAMA', 'YIRGACHEFFE', 'HARRAR'],
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      licenseType: licenseData.licenseType,
      annualExportVolume: licenseData.annualExportVolume,
      exportDestinations: licenseData.exportDestinations,
      businessPlan: licenseData.businessPlan,
      marketingStrategy: licenseData.marketingStrategy,
      qualityAssuranceProcess: licenseData.qualityAssuranceProcess
    });
    return response.data;
  },

  /**
   * Get pending export license applications (ECTA)
   */
  getPendingLicenses: async () => {
    const response = await apiClient.get('/preregistration/licenses/pending');
    return response.data;
  },

  /**
   * Issue export license (ECTA)
   */
  issueExportLicense: async (exporterId, licenseData) => {
<<<<<<< HEAD
    // Map frontend field names to backend expected names
    const payload = {
      licenseNumber: licenseData.certificateNumber, // Frontend uses certificateNumber for all
      competenceCertificateId: licenseData.competenceCertificateId,
      eicRegistrationNumber: licenseData.eicRegistrationNumber,
      authorizedCoffeeTypes: licenseData.authorizedCoffeeTypes || ['ARABICA'],
      authorizedOrigins: licenseData.authorizedOrigins || [],
      annualQuota: licenseData.annualQuota || 0,
      validityYears: licenseData.validityYears || 1,
    };
    const response = await apiClient.post(`/preregistration/licenses/${exporterId}/issue`, payload);
    return response.data;
  },

  /**
   * Reject export license (ECTA)
   */
  rejectExportLicense: async (exporterId, reason) => {
    const response = await apiClient.post(`/preregistration/licenses/${exporterId}/reject`, { reason });
=======
    const response = await apiClient.post(`/preregistration/licenses/${exporterId}/issue`, licenseData);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // QUALIFICATION STATUS
  // ============================================================================

  /**
   * Check qualification status (Exporter Portal)
   */
  checkQualificationStatus: async () => {
    const response = await apiClient.get('/exporter/qualification-status');
    return response.data;
  },
<<<<<<< HEAD

  // ============================================================================
  // 360-DEGREE DASHBOARD
  // ============================================================================

  /**
   * Get complete exporter dashboard by ID (ECTA)
   */
  getExporterDashboard: async (exporterId) => {
    const response = await apiClient.get(`/preregistration/dashboard/exporter/${exporterId}`);
    return response.data;
  },

  /**
   * Get complete exporter dashboard by TIN (ECTA)
   */
  getExporterDashboardByTin: async (tin) => {
    const response = await apiClient.get(`/preregistration/dashboard/exporter/tin/${tin}`);
    return response.data;
  },

  /**
   * Get global dashboard statistics (ECTA Official)
   */
  getGlobalStats: async () => {
    const response = await apiClient.get('/preregistration/dashboard/stats');
    return response.data;
  },
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
};

export default ectaPreRegistrationService;
