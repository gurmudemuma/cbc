# Implementation Guide - Task Assignment Enforcement

**Date:** November 7, 2025  
**Status:** 📋 **READY FOR IMPLEMENTATION**

---

## 🎯 Goal

Enforce task assignments so each organization can ONLY perform their designated tasks.

---

## 🔐 Role-Based Access Control Implementation

### 1. Define Organization Roles

```typescript
// api/shared/types/roles.ts

export enum OrganizationRole {
  EXPORTER_PORTAL = 'exporter-portal',
  ECX = 'ecx',
  ECTA = 'ecta',
  COMMERCIAL_BANK = 'commercial-bank',
  NBE = 'national-bank',
  CUSTOMS = 'custom-authorities',
  SHIPPING_LINE = 'shipping-line',
}

export enum ExportAction {
  // Exporter Portal
  CREATE_EXPORT = 'CREATE_EXPORT',
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',
  VIEW_OWN_EXPORT = 'VIEW_OWN_EXPORT',
  
  // ECX
  VERIFY_LOT = 'VERIFY_LOT',
  APPROVE_LOT = 'APPROVE_LOT',
  REJECT_LOT = 'REJECT_LOT',
  
  // ECTA
  ISSUE_LICENSE = 'ISSUE_LICENSE',
  APPROVE_LICENSE = 'APPROVE_LICENSE',
  REJECT_LICENSE = 'REJECT_LICENSE',
  CONDUCT_QUALITY_INSPECTION = 'CONDUCT_QUALITY_INSPECTION',
  ISSUE_QUALITY_CERTIFICATE = 'ISSUE_QUALITY_CERTIFICATE',
  APPROVE_QUALITY = 'APPROVE_QUALITY',
  REJECT_QUALITY = 'REJECT_QUALITY',
  APPROVE_CONTRACT = 'APPROVE_CONTRACT',
  REJECT_CONTRACT = 'REJECT_CONTRACT',
  
  // Commercial Bank
  VERIFY_DOCUMENTS = 'VERIFY_DOCUMENTS',
  SUBMIT_FX_REQUEST = 'SUBMIT_FX_REQUEST',
  
  // NBE
  APPROVE_FX = 'APPROVE_FX',
  REJECT_FX = 'REJECT_FX',
  SET_FX_RATE = 'SET_FX_RATE',
  
  // Customs
  REVIEW_CLEARANCE = 'REVIEW_CLEARANCE',
  APPROVE_CUSTOMS = 'APPROVE_CUSTOMS',
  REJECT_CUSTOMS = 'REJECT_CUSTOMS',
  
  // Shipping Line
  SCHEDULE_SHIPMENT = 'SCHEDULE_SHIPMENT',
  SHIP_EXPORT = 'SHIP_EXPORT',
  CONFIRM_DELIVERY = 'CONFIRM_DELIVERY',
  
  // Common
  VIEW_ALL_EXPORTS = 'VIEW_ALL_EXPORTS',
}

// Permission matrix
export const ROLE_PERMISSIONS: Record<OrganizationRole, ExportAction[]> = {
  [OrganizationRole.EXPORTER_PORTAL]: [
    ExportAction.CREATE_EXPORT,
    ExportAction.UPLOAD_DOCUMENTS,
    ExportAction.VIEW_OWN_EXPORT,
  ],
  
  [OrganizationRole.ECX]: [
    ExportAction.VERIFY_LOT,
    ExportAction.APPROVE_LOT,
    ExportAction.REJECT_LOT,
    ExportAction.VIEW_ALL_EXPORTS,
  ],
  
  [OrganizationRole.ECTA]: [
    ExportAction.ISSUE_LICENSE,
    ExportAction.APPROVE_LICENSE,
    ExportAction.REJECT_LICENSE,
    ExportAction.CONDUCT_QUALITY_INSPECTION,
    ExportAction.ISSUE_QUALITY_CERTIFICATE,
    ExportAction.APPROVE_QUALITY,
    ExportAction.REJECT_QUALITY,
    ExportAction.APPROVE_CONTRACT,
    ExportAction.REJECT_CONTRACT,
    ExportAction.VIEW_ALL_EXPORTS,
  ],
  
  [OrganizationRole.COMMERCIAL_BANK]: [
    ExportAction.VERIFY_DOCUMENTS,
    ExportAction.SUBMIT_FX_REQUEST,
    ExportAction.VIEW_ALL_EXPORTS,
    ExportAction.CREATE_EXPORT, // Can create on behalf of exporters
  ],
  
  [OrganizationRole.NBE]: [
    ExportAction.APPROVE_FX,
    ExportAction.REJECT_FX,
    ExportAction.SET_FX_RATE,
    ExportAction.VIEW_ALL_EXPORTS,
  ],
  
  [OrganizationRole.CUSTOMS]: [
    ExportAction.REVIEW_CLEARANCE,
    ExportAction.APPROVE_CUSTOMS,
    ExportAction.REJECT_CUSTOMS,
    ExportAction.VIEW_ALL_EXPORTS,
  ],
  
  [OrganizationRole.SHIPPING_LINE]: [
    ExportAction.SCHEDULE_SHIPMENT,
    ExportAction.SHIP_EXPORT,
    ExportAction.CONFIRM_DELIVERY,
    ExportAction.VIEW_ALL_EXPORTS,
  ],
};
```

