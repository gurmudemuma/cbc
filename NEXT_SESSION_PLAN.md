# Next Session Plan - Session 2

**Target Date:** TBD  
**Current Progress:** 45%  
**Target Progress:** 60%  
**Estimated Duration:** 2-3 hours

---

## 🎯 Session 2 Objectives

### Primary Goals
1. ✅ Update Exporter Portal API (submit to ECX)
2. ✅ Implement NBE API changes (reduce role)
3. ✅ Update Commercial Bank API (clarify role)
4. ✅ Test updated workflow

### Success Criteria
- [ ] Exporter Portal submits to ECX (not NBE)
- [ ] NBE API only handles FX approval
- [ ] Commercial Bank can submit FX applications
- [ ] All APIs build without errors
- [ ] Basic integration testing passes
- [ ] Progress reaches 60%

---

## 📋 Pre-Session Checklist

### Before Starting
- [ ] Review FINAL_SESSION_SUMMARY.md
- [ ] Review API_UPDATES_REQUIRED.md
- [ ] Review REORGANIZATION_INDEX.md
- [ ] Check current API code
- [ ] Verify chaincode is still building
- [ ] Ensure all dependencies installed

### Environment Check
```bash
# Verify ECX API
cd /home/gu-da/cbc/api/ecx
npm run dev  # Should start on port 3006

# Verify ECTA API
cd /home/gu-da/cbc/api/ecta
npm run dev  # Should start on port 3004

# Verify chaincode
cd /home/gu-da/cbc/chaincode/coffee-export
go build  # Should succeed
```

---

## 🔧 Task 1: Update Exporter Portal API

### Priority: HIGH
**Estimated Time:** 45 minutes

### Current State
- Submits to National Bank API (Port 3002)
- Creates draft export requests
- No ECX integration

### Required Changes

#### 1.1 Update Export Submission Endpoint
**File:** `api/exporter-portal/src/services/export.service.ts` (or similar)

**Change:**
```typescript
// OLD (WRONG)
async createExport(data: ExportData) {
  const response = await fetch('http://localhost:3002/api/exports', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// NEW (CORRECT)
async createExport(data: ExportData) {
  // Submit to ECX for verification and blockchain record creation
  const response = await fetch('http://localhost:3006/api/ecx/create-export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      exportId: data.exportId,
      exporterBankId: data.exporterBankId,
      exporterName: data.exporterName,
      exporterTIN: data.exporterTIN,
      exportLicenseNumber: data.exportLicenseNumber,
      coffeeType: data.coffeeType,
      quantity: data.quantity,
      destinationCountry: data.destinationCountry,
      estimatedValue: data.estimatedValue,
      ecxLotNumber: data.ecxLotNumber, // NEW - Required
      warehouseLocation: data.warehouseLocation,
      warehouseReceiptNumber: data.warehouseReceiptNumber // NEW - Required
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create export via ECX');
  }
  
  return await response.json();
}
```

#### 1.2 Add ECX Fields to Export Form
**File:** `frontend/src/components/ExportForm.tsx` (or similar)

**Add Fields:**
```typescript
interface ExportFormData {
  // Existing fields...
  exportId: string;
  exporterName: string;
  coffeeType: string;
  quantity: number;
  
  // NEW REQUIRED FIELDS
  ecxLotNumber: string;          // ECX lot number (required)
  warehouseReceiptNumber: string; // Warehouse receipt (required)
  warehouseLocation: string;      // Warehouse location (optional)
  exporterTIN: string;            // Tax ID (required for ECX verification)
}
```

#### 1.3 Update Environment Variables
**File:** `api/exporter-portal/.env`

```env
# OLD
NATIONAL_BANK_API_URL=http://localhost:3002

# NEW
ECX_API_URL=http://localhost:3006
ECTA_API_URL=http://localhost:3004
NATIONAL_BANK_API_URL=http://localhost:3002
```

#### 1.4 Update Workflow UI
**File:** `frontend/src/components/WorkflowTracker.tsx`

**Update Steps:**
```typescript
const workflowSteps = [
  { id: 1, name: 'Draft', status: 'DRAFT' },
  { id: 2, name: 'ECX Verification', status: 'ECX_VERIFIED' },      // NEW
  { id: 3, name: 'ECTA License', status: 'ECTA_LICENSE_APPROVED' }, // NEW
  { id: 4, name: 'ECTA Quality', status: 'ECTA_QUALITY_APPROVED' }, // NEW
  { id: 5, name: 'ECTA Contract', status: 'ECTA_CONTRACT_APPROVED' }, // NEW
  { id: 6, name: 'Bank Verified', status: 'BANK_DOCUMENT_VERIFIED' },
  { id: 7, name: 'FX Approved', status: 'FX_APPROVED' },
  { id: 8, name: 'Customs Cleared', status: 'CUSTOMS_CLEARED' },
  { id: 9, name: 'Shipped', status: 'SHIPPED' },
  { id: 10, name: 'Delivered', status: 'DELIVERED' },
  { id: 11, name: 'Payment', status: 'PAYMENT_RECEIVED' },
  { id: 12, name: 'Completed', status: 'COMPLETED' }
];
```

