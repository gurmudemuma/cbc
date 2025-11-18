# National Bank (NBE) API - Complete Implementation

**Priority:** HIGH  
**Estimated Time:** 45 minutes  
**Status:** Ready to implement

---

## Overview

Implement NBE API with reduced role - **FX approval ONLY**. Remove record creation functions.

---

## Directory Structure

```
/home/gu-da/cbc/api/banker/
├── src/
│   ├── index.ts (update)
│   ├── controllers/
│   │   └── fx.controller.ts (NEW)
│   ├── routes/
│   │   └── fx.routes.ts (NEW)
│   ├── services/
│   │   └── fabric.service.ts (NEW)
│   └── middleware/
│       └── auth.middleware.ts (NEW)
├── package.json
└── .env
```

---

## 1. Update Package.json

**File:** `api/banker/package.json`

```json
{
  "name": "nbe-api",
  "version": "2.0.0",
  "description": "National Bank of Ethiopia - FX Approval API",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "fabric-network": "^2.2.20",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.2.0",
    "morgan": "^1.10.0",
    "jsonwebtoken": "^9.0.2",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0"
  }
}
```

---

## 2. FX Controller Implementation

**File:** `api/banker/src/controllers/fx.controller.ts`

```typescript
import { Request, Response } from 'express';
import { fabricService } from '../services/fabric.service';
import { logger } from '../utils/logger';

export class FXController {
  /**
   * Approve FX application
   * POST /api/fx/approve/:exportId
   */
  async approveFXApplication(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;
      const { fxAmount, fxRate, fxApprovalCID, approvedBy, notes } = req.body;

      // Validate required fields
      if (!exportId || !fxAmount || !fxApprovalCID) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: exportId, fxAmount, fxApprovalCID'
        });
        return;
      }

      logger.info(`Approving FX for export: ${exportId}`);

      // Get export from blockchain
      const exportData = await fabricService.getExport(exportId);

      // Verify export is in FX_APPLICATION_PENDING status
      if (exportData.status !== 'FX_APPLICATION_PENDING') {
        res.status(400).json({
          success: false,
          error: `Export must be in FX_APPLICATION_PENDING status. Current: ${exportData.status}`,
          currentStatus: exportData.status
        });
        return;
      }

      // Verify prerequisites
      const prerequisites = this.verifyPrerequisites(exportData);
      if (!prerequisites.valid) {
        res.status(400).json({
          success: false,
          error: 'Missing prerequisites',
          missing: prerequisites.missing
        });
        return;
      }

      // Approve FX on blockchain
      const txId = await fabricService.submitTransaction(
        'ApproveFX', // Chaincode function
        exportId,
        fxApprovalCID
      );

      logger.info(`FX approved for export ${exportId}, TxID: ${txId}`);

      res.status(200).json({
        success: true,
        message: 'FX approved successfully',
        exportId,
        status: 'FX_APPROVED',
        fxAmount,
        fxRate,
        approvedBy,
        approvedAt: new Date().toISOString(),
        blockchainTxId: txId
      });
    } catch (error) {
      logger.error('Error approving FX:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Reject FX application
   * POST /api/fx/reject/:exportId
   */
  async rejectFXApplication(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;
      const { reason, rejectedBy } = req.body;

      if (!exportId || !reason) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: exportId, reason'
        });
        return;
      }

      logger.info(`Rejecting FX for export: ${exportId}`);

      const txId = await fabricService.submitTransaction(
        'RejectFX',
        exportId,
        reason,
        rejectedBy || 'NBE Officer'
      );

      logger.info(`FX rejected for export ${exportId}, TxID: ${txId}`);

      res.status(200).json({
        success: true,
        message: 'FX application rejected',
        exportId,
        status: 'FX_REJECTED',
        reason,
        rejectedBy,
        rejectedAt: new Date().toISOString(),
        blockchainTxId: txId
      });
    } catch (error) {
      logger.error('Error rejecting FX:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get pending FX applications
   * GET /api/fx/pending
   */
  async getPendingFXApplications(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Fetching pending FX applications');

      const exports = await fabricService.getExportsByStatus('FX_APPLICATION_PENDING');

      res.status(200).json({
        success: true,
        count: exports.length,
        exports: exports.map(exp => ({
          exportId: exp.exportId,
          exporterName: exp.exporterName,
          estimatedValue: exp.estimatedValue,
          status: exp.status,
          submittedAt: exp.updatedAt
        }))
      });
    } catch (error) {
      logger.error('Error fetching pending FX applications:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get FX compliance report
   * GET /api/fx/compliance-report
   */
  async getComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      logger.info(`Generating FX compliance report: ${startDate} to ${endDate}`);

      // Get all completed exports
      const completedExports = await fabricService.getExportsByStatus('COMPLETED');
      
      // Get exports with FX repatriation
      const repatriatedExports = completedExports.filter(exp => exp.fxRepatriatedDate);
      
      // Get overdue exports (>120 days)
      const overdueExports = completedExports.filter(exp => {
        if (!exp.fxRepatriatedDate && exp.paymentReceivedDate) {
          const daysSincePayment = this.getDaysSince(exp.paymentReceivedDate);
          return daysSincePayment > 120;
        }
        return false;
      });

      res.status(200).json({
        success: true,
        period: { start: startDate, end: endDate },
        summary: {
          totalExports: completedExports.length,
          repatriated: repatriatedExports.length,
          pending: completedExports.length - repatriatedExports.length - overdueExports.length,
          overdue: overdueExports.length,
          complianceRate: `${Math.round((repatriatedExports.length / completedExports.length) * 100)}%`
        },
        overdueExports: overdueExports.map(exp => ({
          exportId: exp.exportId,
          exporterName: exp.exporterName,
          paymentDate: exp.paymentReceivedDate,
          daysOverdue: this.getDaysSince(exp.paymentReceivedDate) - 120,
          amount: exp.estimatedValue
        }))
      });
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify prerequisites for FX approval
   */
  private verifyPrerequisites(exportData: any): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    // Check ECTA approvals
    if (!exportData.exportLicenseValidatedBy) {
      missing.push('ECTA License Validation');
    }
    if (!exportData.qualityCertifiedBy) {
      missing.push('ECTA Quality Certification');
    }
    if (!exportData.contractApprovedBy) {
      missing.push('ECTA Contract Approval');
    }

    // Check bank verification
    if (exportData.status !== 'FX_APPLICATION_PENDING') {
      missing.push('Bank Document Verification');
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Calculate days since a date
   */
  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const fxController = new FXController();
```

