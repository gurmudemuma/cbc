import { Router } from 'express';
import { ExporterPreRegistrationController } from '../controllers/exporter-preregistration.controller';
import { authenticateToken as authenticate } from '../middleware/exporter-auth.middleware';

const router = Router();
const controller = new ExporterPreRegistrationController();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EXPORTER PROFILE
// ============================================================================

// Register exporter profile
router.post('/profile/register', controller.registerProfile);

// Get own profile
router.get('/profile', controller.getMyProfile);

// ============================================================================
// LABORATORY REGISTRATION
// ============================================================================

// Register laboratory for certification
router.post('/laboratory/register', controller.registerLaboratory);

// ============================================================================
// TASTER REGISTRATION
// ============================================================================

// Register coffee taster
router.post('/taster/register', controller.registerTaster);

// ============================================================================
// COMPETENCE CERTIFICATE
// ============================================================================

// Apply for competence certificate
router.post('/competence/apply', controller.applyForCompetenceCertificate);

// ============================================================================
// EXPORT LICENSE
// ============================================================================

// Apply for export license
router.post('/license/apply', controller.applyForExportLicense);

// ============================================================================
// QUALIFICATION STATUS
// ============================================================================

// Check qualification status
router.get('/qualification-status', controller.checkQualificationStatus);

export default router;
