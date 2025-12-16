import { Router } from 'express';
import { PreRegistrationController } from '../controllers/preregistration.controller';
import { authMiddleware as authenticate } from '../../../shared/middleware/auth.middleware';

const router = Router();
const controller = new PreRegistrationController();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// STAGE 1: BUSINESS REGISTRATION VERIFICATION (5-7 days)
// ============================================================================

// Submit Stage 1 (Business Registration)
router.post('/stage1/submit', controller.submitStage1);

// Approve Stage 1 (Business Registration)
router.post('/stage1/:exporterId/approve', controller.approveStage1);

// Reject Stage 1 (Business Registration)
router.post('/stage1/:exporterId/reject', controller.rejectStage1);

// Get Stage 1 pending applications
router.get('/stage1/pending', controller.getPendingStage1);

// Get Stage 1 details
router.get('/stage1/:exporterId', controller.getStage1Details);

// ============================================================================
// STAGE 2: FACILITY INSPECTION & VERIFICATION (1-2 weeks)
// ============================================================================

// Schedule Stage 2 inspection
router.post('/stage2/schedule-inspection', controller.scheduleStage2Inspection);

// Approve Stage 2 (Facility Inspection)
router.post('/stage2/:exporterId/approve', controller.approveStage2);

// Reject Stage 2 (Facility Inspection)
router.post('/stage2/:exporterId/reject', controller.rejectStage2);

// Get Stage 2 pending inspections
router.get('/stage2/pending', controller.getPendingStage2);

// Get Stage 2 details
router.get('/stage2/:exporterId', controller.getStage2Details);

// ============================================================================
// STAGE 3: LABORATORY CERTIFICATION (2-3 weeks)
// ============================================================================

// Certify Stage 3 (Laboratory)
router.post('/stage3/:laboratoryId/certify', controller.certifyStage3Laboratory);

// Reject Stage 3 (Laboratory)
router.post('/stage3/:laboratoryId/reject', controller.rejectStage3Laboratory);

// Get Stage 3 pending certifications
router.get('/stage3/pending', controller.getPendingStage3);

// Get Stage 3 details
router.get('/stage3/:laboratoryId', controller.getStage3Details);

// ============================================================================
// STAGE 4: COMPETENCE CERTIFICATE (1-2 weeks)
// ============================================================================

// Issue Stage 4 (Competence Certificate)
router.post('/stage4/:exporterId/issue', controller.issueStage4Competence);

// Reject Stage 4 (Competence Certificate)
router.post('/stage4/:exporterId/reject', controller.rejectStage4Competence);

// Get Stage 4 pending applications
router.get('/stage4/pending', controller.getPendingStage4);

// Get Stage 4 details
router.get('/stage4/:exporterId', controller.getStage4Details);

// ============================================================================
// STAGE 5: EXPORT LICENSE (1 week)
// ============================================================================

// Issue Stage 5 (Export License)
router.post('/stage5/:exporterId/issue', controller.issueStage5License);

// Reject Stage 5 (Export License)
router.post('/stage5/:exporterId/reject', controller.rejectStage5License);

// Get Stage 5 pending applications
router.get('/stage5/pending', controller.getPendingStage5);

// Get Stage 5 details
router.get('/stage5/:exporterId', controller.getStage5Details);

// ============================================================================
// COMPLIANCE MONITORING
// ============================================================================

// Submit quarterly report
router.post('/compliance/quarterly-report', controller.submitQuarterlyReport);

// Get quarterly reports
router.get('/compliance/quarterly-reports/:exporterId', controller.getQuarterlyReports);

// Schedule annual audit
router.post('/compliance/annual-audit/:exporterId', controller.scheduleAnnualAudit);

// Get annual audits
router.get('/compliance/annual-audits/:exporterId', controller.getAnnualAudits);

// Record compliance violation
router.post('/compliance/violation/:exporterId', controller.recordViolation);

// Get violations
router.get('/compliance/violations/:exporterId', controller.getViolations);

// ============================================================================
// EXPORTER PROFILE MANAGEMENT (LEGACY - KEPT FOR COMPATIBILITY)
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
// LABORATORY CERTIFICATION (LEGACY - KEPT FOR COMPATIBILITY)
// ============================================================================

// Get pending laboratory certifications
router.get('/laboratories/pending', controller.getPendingLaboratories);

// Certify laboratory
router.post('/laboratories/:laboratoryId/certify', controller.certifyLaboratory);

// ============================================================================
// COMPETENCE CERTIFICATES (LEGACY - KEPT FOR COMPATIBILITY)
// ============================================================================

// Get pending competence certificate applications
router.get('/competence/pending', controller.getPendingCompetenceCertificates);

// Issue competence certificate
router.post('/competence/:exporterId/issue', controller.issueCompetenceCertificate);

// ============================================================================
// EXPORT LICENSES (LEGACY - KEPT FOR COMPATIBILITY)
// ============================================================================

// Receive license application from Exporter Portal
router.post('/license-applications', controller.receiveLicenseApplication);

// Get pending export license applications
router.get('/licenses/pending', controller.getPendingLicenses);

// Issue export license
router.post('/licenses/:exporterId/issue', controller.issueExportLicense);

export default router;