---

### 2. Authorization Middleware

```typescript
// api/shared/middleware/authorization.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ROLE_PERMISSIONS, ExportAction, OrganizationRole } from '../types/roles';

export const requireAction = (action: ExportAction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    const userRole = user.organizationId as OrganizationRole;
    const allowedActions = ROLE_PERMISSIONS[userRole];
    
    if (!allowedActions || !allowedActions.includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Your organization (${userRole}) is not authorized to perform this action (${action})`,
        hint: `This action can only be performed by: ${getOrganizationsForAction(action).join(', ')}`,
      });
    }
    
    next();
  };
};

function getOrganizationsForAction(action: ExportAction): string[] {
  const orgs: string[] = [];
  for (const [role, actions] of Object.entries(ROLE_PERMISSIONS)) {
    if (actions.includes(action)) {
      orgs.push(role);
    }
  }
  return orgs;
}
```

---

### 3. Status Validation Middleware

```typescript
// api/shared/middleware/status-validation.middleware.ts

import { Request, Response, NextFunction } from 'express';

export enum ExportStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ECX_VERIFIED = 'ECX_VERIFIED',
  ECX_REJECTED = 'ECX_REJECTED',
  ECTA_LICENSE_APPROVED = 'ECTA_LICENSE_APPROVED',
  LICENSE_REJECTED = 'LICENSE_REJECTED',
  ECTA_QUALITY_APPROVED = 'ECTA_QUALITY_APPROVED',
  QUALITY_REJECTED = 'QUALITY_REJECTED',
  ECTA_CONTRACT_APPROVED = 'ECTA_CONTRACT_APPROVED',
  CONTRACT_REJECTED = 'CONTRACT_REJECTED',
  BANK_DOCUMENT_VERIFIED = 'BANK_DOCUMENT_VERIFIED',
  FX_PENDING = 'FX_PENDING',
  FX_APPROVED = 'FX_APPROVED',
  FX_REJECTED = 'FX_REJECTED',
  EXPORT_CUSTOMS_PENDING = 'EXPORT_CUSTOMS_PENDING',
  EXPORT_CUSTOMS_CLEARED = 'EXPORT_CUSTOMS_CLEARED',
  EXPORT_CUSTOMS_REJECTED = 'EXPORT_CUSTOMS_REJECTED',
  SHIPMENT_SCHEDULED = 'SHIPMENT_SCHEDULED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  COMPLETED = 'COMPLETED',
}

