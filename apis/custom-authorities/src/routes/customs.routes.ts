import { Router } from 'express';
import { CustomsController } from '../controllers/customs.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new CustomsController();

router.use(authMiddleware);

router.get('/exports', controller.getAllExports);
router.get('/exports/:exportId', controller.getExportById);
router.post('/clear', controller.issueClearance);
router.post('/reject', controller.rejectAtCustoms);

export default router;