### Testing Task 1
```bash
# Test export creation
curl -X POST http://localhost:3003/api/exports \
  -H "Content-Type: application/json" \
  -d '{
    "exportId": "EXP-TEST-001",
    "exporterName": "Test Exporter",
    "ecxLotNumber": "LOT-2024-001",
    "warehouseReceiptNumber": "WR-2024-001",
    "coffeeType": "Arabica",
    "quantity": 5000
  }'

# Should return success and create record via ECX
```

---

## 🔧 Task 2: Implement NBE API Changes

### Priority: HIGH
**Estimated Time:** 45 minutes

### Current State
- Has CreateExportRequest function (wrong)
- Has SubmitForBankingReview function (wrong)
- Has ApproveFX function (needs update)

### Required Changes

#### 2.1 Remove CreateExportRequest Function
**File:** `api/banker/src/controllers/export.controller.ts` (create if needed)

**Action:** Delete or comment out entire function

```typescript
// DELETE THIS FUNCTION - ECX creates records now
/*
async createExport(req, res) {
  // This is now done by ECX
  // DELETE THIS ENTIRE FUNCTION
}
*/
```

#### 2.2 Remove SubmitForBankingReview Function
**Action:** Delete or comment out

```typescript
// DELETE THIS FUNCTION - Commercial Bank does this now
/*
async submitForBankingReview(req, res) {
  // This is now done by Commercial Bank
  // DELETE THIS ENTIRE FUNCTION
}
*/
```

#### 2.3 Update ApproveFX Function
**File:** `api/banker/src/controllers/fx.controller.ts` (create if needed)

```typescript
import { Request, Response } from 'express';
import { fabricService } from '../services/fabric.service';

export class FXController {
  /**
   * Approve FX application (submitted by Commercial Bank)
   * NEW: Renamed from ApproveFX to ApproveFXApplication
   */
  async approveFXApplication(req: Request, res: Response) {
    try {
      const { exportId } = req.params;
      const { fxAmount, fxRate, fxApprovalCID, approvedBy, notes } = req.body;

      // Validate required fields
      if (!exportId || !fxAmount || !fxApprovalCID) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: exportId, fxAmount, fxApprovalCID'
        });
      }

      // Get export from blockchain
      const exportData = await fabricService.getExport(exportId);

      // Verify export is in FX_APPLICATION_PENDING status
      if (exportData.status !== 'FX_APPLICATION_PENDING') {
        return res.status(400).json({
          success: false,
          error: `Export must be in FX_APPLICATION_PENDING status. Current: ${exportData.status}`,
          currentStatus: exportData.status
        });
      }

      // Verify all prerequisites are met
      const hasECTAApproval = exportData.status !== 'ECTA_CONTRACT_APPROVED';
      const hasBankVerification = exportData.bankDocumentVerified;
      
      if (!hasECTAApproval || !hasBankVerification) {
        return res.status(400).json({
          success: false,
          error: 'Missing prerequisites: ECTA approval and Bank verification required'
        });
      }

      // Approve FX on blockchain
      const txId = await fabricService.submitTransaction(
        'ApproveFXApplication', // Renamed chaincode function
        exportId,
        fxApprovalCID
      );

      res.status(200).json({
        success: true,
        message: 'FX approved successfully',
        exportId,
        status: 'FX_APPROVED',
        fxAmount,
        approvedBy,
        approvedAt: new Date().toISOString(),
        blockchainTxId: txId
      });
    } catch (error) {
      console.error('Error approving FX:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Reject FX application
   */
  async rejectFXApplication(req: Request, res: Response) {
    try {
      const { exportId } = req.params;
      const { reason, rejectedBy } = req.body;

      if (!exportId || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: exportId, reason'
        });
      }

      const txId = await fabricService.submitTransaction(
        'RejectFXApplication',
        exportId,
        reason,
        rejectedBy
      );

      res.status(200).json({
        success: true,
        message: 'FX application rejected',
        exportId,
        status: 'FX_REJECTED',
        reason,
        rejectedBy,
        blockchainTxId: txId
      });
    } catch (error) {
      console.error('Error rejecting FX:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get pending FX applications
   */
  async getPendingFXApplications(req: Request, res: Response) {
    try {
      const exports = await fabricService.getExportsByStatus('FX_APPLICATION_PENDING');

      res.status(200).json({
        success: true,
        count: exports.length,
        exports
      });
    } catch (error) {
      console.error('Error getting pending FX applications:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const fxController = new FXController();
```

#### 2.4 Update Routes
**File:** `api/banker/src/routes/fx.routes.ts` (create if needed)

```typescript
import { Router } from 'express';
import { fxController } from '../controllers/fx.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// FX approval endpoints (NBE only)
router.post('/approve/:exportId', authenticate, fxController.approveFXApplication.bind(fxController));
router.post('/reject/:exportId', authenticate, fxController.rejectFXApplication.bind(fxController));
router.get('/pending', authenticate, fxController.getPendingFXApplications.bind(fxController));

export default router;
```

