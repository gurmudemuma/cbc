import { Router } from 'express';
import { PreRegistrationController } from '../controllers/preregistration.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware as authenticate } from '@shared/middleware/auth.middleware';

const router = Router();
const controller = new PreRegistrationController();
const dashboardController = new DashboardController();

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

// Resubmit exporter profile after rejection
router.post('/exporters/:exporterId/resubmit', controller.resubmitProfile);

// Validate exporter qualification
router.get('/exporters/:exporterId/validate', controller.validateExporter);

// ============================================================================
// LABORATORY CERTIFICATION
// ============================================================================

// Get pending laboratory certifications
router.get('/laboratories/pending', controller.getPendingLaboratories);

// Get laboratories for a specific exporter
router.get('/exporters/:exporterId/laboratories', controller.getExporterLaboratories);

// Certify laboratory
router.post('/laboratories/:laboratoryId/certify', controller.certifyLaboratory);

// Reject laboratory certification
router.post('/laboratories/:laboratoryId/reject', controller.rejectLaboratory);

// Resubmit laboratory after rejection
router.post('/laboratories/:laboratoryId/resubmit', controller.resubmitLaboratory);

// ============================================================================
// TASTER VERIFICATION
// ============================================================================

// Get pending taster verifications
router.get('/tasters/pending', controller.getPendingTasters);

// Get tasters for a specific exporter
router.get('/exporters/:exporterId/tasters', controller.getExporterTasters);

// Verify taster credentials
router.post('/tasters/:tasterId/verify', controller.verifyTaster);

// Reject taster verification
router.post('/tasters/:tasterId/reject', controller.rejectTaster);

// ============================================================================
// COMPETENCE CERTIFICATES
// ============================================================================

// Get pending competence certificate applications
router.get('/competence/pending', controller.getPendingCompetenceCertificates);

// Issue competence certificate
router.post('/competence/:exporterId/issue', controller.issueCompetenceCertificate);

// Reject competence certificate application
router.post('/competence/:exporterId/reject', controller.rejectCompetenceCertificate);

// ============================================================================
// EXPORT LICENSES
// ============================================================================

// Receive license application from Exporter Portal
router.post('/license-applications', controller.receiveLicenseApplication);

// Get pending export license applications
router.get('/licenses/pending', controller.getPendingLicenses);

// Issue export license
router.post('/licenses/:exporterId/issue', controller.issueExportLicense);

// Reject export license application
router.post('/licenses/:exporterId/reject', controller.rejectExportLicense);

// ============================================================================
// DASHBOARD (360-DEGREE VIEW)
// ============================================================================

// Get global dashboard statistics (for officials)
router.get('/dashboard/stats', dashboardController.getGlobalStats);

// Get complete exporter dashboard by ID
router.get('/dashboard/exporter/:exporterId', dashboardController.getExporterDashboard);

// Get complete exporter dashboard by TIN
router.get('/dashboard/exporter/tin/:tin', dashboardController.getExporterDashboardByTin);


export default router;
