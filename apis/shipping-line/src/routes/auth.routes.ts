import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateLogin, validateRegister } from '../middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

// Register new user
router.post('/register', validateRegister, authController.register);

// Login
router.post('/login', validateLogin, authController.login);

// Refresh token
router.post('/refresh', authController.refreshToken);

export default router;
