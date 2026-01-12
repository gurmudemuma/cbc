/**
 * User Management Routes
 * Handles user CRUD operations
 */

import { Router } from 'express';
import { createUserController } from '../controllers/user.controller';
import { authMiddleware } from '@shared/middleware/auth.middleware';

const router = Router();
const userController = createUserController();

/**
 * GET /api/users
 * Get all users (with optional organizationId filter)
 * Query params: organizationId (optional)
 */
router.get('/', authMiddleware, (req, res, next) => {
  userController.getAllUsers(req, res, next);
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authMiddleware, (req, res, next) => {
  userController.getUserById(req, res, next);
});

/**
 * POST /api/users
 * Create a new user
 * Body: { username, email, password, organizationId?, role? }
 */
router.post('/', authMiddleware, (req, res, next) => {
  userController.createUser(req, res, next);
});

/**
 * PUT /api/users/:id/role
 * Update user role
 * Body: { role }
 */
router.put('/:id/role', authMiddleware, (req, res, next) => {
  userController.updateUserRole(req, res, next);
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', authMiddleware, (req, res, next) => {
  userController.deleteUser(req, res, next);
});

/**
 * PATCH /api/users/:id/activate
 * Activate user
 */
router.patch('/:id/activate', authMiddleware, (req, res, next) => {
  userController.activateUser(req, res, next);
});

/**
 * PATCH /api/users/:id/deactivate
 * Deactivate user
 */
router.patch('/:id/deactivate', authMiddleware, (req, res, next) => {
  userController.deactivateUser(req, res, next);
});

export default router;
