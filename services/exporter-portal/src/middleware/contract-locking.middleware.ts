import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './rbac.middleware';
import { logger } from '../utils/logger';

/**
 * Middleware to prevent modifications to locked contracts
 * Locked contracts: FINALIZED, REJECTED
 */
export const preventLockedContractModification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const contract = (req as any).contract;

    if (!contract) {
      return res.status(400).json({ error: 'Contract not found in request' });
    }

    // Check if contract is locked
    const lockedStatuses = ['FINALIZED', 'REJECTED'];
    if (lockedStatuses.includes(contract.status)) {
      logger.warn(
        `Attempted modification of locked contract ${contract.draft_id} with status ${contract.status}`
      );
      return res.status(409).json({
        error: 'Conflict',
        message: `Cannot modify ${contract.status} contracts. This contract is locked and immutable.`,
        contractStatus: contract.status,
      });
    }

    next();
  } catch (err) {
    logger.error('Error checking contract lock status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to prevent deletion of locked contracts
 */
export const preventLockedContractDeletion = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const contract = (req as any).contract;

    if (!contract) {
      return res.status(400).json({ error: 'Contract not found in request' });
    }

    // Only DRAFT contracts can be deleted
    if (contract.status !== 'DRAFT') {
      logger.warn(
        `Attempted deletion of non-draft contract ${contract.draft_id} with status ${contract.status}`
      );
      return res.status(409).json({
        error: 'Conflict',
        message: `Cannot delete ${contract.status} contracts. Only DRAFT contracts can be deleted.`,
        contractStatus: contract.status,
      });
    }

    next();
  } catch (err) {
    logger.error('Error checking contract deletion eligibility:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to enforce read-only access to locked contracts
 */
export const enforceReadOnlyForLockedContracts = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const contract = (req as any).contract;
    const method = req.method;

    if (!contract) {
      return res.status(400).json({ error: 'Contract not found in request' });
    }

    // Check if contract is locked
    const lockedStatuses = ['FINALIZED', 'REJECTED'];
    if (lockedStatuses.includes(contract.status)) {
      // Allow GET requests
      if (method === 'GET') {
        return next();
      }

      // Deny all other methods
      logger.warn(
        `Attempted ${method} operation on locked contract ${contract.draft_id} with status ${contract.status}`
      );
      return res.status(409).json({
        error: 'Conflict',
        message: `Cannot perform ${method} operations on ${contract.status} contracts. This contract is locked and immutable.`,
        contractStatus: contract.status,
        allowedMethods: ['GET'],
      });
    }

    next();
  } catch (err) {
    logger.error('Error enforcing read-only access:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to add lock information to response
 */
export const addLockInformationToResponse = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const contract = (req as any).contract;

    if (contract) {
      const lockedStatuses = ['FINALIZED', 'REJECTED'];
      (req as any).contractLocked = lockedStatuses.includes(contract.status);
      (req as any).lockReason =
        contract.status === 'FINALIZED'
          ? 'Contract has been finalized and is immutable'
          : contract.status === 'REJECTED'
          ? 'Contract has been rejected and cannot be modified'
          : null;
    }

    next();
  } catch (err) {
    logger.error('Error adding lock information:', err);
    next();
  }
};

/**
 * Utility function to check if contract is locked
 */
export const isContractLocked = (contractStatus: string): boolean => {
  const lockedStatuses = ['FINALIZED', 'REJECTED'];
  return lockedStatuses.includes(contractStatus);
};

/**
 * Utility function to get lock reason
 */
export const getLockReason = (contractStatus: string): string | null => {
  if (contractStatus === 'FINALIZED') {
    return 'Contract has been finalized and is immutable';
  }
  if (contractStatus === 'REJECTED') {
    return 'Contract has been rejected and cannot be modified';
  }
  return null;
};

/**
 * Utility function to get allowed operations for contract status
 */
export const getAllowedOperations = (contractStatus: string): string[] => {
  const lockedStatuses = ['FINALIZED', 'REJECTED'];

  if (lockedStatuses.includes(contractStatus)) {
    return ['GET']; // Read-only
  }

  // For other statuses, allow all operations
  return ['GET', 'POST', 'PUT', 'DELETE'];
};
