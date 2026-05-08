import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Register new exporter
router.post('/register', authController.register);

// Check qualification status (public endpoint for login page)
router.get('/qualification-status/:username', authController.getQualificationStatusByUsername);

// Login
router.post('/login', authController.login);

// Refresh token
router.post('/refresh', authController.refreshToken);

export default router;
