import { Router } from 'express';
import { PreRegistrationController } from '../controllers/preregistration.controller';
import { authMiddleware as authenticate } from '../../../shared/middleware/auth.middleware';

const router = Router();
const controller = new PreRegistrationController();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EXPORTER PROFILE MANAGEMENT
// ============================================================================

// Get all exporters
router.get('/exporters', controller.getAllExporters);

// Get pending exporter applications
router.get('/exporters/pending', controller.getPendingApplications);

// Approve exporter profile
router.post('/exporters/:exporterId/approve', controller.approveExporter);

// Reject exporter profile
router.post('/exporters/:exporterId/reject', controller.rejectExporter);

// Validate exporter qualification
router.get('/exporters/:exporterId/validate', controller.validateExporter);

// ============================================================================
// LABORATORY CERTIFICATION
// ============================================================================

// Get pending laboratory certifications
router.get('/laboratories/pending', controller.getPendingLaboratories);

// Certify laboratory
router.post('/laboratories/:laboratoryId/certify', controller.certifyLaboratory);

// ============================================================================
// COMPETENCE CERTIFICATES
// ============================================================================

// Get pending competence certificate applications
router.get('/competence/pending', controller.getPendingCompetenceCertificates);

// Issue competence certificate
router.post('/competence/:exporterId/issue', controller.issueCompetenceCertificate);

// ============================================================================
// EXPORT LICENSES
// ============================================================================

// Receive license application from Exporter Portal
router.post('/license-applications', controller.receiveLicenseApplication);

// Get pending export license applications
router.get('/licenses/pending', controller.getPendingLicenses);

// Issue export license
router.post('/licenses/:exporterId/issue', controller.issueExportLicense);

export default router;
