/**
 * Contract Ownership Verification Middleware
 * Verifies that users can only access contracts they own or are authorized to access
 */

import { Request, Response, NextFunction } from 'express';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('ContractOwnershipMiddleware');

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    exporterId?: string;
  };
}

/**
 * Verify exporter ownership of contract
 */
export const verifyExporterOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { draftId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Admin can access any contract
    if (userRole === 'ADMIN') {
      return next();
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT exporter_id, status FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Contract not found',
      });
    }

    const contract = result.rows[0];

    // Check if user is the exporter
    if (contract.exporter_id !== userId) {
      logger.warn('Unauthorized contract access attempt', {
        userId,
        contractId: draftId,
        ownerId: contract.exporter_id,
        ip: req.ip,
      });

      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this contract',
      });
    }

    // Check if contract is locked
    if (contract.status === 'FINALIZED' || contract.status === 'REJECTED') {
      if (req.method !== 'GET') {
        logger.warn('Attempt to modify locked contract', {
          userId,
          contractId: draftId,
          status: contract.status,
        });

        return res.status(409).json({
          status: 'error',
          code: 'CONFLICT',
          message: 'Cannot modify finalized or rejected contracts',
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error verifying contract ownership', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Error verifying contract ownership',
    });
  }
};

/**
 * Verify buyer access to contract
 */
export const verifyBuyerAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { draftId } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT buyer_email, status FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Contract not found',
      });
    }

    const contract = result.rows[0];

    // Check if user is the buyer
    if (contract.buyer_email !== userEmail) {
      logger.warn('Unauthorized buyer access attempt', {
        userEmail,
        contractId: draftId,
        buyerEmail: contract.buyer_email,
        ip: req.ip,
      });

      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this contract',
      });
    }

    // Check if contract is in correct status for buyer actions
    if (req.method === 'POST' && contract.status !== 'COUNTERED') {
      return res.status(409).json({
        status: 'error',
        code: 'CONFLICT',
        message: 'Contract is not available for buyer response',
      });
    }

    next();
  } catch (error) {
    logger.error('Error verifying buyer access', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Error verifying buyer access',
    });
  }
};

/**
 * Log access attempt
 */
export const logAccessAttempt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { draftId } = req.params;

    if (userId && draftId) {
      const pool = getPool();
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, req.method, 'contract', draftId, req.ip]
      );
    }

    next();
  } catch (error) {
    logger.error('Error logging access attempt', { error });
    // Don't block the request if logging fails
    next();
  }
};

/**
 * Prevent modification of locked contracts
 */
export const preventLockedContractModification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.method === 'GET') {
      return next();
    }

    const { draftId } = req.params;

    if (!draftId) {
      return next();
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT status FROM contract_drafts WHERE draft_id = $1',
      [draftId]
    );

    if (result.rows.length === 0) {
      return next();
    }

    const contract = result.rows[0];

    if (contract.status === 'FINALIZED' || contract.status === 'REJECTED') {
      logger.warn('Attempt to modify locked contract', {
        userId: req.user?.id,
        contractId: draftId,
        status: contract.status,
        method: req.method,
      });

      return res.status(409).json({
        status: 'error',
        code: 'CONFLICT',
        message: `Cannot modify ${contract.status.toLowerCase()} contracts`,
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking contract lock status', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Error verifying contract status',
    });
  }
};