#### 2.5 Update Main Server
**File:** `api/banker/src/index.ts`

```typescript
import fxRoutes from './routes/fx.routes';

// Add FX routes
app.use('/api/fx', fxRoutes);
```

### Testing Task 2
```bash
# Test FX approval
curl -X POST http://localhost:3002/api/fx/approve/EXP-TEST-001 \
  -H "Content-Type: application/json" \
  -d '{
    "fxAmount": 75000,
    "fxApprovalCID": "QmXxXxXx...",
    "approvedBy": "nbe-officer-001"
  }'

# Should return success
```

---

## 🔧 Task 3: Update Commercial Bank API

### Priority: MEDIUM
**Estimated Time:** 30 minutes

### Required Changes

#### 3.1 Add FX Application Submission
**File:** `api/commercialbank/src/controllers/fx.controller.ts` (create if needed)

```typescript
export class CommercialBankFXController {
  /**
   * Submit FX application to NBE (after verifying all documents)
   */
  async submitFXApplication(req: Request, res: Response) {
    try {
      const { exportId } = req.params;

      // Get export from blockchain
      const exportData = await fabricService.getExport(exportId);

      // Verify export has ECTA contract approval
      if (exportData.status !== 'ECTA_CONTRACT_APPROVED') {
        return res.status(400).json({
          success: false,
          error: 'Export must have ECTA contract approval first',
          currentStatus: exportData.status
        });
      }

      // Verify all documents
      const documentsValid = await this.verifyAllDocuments(exportData);
      
      if (!documentsValid.valid) {
        return res.status(400).json({
          success: false,
          error: 'All documents must be verified first',
          missing: documentsValid.missing
        });
      }

      // Submit FX application to NBE via blockchain
      const txId = await fabricService.submitTransaction(
        'SubmitForFX',
        exportId
      );

      res.status(200).json({
        success: true,
        message: 'FX application submitted to NBE',
        exportId,
        status: 'FX_APPLICATION_PENDING',
        blockchainTxId: txId
      });
    } catch (error) {
      console.error('Error submitting FX application:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify all required documents are present
   */
  private async verifyAllDocuments(exportData: any) {
    const missing = [];

    // Check ECTA documents
    if (!exportData.qualityDocuments || exportData.qualityDocuments.length === 0) {
      missing.push('Quality Certificate');
    }
    if (!exportData.originCertificateNumber) {
      missing.push('Certificate of Origin');
    }
    if (!exportData.contractApprovedBy) {
      missing.push('Contract Approval');
    }
    if (!exportData.exportLicenseValidatedBy) {
      missing.push('Export License Validation');
    }

    // Check commercial documents
    if (!exportData.commercialInvoice) {
      missing.push('Commercial Invoice');
    }
    if (!exportData.salesContract) {
      missing.push('Sales Contract');
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }
}
```

---

## 📊 Session 2 Progress Tracking

### Expected Completion
- Start: 45%
- After Task 1: 50%
- After Task 2: 55%
- After Task 3: 60%
- **Target: 60%**

### Time Allocation
- Task 1 (Portal): 45 min
- Task 2 (NBE): 45 min
- Task 3 (Bank): 30 min
- Testing: 30 min
- Documentation: 30 min
- **Total: 3 hours**

---

## ✅ Session 2 Checklist

### During Session
- [ ] Update Exporter Portal to submit to ECX
- [ ] Add ECX fields to export form
- [ ] Remove NBE CreateExportRequest
- [ ] Update NBE ApproveFX function
- [ ] Add Commercial Bank FX submission
- [ ] Test all changes
- [ ] Update documentation

### After Session
- [ ] Update REORGANIZATION_PROGRESS.md
- [ ] Create Session 2 summary
- [ ] Commit all changes
- [ ] Test integration
- [ ] Update stakeholders

---

## 🎯 Success Criteria

### Must Have
- ✅ Exporter Portal submits to ECX
- ✅ NBE only handles FX approval
- ✅ Commercial Bank can submit FX
- ✅ All APIs build without errors
- ✅ Basic workflow tested

### Should Have
- ✅ Integration tests pass
- ✅ Documentation updated
- ✅ Progress at 60%

### Nice to Have
- Frontend UI updated
- Performance tested
- Security reviewed

---

## 📝 Notes for Next Session

### Remember to:
1. Review all Session 1 documentation first
2. Test each change incrementally
3. Update progress tracker regularly
4. Document any issues encountered
5. Create session summary at end

### Quick Commands
```bash
# Start ECX API
cd /home/gu-da/cbc/api/ecx && npm run dev

# Start ECTA API
cd /home/gu-da/cbc/api/ecta && npm run dev

# Start NBE API
cd /home/gu-da/cbc/api/banker && npm run dev

# Build chaincode
cd /home/gu-da/cbc/chaincode/coffee-export && go build
```

---

**Status:** Ready for Session 2  
**Target:** 60% Complete  
**Estimated Time:** 2-3 hours  
**Priority:** HIGH
