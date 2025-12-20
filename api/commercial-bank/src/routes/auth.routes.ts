import { Router } from "express";
import { AuthPostgresController } from "../controllers/auth-postgres.controller";
import { authMiddleware } from "../../../shared/middleware/auth.middleware";

const router = Router();
const authController = new AuthPostgresController();

/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Body:
 * {
 *   "username": "string",
 *   "email": "string",
 *   "password": "string",
 *   "organizationId": "string (optional)",
 *   "role": "string (optional)"
 * }
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 * Login user
 * 
 * Body:
 * {
 *   "username": "string",
 *   "password": "string"
 * }
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 * 
 * Body:
 * {
 *   "token": "string"
 * }
 */
router.post("/refresh", authController.refreshToken);

/**
 * GET /api/auth/profile
 * Get current user profile (protected)
 */
router.get("/profile", authMiddleware, authController.getProfile);

/**
 * PUT /api/auth/profile
 * Update user profile (protected)
 * 
 * Body:
 * {
 *   "email": "string (optional)",
 *   "role": "string (optional)"
 * }
 */
router.put("/profile", authMiddleware, authController.updateProfile);

/**
 * POST /api/auth/change-password
 * Change user password (protected)
 * 
 * Body:
 * {
 *   "currentPassword": "string",
 *   "newPassword": "string"
 * }
 */
router.post("/change-password", authMiddleware, authController.changePassword);

export default router;
