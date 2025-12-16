# 📝 commercialbank Controller - Required Updates

## Current Status
The commercialbank already has an export controller at:
`/api/commercialbank/src/controllers/export.controller.ts`

## ✅ Methods to Add

Add these methods to the existing ExportController class:

```typescript
import { createExportService } from '../../../shared/exportService';

// ... existing methods ...

/**
 * Get exports pending banking approval
 */
public getPendingBankingApprovals = async (
  _req: RequestWithUser,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const contract = this.fabricGateway.getExportContract();
    const exportService = createExportService(contract);
    const exports = await exportService.getExportsByStatus('BANKING_PENDING');
    res.json({ success: true, data: exports, count: exports.length });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending approvals', 
      error: error.message 
    });
  }
};

/**
 * Approve banking/financial documents
 */
public approveBanking = async (
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { exportId } = req.params;
    const { bankingApprovalID, documentCIDs } = req.body;
    
    const contract = this.fabricGateway.getExportContract();
    const exportService = createExportService(contract);
    
    await exportService.approveBanking(exportId, {
      bankingApprovalID,
      documentCIDs,
    });
    
    res.json({ success: true, message: 'Banking approved successfully' });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve banking', 
      error: error.message 
    });
  }
};

/**
 * Reject banking documents
 */
public rejectBanking = async (
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { exportId } = req.params;
    const { reason } = req.body;
    
    const contract = this.fabricGateway.getExportContract();
    const exportService = createExportService(contract);
    
    await exportService.rejectBanking(exportId, reason);
    
    res.json({ success: true, message: 'Banking rejected' });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject banking', 
      error: error.message 
    });
  }
};

/**
 * Confirm payment received
 */
public confirmPayment = async (
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { exportId } = req.params;
    const { paymentMethod, amount } = req.body;
    
    const contract = this.fabricGateway.getExportContract();
    const exportService = createExportService(contract);
    
    await exportService.confirmPayment(exportId, paymentMethod, amount);
    
    res.json({ success: true, message: 'Payment confirmed' });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to confirm payment', 
      error: error.message 
    });
  }
};
```

## 🔗 Routes to Add

Add these routes to the commercialbank export routes file:

```typescript
// Get pending banking approvals
router.get('/exports/pending/banking', authenticate, exportController.getPendingBankingApprovals);

// Approve banking
router.post('/exports/:exportId/banking/approve', authenticate, exportController.approveBanking);

// Reject banking
router.post('/exports/:exportId/banking/reject', authenticate, exportController.rejectBanking);

// Confirm payment
router.post('/exports/:exportId/payment/confirm', authenticate, exportController.confirmPayment);
```

## 📊 API Examples

### Get Pending Banking Approvals
```bash
GET /api/exports/pending/banking
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### Approve Banking
```bash
POST /api/exports/EXP-123/banking/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "bankingApprovalID": "BANK-2024-001",
  "documentCIDs": ["QmXxx...", "QmYyy..."]
}

Response:
{
  "success": true,
  "message": "Banking approved successfully"
}
```

### Reject Banking
```bash
POST /api/exports/EXP-123/banking/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Missing required documents"
}

Response:
{
  "success": true,
  "message": "Banking rejected"
}
```

### Confirm Payment
```bash
POST /api/exports/EXP-123/payment/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "LC",
  "amount": 50000
}

Response:
{
  "success": true,
  "message": "Payment confirmed"
}
```

---

**Status**: Ready to integrate into existing commercialbank controller
