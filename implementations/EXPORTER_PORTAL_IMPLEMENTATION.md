# Exporter Portal - ECX Integration Implementation

**Priority:** HIGH  
**Estimated Time:** 30 minutes  
**Status:** Ready to implement

---

## Overview

Update Exporter Portal to submit export requests to ECX API (Port 3006) instead of National Bank API (Port 3002).

---

## Changes Required

### 1. Update Environment Variables

**File:** `api/exporter-portal/.env`

```env
# OLD
NATIONAL_BANK_API_URL=http://localhost:3002

# NEW - Add these
ECX_API_URL=http://localhost:3006
ECTA_API_URL=http://localhost:3004
NATIONAL_BANK_API_URL=http://localhost:3002
COMMERCIAL_BANK_API_URL=http://localhost:3001
```

---

### 2. Update Export Service

**File:** `api/exporter-portal/src/services/export.service.ts`

```typescript
import axios from 'axios';

const ECX_API_URL = process.env.ECX_API_URL || 'http://localhost:3006';

export class ExportService {
  /**
   * Create new export request via ECX
   * UPDATED: Now submits to ECX instead of NBE
   */
  async createExport(data: CreateExportDTO): Promise<ExportResponse> {
    try {
      // Validate required ECX fields
      if (!data.ecxLotNumber) {
        throw new Error('ECX lot number is required');
      }
      if (!data.warehouseReceiptNumber) {
        throw new Error('Warehouse receipt number is required');
      }

      // Submit to ECX for verification and blockchain record creation
      const response = await axios.post(
        `${ECX_API_URL}/api/ecx/create-export`,
        {
          exportId: data.exportId,
          exporterBankId: data.exporterBankId,
          exporterName: data.exporterName,
          exporterTIN: data.exporterTIN,
          exportLicenseNumber: data.exportLicenseNumber,
          coffeeType: data.coffeeType,
          quantity: data.quantity,
          destinationCountry: data.destinationCountry,
          estimatedValue: data.estimatedValue,
          ecxLotNumber: data.ecxLotNumber,
          warehouseLocation: data.warehouseLocation,
          warehouseReceiptNumber: data.warehouseReceiptNumber
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      );

      return {
        success: true,
        exportId: data.exportId,
        status: 'ECX_VERIFIED',
        message: 'Export created successfully via ECX',
        data: response.data
      };
    } catch (error) {
      console.error('Error creating export via ECX:', error);
      throw new Error(`Failed to create export: ${error.message}`);
    }
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<ExportStatusResponse> {
    try {
      const response = await axios.get(
        `${ECX_API_URL}/api/ecx/exports/${exportId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching export status:', error);
      throw error;
    }
  }

  private getAuthToken(): string {
    // Get JWT token from session/storage
    return localStorage.getItem('authToken') || '';
  }
}

// TypeScript interfaces
interface CreateExportDTO {
  exportId: string;
  exporterBankId: string;
  exporterName: string;
  exporterTIN: string;
  exportLicenseNumber: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  ecxLotNumber: string;              // NEW - Required
  warehouseLocation: string;          // NEW
  warehouseReceiptNumber: string;     // NEW - Required
}

interface ExportResponse {
  success: boolean;
  exportId: string;
  status: string;
  message: string;
  data?: any;
}

interface ExportStatusResponse {
  exportId: string;
  status: string;
  currentStep: string;
  history: any[];
}
```

---

### 3. Update Export Form Component

**File:** `frontend/src/components/ExportForm.tsx` (or similar)

```typescript
import React, { useState } from 'react';
import { ExportService } from '../services/export.service';