// Define valid status transitions
const VALID_TRANSITIONS: Record<ExportStatus, ExportStatus[]> = {
  [ExportStatus.DRAFT]: [ExportStatus.PENDING],
  [ExportStatus.PENDING]: [ExportStatus.ECX_VERIFIED, ExportStatus.ECX_REJECTED],
  [ExportStatus.ECX_VERIFIED]: [ExportStatus.ECTA_LICENSE_APPROVED, ExportStatus.LICENSE_REJECTED],
  [ExportStatus.ECTA_LICENSE_APPROVED]: [ExportStatus.ECTA_QUALITY_APPROVED, ExportStatus.QUALITY_REJECTED],
  [ExportStatus.ECTA_QUALITY_APPROVED]: [ExportStatus.ECTA_CONTRACT_APPROVED, ExportStatus.CONTRACT_REJECTED],
  [ExportStatus.ECTA_CONTRACT_APPROVED]: [ExportStatus.BANK_DOCUMENT_VERIFIED],
  [ExportStatus.BANK_DOCUMENT_VERIFIED]: [ExportStatus.FX_PENDING],
  [ExportStatus.FX_PENDING]: [ExportStatus.FX_APPROVED, ExportStatus.FX_REJECTED],
  [ExportStatus.FX_APPROVED]: [ExportStatus.EXPORT_CUSTOMS_PENDING],
  [ExportStatus.EXPORT_CUSTOMS_PENDING]: [ExportStatus.EXPORT_CUSTOMS_CLEARED, ExportStatus.EXPORT_CUSTOMS_REJECTED],
  [ExportStatus.EXPORT_CUSTOMS_CLEARED]: [ExportStatus.SHIPMENT_SCHEDULED],
  [ExportStatus.SHIPMENT_SCHEDULED]: [ExportStatus.SHIPPED],
  [ExportStatus.SHIPPED]: [ExportStatus.DELIVERED],
  [ExportStatus.DELIVERED]: [ExportStatus.PAYMENT_RECEIVED],
  [ExportStatus.PAYMENT_RECEIVED]: [ExportStatus.COMPLETED],
  // Rejected statuses are terminal
  [ExportStatus.ECX_REJECTED]: [],
  [ExportStatus.LICENSE_REJECTED]: [],
  [ExportStatus.QUALITY_REJECTED]: [],
  [ExportStatus.CONTRACT_REJECTED]: [],
  [ExportStatus.FX_REJECTED]: [],
  [ExportStatus.EXPORT_CUSTOMS_REJECTED]: [],
  [ExportStatus.COMPLETED]: [],
};

export const validateStatusTransition = (
  currentStatus: ExportStatus,
  newStatus: ExportStatus
): { valid: boolean; message?: string } => {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions) {
    return {
      valid: false,
      message: `Invalid current status: ${currentStatus}`,
    };
  }
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
    };
  }
  
  return { valid: true };
};

export const requireStatus = (requiredStatus: ExportStatus | ExportStatus[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const exportId = req.params.id;
    
    // Fetch export from blockchain
    const exportRecord = await getExportFromBlockchain(exportId);
    
    if (!exportRecord) {
      return res.status(404).json({
        success: false,
        message: 'Export not found',
      });
    }
    
    const allowedStatuses = Array.isArray(requiredStatus) ? requiredStatus : [requiredStatus];
    
    if (!allowedStatuses.includes(exportRecord.status)) {
      return res.status(400).json({
        success: false,
        message: `Export must be in status: ${allowedStatuses.join(' or ')}. Current status: ${exportRecord.status}`,
      });
    }
    
    // Attach export to request for use in controller
    (req as any).exportRecord = exportRecord;
    next();
  };
};

async function getExportFromBlockchain(exportId: string): Promise<any> {
  // Implementation to fetch from blockchain
  // This is a placeholder
  return null;
}
```

---

### 4. Example Controller Implementation

```typescript
// api/ecx/src/controllers/lot-verification.controller.ts

import { Request, Response } from 'express';
import { requireAction } from '../../../shared/middleware/authorization.middleware';
import { requireStatus, validateStatusTransition, ExportStatus } from '../../../shared/middleware/status-validation.middleware';
import { ExportAction } from '../../../shared/types/roles';

export class LotVerificationController {
  
  /**
   * Verify lot - Only ECX can do this
   */
  public verifyLot = [
    requireAction(ExportAction.VERIFY_LOT),
    requireStatus(ExportStatus.PENDING),
    async (req: Request, res: Response) => {
      try {
        const { exportId, lotNumber, warehouseReceipt, verified } = req.body;
        const exportRecord = (req as any).exportRecord;
        
        // Validate status transition
        const newStatus = verified ? ExportStatus.ECX_VERIFIED : ExportStatus.ECX_REJECTED;
        const validation = validateStatusTransition(exportRecord.status, newStatus);
        
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message,
          });
        }
        
