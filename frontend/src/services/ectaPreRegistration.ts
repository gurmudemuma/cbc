/**
 * ECTA Pre-Registration API Service
 * Handles exporter qualification and ECTA approval workflows
 */

import apiClient from './api';

interface ProfileData {
  [key: string]: any;
}

interface LaboratoryData {
  [key: string]: any;
}

interface CertificationData {
  [key: string]: any;
}

interface TasterData {
  [key: string]: any;
}

interface LicenseData {
  eicRegistrationNumber?: string;
  coffeeTypes?: string[];
  origins?: string[];
  licenseType?: string;
  annualExportVolume?: number;
  exportDestinations?: string[];
  businessPlan?: string;
  marketingStrategy?: string;
  qualityAssuranceProcess?: string;
  [key: string]: any;
}

const ectaPreRegistrationService = {
  // ============================================================================
  // EXPORTER PROFILE
  // ============================================================================

  /**
   * Register exporter profile (Exporter Portal)
   */
  registerProfile: async (profileData: ProfileData) => {
    const response = await apiClient.post('/api/exporter/profile/register', profileData);
    return response.data;
  },

  /**
   * Get own profile (Exporter Portal)
   */
  getMyProfile: async () => {
    const response = await apiClient.get('/api/exporter/profile');
    return response.data;
  },

  /**
   * Get all exporters (ECTA)
   */
  getAllExporters: async () => {
    const response = await apiClient.get('/api/preregistration/exporters');
    return response.data;
  },

  /**
   * Get pending exporter applications (ECTA)
   */
  getPendingApplications: async () => {
    const response = await apiClient.get('/api/preregistration/exporters/pending');
    return response.data;
  },

  /**
   * Approve exporter profile (ECTA)
   */
  approveExporter: async (exporterId: string) => {
    const response = await apiClient.post(`/api/preregistration/exporters/${exporterId}/approve`);
    return response.data;
  },

  /**
   * Reject exporter profile (ECTA)
   */
  rejectExporter: async (exporterId: string, reason: string) => {
    const response = await apiClient.post(`/api/preregistration/exporters/${exporterId}/reject`, { reason });
    return response.data;
  },

  /**
   * Validate exporter qualification (ECTA)
   */
  validateExporter: async (exporterId: string) => {
    const response = await apiClient.get(`/api/preregistration/exporters/${exporterId}/validate`);
    return response.data;
  },

  // ============================================================================
  // LABORATORY CERTIFICATION
  // ============================================================================

  /**
   * Register laboratory (Exporter Portal)
   */
  registerLaboratory: async (laboratoryData: LaboratoryData) => {
    const response = await apiClient.post('/api/exporter/laboratory/register', laboratoryData);
    return response.data;
  },

  /**
   * Get pending laboratory certifications (ECTA)
   */
  getPendingLaboratories: async () => {
    const response = await apiClient.get('/api/preregistration/laboratories/pending');
    return response.data;
  },

  /**
   * Certify laboratory (ECTA)
   */
  certifyLaboratory: async (laboratoryId: string, certificationData: CertificationData) => {
    const response = await apiClient.post(`/api/preregistration/laboratories/${laboratoryId}/certify`, certificationData);
    return response.data;
  },

  // ============================================================================
  // TASTER REGISTRATION
  // ============================================================================

  /**
   * Register coffee taster (Exporter Portal)
   */
  registerTaster: async (tasterData: TasterData) => {
    const response = await apiClient.post('/api/exporter/taster/register', tasterData);
    return response.data;
  },

  // ============================================================================
  // COMPETENCE CERTIFICATE
  // ============================================================================

  /**
   * Apply for competence certificate (Exporter Portal)
   */
  applyForCompetenceCertificate: async () => {
    const response = await apiClient.post('/api/exporter/competence/apply');
    return response.data;
  },

  /**
   * Get pending competence certificate applications (ECTA)
   */
  getPendingCompetenceCertificates: async () => {
    const response = await apiClient.get('/api/preregistration/competence/pending');
    return response.data;
  },

  /**
   * Issue competence certificate (ECTA)
   */
  issueCompetenceCertificate: async (exporterId: string, certificateData: CertificationData) => {
    const response = await apiClient.post(`/api/preregistration/competence/${exporterId}/issue`, certificateData);
    return response.data;
  },

  // ============================================================================
  // EXPORT LICENSE
  // ============================================================================

  /**
   * Apply for export license (Exporter Portal)
   */
  applyForExportLicense: async (licenseData: LicenseData) => {
    const response = await apiClient.post('/api/exporter/license/apply', {
      eicRegistrationNumber: licenseData.eicRegistrationNumber || 'EIC-' + Date.now(),
      requestedCoffeeTypes: licenseData.coffeeTypes || ['ARABICA', 'ROBUSTA'],
      requestedOrigins: licenseData.origins || ['SIDAMA', 'YIRGACHEFFE', 'HARRAR'],
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
    const response = await apiClient.get('/api/preregistration/licenses/pending');
    return response.data;
  },

  /**
   * Issue export license (ECTA)
   */
  issueExportLicense: async (exporterId: string, licenseData: LicenseData) => {
    const response = await apiClient.post(`/api/preregistration/licenses/${exporterId}/issue`, licenseData);
    return response.data;
  },

  // ============================================================================
  // QUALIFICATION STATUS
  // ============================================================================

  /**
   * Check qualification status (Exporter Portal)
   */
  checkQualificationStatus: async () => {
    const response = await apiClient.get('/api/exporter/qualification-status');
    return response.data;
  },
};

export default ectaPreRegistrationService;