---

## 3. Fabric Service

**File:** `api/banker/src/services/fabric.service.ts`

```typescript
import { Gateway, Wallets, Network, Contract } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';

class FabricService {
  private gateway: Gateway | null = null;
  private network: Network | null = null;
  private contract: Contract | null = null;

  async connect(): Promise<void> {
    try {
      const ccpPath = path.resolve(
        __dirname,
        process.env.CONNECTION_PROFILE_PATH || 
        '../../../network/organizations/peerOrganizations/national-bank.coffee-export.com/connection-nbe.json'
      );

      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      const ccp = JSON.parse(ccpJSON);

      const walletPath = path.resolve(__dirname, '../../wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      const identity = await wallet.get('nbeAdmin');
      if (!identity) {
        throw new Error('NBE admin identity not found in wallet');
      }

      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet,
        identity: 'nbeAdmin',
        discovery: { enabled: true, asLocalhost: process.env.NODE_ENV === 'development' }
      });

      this.network = await this.gateway.getNetwork('coffeechannel');
      this.contract = this.network.getContract('coffee-export');

      logger.info('NBE Fabric service connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Fabric network:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.gateway) {
      this.gateway.disconnect();
      logger.info('NBE Fabric service disconnected');
    }
  }

  async submitTransaction(functionName: string, ...args: string[]): Promise<string> {
    if (!this.contract) {
      throw new Error('Fabric service not connected');
    }

    const result = await this.contract.submitTransaction(functionName, ...args);
    return result.toString();
  }

  async getExport(exportId: string): Promise<any> {
    if (!this.contract) {
      throw new Error('Fabric service not connected');
    }

    const result = await this.contract.evaluateTransaction('GetExportRequest', exportId);
    return JSON.parse(result.toString());
  }

  async getExportsByStatus(status: string): Promise<any[]> {
    if (!this.contract) {
      throw new Error('Fabric service not connected');
    }

    const result = await this.contract.evaluateTransaction('GetExportsByStatus', status);
    return JSON.parse(result.toString());
  }

  isConnected(): boolean {
    return this.contract !== null;
  }
}

export const fabricService = new FabricService();
```

---

## 4. Routes

**File:** `api/banker/src/routes/fx.routes.ts`

```typescript
import { Router } from 'express';
import { fxController } from '../controllers/fx.controller';

const router = Router();

// FX approval endpoints
router.post('/approve/:exportId', fxController.approveFXApplication.bind(fxController));
router.post('/reject/:exportId', fxController.rejectFXApplication.bind(fxController));
router.get('/pending', fxController.getPendingFXApplications.bind(fxController));
router.get('/compliance-report', fxController.getComplianceReport.bind(fxController));

export default router;
```

---

## 5. Update Main Server

**File:** `api/banker/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fxRoutes from './routes/fx.routes';
import { fabricService } from './services/fabric.service';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBE API - FX Approval',
    version: '2.0.0',
    fabric: fabricService.isConnected() ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/fx', fxRoutes);

// Start server
async function startServer() {
  try {
    await fabricService.connect();
    logger.info('Connected to Fabric network');

    app.listen(PORT, () => {
      logger.info(`NBE API listening on port ${PORT}`);
      logger.info(`Role: FX Approval Only`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fabricService.disconnect();
  process.exit(0);
});
```

---

## Testing

```bash
# Test FX approval
curl -X POST http://localhost:3002/api/fx/approve/EXP-TEST-001 \
  -H "Content-Type: application/json" \
  -d '{
    "fxAmount": 75000,
    "fxRate": 57.50,
    "fxApprovalCID": "QmXxXxXx...",
    "approvedBy": "NBE Officer 001"
  }'

# Test get pending
curl http://localhost:3002/api/fx/pending

# Test compliance report
curl "http://localhost:3002/api/fx/compliance-report?startDate=2024-01-01&endDate=2024-12-31"
```

---

**Status:** Ready to implement  
**Priority:** HIGH
