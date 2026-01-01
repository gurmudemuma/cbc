import { Router } from 'express';
import { PreRegistrationController } from '../controllers/preregistration.controller';
<<<<<<< HEAD
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware as authenticate } from '@shared/middleware/auth.middleware';

const router = Router();
const controller = new PreRegistrationController();
const dashboardController = new DashboardController();
=======
import { authMiddleware as authenticate } from '../../../shared/middleware/auth.middleware';

const router = Router();
const controller = new PreRegistrationController();
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

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

<<<<<<< HEAD
// Resubmit exporter profile after rejection
router.post('/exporters/:exporterId/resubmit', controller.resubmitProfile);

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
// Validate exporter qualification
router.get('/exporters/:exporterId/validate', controller.validateExporter);

// ============================================================================
// LABORATORY CERTIFICATION
// ============================================================================

// Get pending laboratory certifications
router.get('/laboratories/pending', controller.getPendingLaboratories);

// Certify laboratory
router.post('/laboratories/:laboratoryId/certify', controller.certifyLaboratory);

<<<<<<< HEAD
// Reject laboratory certification
router.post('/laboratories/:laboratoryId/reject', controller.rejectLaboratory);

// Resubmit laboratory after rejection
router.post('/laboratories/:laboratoryId/resubmit', controller.resubmitLaboratory);

// ============================================================================
// TASTER VERIFICATION
// ============================================================================

// Get pending taster verifications
router.get('/tasters/pending', controller.getPendingTasters);

// Verify taster credentials
router.post('/tasters/:tasterId/verify', controller.verifyTaster);

// Reject taster verification
router.post('/tasters/:tasterId/reject', controller.rejectTaster);

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
// ============================================================================
// COMPETENCE CERTIFICATES
// ============================================================================

// Get pending competence certificate applications
router.get('/competence/pending', controller.getPendingCompetenceCertificates);

// Issue competence certificate
router.post('/competence/:exporterId/issue', controller.issueCompetenceCertificate);

<<<<<<< HEAD
// Reject competence certificate application
router.post('/competence/:exporterId/reject', controller.rejectCompetenceCertificate);

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
// ============================================================================
// EXPORT LICENSES
// ============================================================================

// Receive license application from Exporter Portal
router.post('/license-applications', controller.receiveLicenseApplication);

// Get pending export license applications
router.get('/licenses/pending', controller.getPendingLicenses);

// Issue export license
router.post('/licenses/:exporterId/issue', controller.issueExportLicense);

<<<<<<< HEAD
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


=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
export default router;