        // Submit to blockchain
        await contract.submitTransaction(
          'VerifyLot',
          exportId,
          lotNumber,
          warehouseReceipt,
          verified.toString(),
          (req as any).user.id
        );
        
        res.status(200).json({
          success: true,
          message: `Lot ${verified ? 'verified' : 'rejected'} successfully`,
          data: {
            exportId,
            status: newStatus,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to verify lot',
          error: error.message,
        });
      }
    }
  ];
}
```

---

### 5. Route Protection Example

```typescript
// api/ecx/src/routes/lot-verification.routes.ts

import { Router } from 'express';
import { LotVerificationController } from '../controllers/lot-verification.controller';
import { authenticateToken } from '../../../shared/middleware/auth.middleware';

const router = Router();
const controller = new LotVerificationController();

// All routes require authentication
router.use(authenticateToken);

// Verify lot - Protected by requireAction and requireStatus in controller
router.post('/:id/verify', controller.verifyLot);

export default router;
```

---

## 📋 Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `api/shared/types/roles.ts` with all enums
- [ ] Create `api/shared/middleware/authorization.middleware.ts`
- [ ] Create `api/shared/middleware/status-validation.middleware.ts`
- [ ] Test middleware independently

### Phase 2: ECX Implementation
- [ ] Update ECX controllers with `requireAction`
- [ ] Add status validation for lot verification
- [ ] Test ECX can only verify lots
- [ ] Test ECX cannot approve FX, quality, etc.

### Phase 3: ECTA Implementation
- [ ] Create separate controllers for license, quality, contract
- [ ] Add `requireAction` for each ECTA action
- [ ] Add status validation for each step
- [ ] Test ECTA can only do their 3 tasks

### Phase 4: Commercial Bank Implementation
- [ ] Update banking controllers with `requireAction`
- [ ] Ensure bank can only verify docs and submit FX
- [ ] Test bank cannot approve FX

### Phase 5: NBE Implementation
- [ ] Update NBE controllers with `requireAction`
- [ ] Ensure NBE can only approve/reject FX
- [ ] Test NBE cannot issue licenses or certificates

### Phase 6: Customs Implementation
- [ ] Update customs controllers with `requireAction`
- [ ] Ensure customs can only clear exports
- [ ] Test customs cannot issue certificates

### Phase 7: Shipping Line Implementation
- [ ] Update shipping controllers with `requireAction`
- [ ] Ensure shipping can only schedule/ship
- [ ] Test shipping cannot clear customs

### Phase 8: Integration Testing
- [ ] Test complete workflow end-to-end
- [ ] Test rejection paths
- [ ] Test unauthorized access attempts
- [ ] Test status transition validation

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('Authorization Middleware', () => {
  it('should allow ECX to verify lots', () => {
    // Test implementation
  });
  
  it('should prevent ECX from approving FX', () => {
    // Test implementation
  });
  
  it('should prevent Commercial Bank from approving FX', () => {
    // Test implementation
  });
});

describe('Status Validation', () => {
  it('should allow PENDING → ECX_VERIFIED transition', () => {
    // Test implementation
  });
  
  it('should prevent PENDING → FX_APPROVED transition', () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
describe('Complete Workflow', () => {
  it('should complete full export workflow with correct organizations', async () => {
    // 1. Exporter creates export
    // 2. ECX verifies lot
    // 3. ECTA approves license
    // 4. ECTA approves quality
    // 5. ECTA approves contract
    // 6. Commercial Bank verifies docs
    // 7. NBE approves FX
    // 8. Customs clears
    // 9. Shipping ships
  });
});
```

---

## 📊 Monitoring & Audit

### Audit Log Structure

```typescript
interface AuditLog {
  timestamp: Date;
  exportId: string;
  organizationId: string;
  userId: string;
  action: ExportAction;
  previousStatus: ExportStatus;
  newStatus: ExportStatus;
  success: boolean;
  errorMessage?: string;
}
```

### Metrics to Track

- Actions attempted per organization
- Unauthorized access attempts
- Status transition failures
- Average time per workflow step
- Rejection rates per organization

---

**Status:** 📋 **READY FOR IMPLEMENTATION**  
**All components defined and ready to code**  
**Estimated Time:** 2-3 weeks for complete implementation