export const ExportForm: React.FC = () => {
  const [formData, setFormData] = useState({
    exportId: '',
    exporterName: '',
    exporterTIN: '',
    exportLicenseNumber: '',
    coffeeType: '',
    quantity: 0,
    destinationCountry: '',
    estimatedValue: 0,
    // NEW REQUIRED FIELDS
    ecxLotNumber: '',
    warehouseReceiptNumber: '',
    warehouseLocation: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const exportService = new ExportService();
      const result = await exportService.createExport(formData);
      
      alert('Export created successfully via ECX!');
      // Redirect to export details page
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Existing fields */}
      <input
        type="text"
        placeholder="Export ID"
        value={formData.exportId}
        onChange={(e) => setFormData({...formData, exportId: e.target.value})}
        required
      />
      
      {/* NEW ECX FIELDS */}
      <div className="ecx-section">
        <h3>ECX Information (Required)</h3>
        
        <input
          type="text"
          placeholder="ECX Lot Number *"
          value={formData.ecxLotNumber}
          onChange={(e) => setFormData({...formData, ecxLotNumber: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Warehouse Receipt Number *"
          value={formData.warehouseReceiptNumber}
          onChange={(e) => setFormData({...formData, warehouseReceiptNumber: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="Warehouse Location"
          value={formData.warehouseLocation}
          onChange={(e) => setFormData({...formData, warehouseLocation: e.target.value})}
        />
      </div>

      <button type="submit">Create Export via ECX</button>
    </form>
  );
};
```

---

### 4. Update Workflow Tracker

**File:** `frontend/src/components/WorkflowTracker.tsx`

```typescript
export const workflowSteps = [
  { id: 1, name: 'Draft', status: 'DRAFT', color: 'gray' },
  { id: 2, name: 'ECX Verification', status: 'ECX_VERIFIED', color: 'blue' },
  { id: 3, name: 'ECTA License', status: 'ECTA_LICENSE_APPROVED', color: 'green' },
  { id: 4, name: 'ECTA Quality', status: 'ECTA_QUALITY_APPROVED', color: 'green' },
  { id: 5, name: 'ECTA Contract', status: 'ECTA_CONTRACT_APPROVED', color: 'green' },
  { id: 6, name: 'Bank Verified', status: 'BANK_DOCUMENT_VERIFIED', color: 'purple' },
  { id: 7, name: 'FX Approved', status: 'FX_APPROVED', color: 'indigo' },
  { id: 8, name: 'Customs Cleared', status: 'CUSTOMS_CLEARED', color: 'yellow' },
  { id: 9, name: 'Shipped', status: 'SHIPPED', color: 'orange' },
  { id: 10, name: 'Delivered', status: 'DELIVERED', color: 'teal' },
  { id: 11, name: 'Payment', status: 'PAYMENT_RECEIVED', color: 'cyan' },
  { id: 12, name: 'Completed', status: 'COMPLETED', color: 'green' }
];

export const WorkflowTracker: React.FC<{ currentStatus: string }> = ({ currentStatus }) => {
  const getCurrentStep = () => {
    return workflowSteps.findIndex(step => step.status === currentStatus);
  };

  const currentStepIndex = getCurrentStep();

  return (
    <div className="workflow-tracker">
      {workflowSteps.map((step, index) => (
        <div
          key={step.id}
          className={`step ${index <= currentStepIndex ? 'completed' : 'pending'}`}
        >
          <div className={`step-indicator bg-${step.color}-500`}>
            {index < currentStepIndex ? '✓' : step.id}
          </div>
          <div className="step-name">{step.name}</div>
        </div>
      ))}
    </div>
  );
};
```

---

## Testing

### Test Export Creation

```bash
curl -X POST http://localhost:3003/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "exportId": "EXP-TEST-001",
    "exporterName": "Test Exporter Ltd",
    "exporterTIN": "TIN123456789",
    "exportLicenseNumber": "LIC-2024-001",
    "coffeeType": "Arabica Grade 2",
    "quantity": 5000,
    "destinationCountry": "United States",
    "estimatedValue": 75000,
    "ecxLotNumber": "LOT-2024-001",
    "warehouseReceiptNumber": "WR-2024-001",
    "warehouseLocation": "Addis Ababa Warehouse"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "exportId": "EXP-TEST-001",
  "status": "ECX_VERIFIED",
  "message": "Export created successfully via ECX"
}
```

---

## Migration Notes

### For Existing Exports
- Old exports in NBE system remain unchanged
- New exports go through ECX
- Gradual migration supported

### Backward Compatibility
- Keep old NBE endpoint active temporarily
- Add feature flag to toggle between old/new flow
- Monitor both systems during transition

---

## Checklist

- [ ] Update environment variables
- [ ] Update export service to call ECX API
- [ ] Add ECX fields to export form
- [ ] Update workflow tracker with new steps
- [ ] Test export creation
- [ ] Test status tracking
- [ ] Update user documentation
- [ ] Train users on new fields

---

**Status:** Ready to implement  
**Priority:** HIGH  
**Dependencies:** ECX API must be running on port 3006
