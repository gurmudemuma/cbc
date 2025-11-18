# Forms and Workflow Tracking Analysis

## Overview

This document analyzes how activities are tracked, approved/rejected, and resubmitted across the entire coffee export workflow, including the forms and UI components used by each organization.

---

## 📋 Current Form Implementation Status

### ✅ **What EXISTS** (Already Implemented)

#### 1. **Exporter Portal Forms**
**File**: `/frontend/src/pages/ExportManagement.jsx`

**Create Export Form** (Multi-step):
- **Step 1: Exporter Details**
  - Exporter Name
  - Exporter Address
  - Exporter Contact
  - Exporter Email

- **Step 2: Trade Details**
  - Coffee Type
  - Quantity & Unit
  - Unit Price & Currency
  - Destination Country
  - Estimated Value
  - Port of Loading
  - Port of Discharge
  - Incoterms

- **Step 3: Document Upload**
  - Commercial Invoice
  - Packing List
  - Certificate of Origin
  - Bill of Lading
  - Phytosanitary Certificate
  - Quality Report
  - Export License

**Features**:
- ✅ Multi-step wizard with validation
- ✅ Document upload functionality
- ✅ Form validation per step
- ✅ Progress tracking

#### 2. **Workflow Manager**
**File**: `/frontend/src/utils/workflowManager.js`

**Capabilities**:
- ✅ Workflow state definitions (DRAFT → COMPLETED)
- ✅ State transition rules
- ✅ Rejection state detection (`isRejectionState()`)
- ✅ Resubmission capability check (`canResubmit()`)
- ✅ Role-based action permissions (`canPerformAction()`)
- ✅ Progress percentage calculation
- ✅ Status color coding

#### 3. **Export Details Page**
**File**: `/frontend/src/pages/ExportDetails.jsx`

**Features**:
- ✅ View export details
- ✅ View history/audit trail
- ✅ Status display with icons
- ✅ Complete/Cancel actions

#### 4. **Organization-Specific Pages**
- ✅ `QualityCertification.jsx` - ECTA quality approval
- ✅ `CustomsClearance.jsx` - Customs approval
- ✅ `FXRates.jsx` - NBE FX approval

---

## ❌ **What's MISSING** (Needs Implementation)

### 1. **Exporter Submission Buttons** 🔴 CRITICAL

**Current Issue**: Exporter can create exports but has no UI buttons to submit to next stage.

**What's Needed**:
```jsx
// In ExportDetails.jsx or ExportManagement.jsx
const SubmissionActions = ({ export, onSubmit }) => {
  const { status } = export;
  
  return (
    <>
      {status === 'DRAFT' && (
        <Button onClick={() => onSubmit('submit-to-ecx')}>
          Submit to ECX for Verification
        </Button>
      )}
      
      {status === 'ECX_VERIFIED' && (
        <Button onClick={() => onSubmit('submit-to-ecta')}>
          Submit to ECTA for License Approval
        </Button>
      )}
      
      {status === 'ECTA_CONTRACT_APPROVED' && (
        <Button onClick={() => onSubmit('submit-to-bank')}>
          Submit to Commercial Bank
        </Button>
      )}
    </>
  );
};
```

### 2. **Document Checklist Display** 🔴 CRITICAL

**Current Issue**: No visual checklist showing which documents are uploaded/verified.

**What's Needed**:
```jsx
// DocumentChecklist.jsx
const DocumentChecklist = ({ exportId }) => {
  const [checklist, setChecklist] = useState(null);
  
  useEffect(() => {
    // Call GET /api/exports/:id/documents
    apiClient.get(`/exports/${exportId}/documents`)
      .then(res => setChecklist(res.data.data));
  }, [exportId]);
  
  return (
    <Card>
      <CardHeader title="Document Checklist" />
      <List>
        {Object.entries(checklist?.checklist || {}).map(([docName, status]) => (
          <ListItem key={docName}>
            <ListItemIcon>
              {status.uploaded ? <CheckCircle color="success" /> : <XCircle color="error" />}
            </ListItemIcon>
            <ListItemText 
              primary={formatDocName(docName)}
              secondary={
                status.verified 
                  ? `Verified by ${status.verifiedBy} on ${status.verifiedAt}`
                  : status.uploaded 
                    ? 'Uploaded, pending verification'
                    : 'Not uploaded'
              }
            />
            {status.required && !status.uploaded && (
              <Chip label="Required" color="error" size="small" />
            )}
          </ListItem>
        ))}
      </List>
      <CardContent>
        <LinearProgress 
          variant="determinate" 
          value={checklist?.completionPercentage || 0} 
        />
        <Typography variant="caption">
          {checklist?.completionPercentage || 0}% Complete
        </Typography>
      </CardContent>
    </Card>
  );
};
```

### 3. **Rejection Handling Form** 🔴 CRITICAL

**Current Issue**: When export is rejected, exporter has no clear form to fix issues and resubmit.

**What's Needed**:
```jsx
// RejectionHandler.jsx
const RejectionHandler = ({ export, onResubmit }) => {
  const { status, rejectionReason } = export;
  
  if (!isRejectionState(status)) return null;
  
  return (
    <Alert severity="error">
      <AlertTitle>Export Rejected at {getRejectionStageLabel(status)}</AlertTitle>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <strong>Reason:</strong> {rejectionReason}
      </Typography>
      
      {canResubmit(status) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Required Actions:</strong>
          </Typography>
          <List dense>
            {getRequiredActions(status).map((action, idx) => (
              <ListItem key={idx}>
                <ListItemIcon><ArrowRight size={16} /></ListItemIcon>
                <ListItemText primary={action} />
              </ListItem>
            ))}
          </List>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={onResubmit}
            sx={{ mt: 2 }}
          >
            Update & Resubmit
          </Button>
        </Box>
      )}
    </Alert>
  );
};
```

### 4. **Approval/Rejection Forms for Each Organization** ⚠️ IMPORTANT

**Current Status**: Some exist, but need standardization.

**What's Needed for Each Organization**:

#### **ECX Approval Form**
```jsx
// ECXApprovalForm.jsx
const ECXApprovalForm = ({ export, onApprove, onReject }) => {
  const [lotNumber, setLotNumber] = useState('');
  const [warehouseReceipt, setWarehouseReceipt] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  return (
    <Card>
      <CardHeader title="ECX Lot Verification" />
      <CardContent>
        <TextField
          label="ECX Lot Number"
          value={lotNumber}
          onChange={(e) => setLotNumber(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Warehouse Receipt Number"
          value={warehouseReceipt}
          onChange={(e) => setWarehouseReceipt(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Warehouse Location"
          value={warehouseLocation}
          onChange={(e) => setWarehouseLocation(e.target.value)}
          required
          fullWidth
        />
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => onApprove({ lotNumber, warehouseReceipt, warehouseLocation })}
        >
          Approve Lot
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => setShowRejectDialog(true)}
        >
          Reject
        </Button>
      </CardActions>
    </Card>
  );
};
```

#### **ECTA License Approval Form**
```jsx
// ECTALicenseForm.jsx
const ECTALicenseForm = ({ export, onApprove, onReject }) => {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  
  return (
    <Card>
      <CardHeader title="ECTA License Approval" />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Export License: {export.exportLicenseNumber}
        </Typography>
        <TextField
          label="Validated License Number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          fullWidth
        />
        <TextField
          label="License Expiry Date"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => onApprove({ licenseNumber, expiryDate, notes })}
        >
          Approve License
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => setShowRejectDialog(true)}
        >
          Reject License
        </Button>
      </CardActions>
    </Card>
  );
};
```

#### **ECTA Quality Certification Form**
```jsx
// ECTAQualityForm.jsx
const ECTAQualityForm = ({ export, onApprove, onReject }) => {
  const [qualityGrade, setQualityGrade] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [documents, setDocuments] = useState([]);
  
  return (
    <Card>
      <CardHeader title="ECTA Quality Certification" />
      <CardContent>
        <Select
          label="Quality Grade"
          value={qualityGrade}
          onChange={(e) => setQualityGrade(e.target.value)}
          fullWidth
        >
          <MenuItem value="Grade 1">Grade 1 (Specialty)</MenuItem>
          <MenuItem value="Grade 2">Grade 2 (Premium)</MenuItem>
          <MenuItem value="Grade 3">Grade 3 (Exchange)</MenuItem>
          <MenuItem value="Grade 4">Grade 4 (Standard)</MenuItem>
          <MenuItem value="Grade 5">Grade 5 (Below Standard)</MenuItem>
        </Select>
        <TextField
          label="Quality Certificate Number"
          value={certNumber}
          onChange={(e) => setCertNumber(e.target.value)}
          fullWidth
        />
        <TextField
          label="Inspection Notes"
          value={inspectionNotes}
          onChange={(e) => setInspectionNotes(e.target.value)}
          multiline
          rows={4}
          fullWidth
        />
        <Button
          variant="outlined"
          component="label"
          startIcon={<Upload />}
        >
          Upload Quality Certificate
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => onApprove({ qualityGrade, certNumber, inspectionNotes, documents })}
        >
          Issue Quality Certificate
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => setShowRejectDialog(true)}
        >
          Reject Quality
        </Button>
      </CardActions>
    </Card>
  );
};
```

#### **ECTA Contract Approval Form**
```jsx
// ECTAContractForm.jsx
const ECTAContractForm = ({ export, onApprove, onReject }) => {
  const [contractNumber, setContractNumber] = useState('');
  const [originCertNumber, setOriginCertNumber] = useState('');
  const [buyerVerified, setBuyerVerified] = useState(false);
  
  return (
    <Card>
      <CardHeader title="ECTA Contract Approval & Origin Certificate" />
      <CardContent>
        <TextField
          label="Contract Number"
          value={contractNumber}
          onChange={(e) => setContractNumber(e.target.value)}
          fullWidth
        />
        <TextField
          label="Certificate of Origin Number"
          value={originCertNumber}
          onChange={(e) => setOriginCertNumber(e.target.value)}
          fullWidth
        />
        <FormControlLabel
          control={
            <Checkbox 
              checked={buyerVerified}
              onChange={(e) => setBuyerVerified(e.target.checked)}
            />
          }
          label="Buyer information verified"
        />
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => onApprove({ contractNumber, originCertNumber })}
        >
          Approve Contract & Issue Origin Certificate
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => setShowRejectDialog(true)}
        >
          Reject Contract
        </Button>
      </CardActions>
    </Card>
  );
};
```

#### **Commercial Bank Document Verification Form**
```jsx
// BankDocumentVerificationForm.jsx
const BankDocumentVerificationForm = ({ export, onApprove, onReject }) => {
  const [checkedDocuments, setCheckedDocuments] = useState({
    ectaLicense: false,
    qualityCert: false,
    originCert: false,
    contract: false,
    invoice: false,
  });
  
  const allDocsChecked = Object.values(checkedDocuments).every(v => v);
  
  return (
    <Card>
      <CardHeader title="Bank Document Verification" />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Verify all required documents before approval:
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={checkedDocuments.ectaLicense} />}
            label="ECTA Export License"
            onChange={(e) => setCheckedDocuments({...checkedDocuments, ectaLicense: e.target.checked})}
          />
          <FormControlLabel
            control={<Checkbox checked={checkedDocuments.qualityCert} />}
            label="Quality Certificate"
            onChange={(e) => setCheckedDocuments({...checkedDocuments, qualityCert: e.target.checked})}
          />
          <FormControlLabel
            control={<Checkbox checked={checkedDocuments.originCert} />}
            label="Certificate of Origin"
            onChange={(e) => setCheckedDocuments({...checkedDocuments, originCert: e.target.checked})}
          />
          <FormControlLabel
            control={<Checkbox checked={checkedDocuments.contract} />}
            label="Export Contract"
            onChange={(e) => setCheckedDocuments({...checkedDocuments, contract: e.target.checked})}
          />
          <FormControlLabel
            control={<Checkbox checked={checkedDocuments.invoice} />}
            label="Commercial Invoice"
            onChange={(e) => setCheckedDocuments({...checkedDocuments, invoice: e.target.checked})}
          />
        </FormGroup>
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="success"
          disabled={!allDocsChecked}
          onClick={() => onApprove()}
        >
          Approve Documents & Submit to NBE
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => setShowRejectDialog(true)}
        >
          Reject Documents
        </Button>
      </CardActions>
    </Card>
  );
};
```

#### **NBE FX Approval Form**
```jsx
// NBEFXApprovalForm.jsx
const NBEFXApprovalForm = ({ export, onApprove, onReject }) => {
  const [fxAmount, setFxAmount] = useState('');
  const [fxRate, setFxRate] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  
  return (
    <Card>
      <CardHeader title="NBE Foreign Exchange Approval" />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Export Value: ${export.estimatedValue}
        </Typography>
        <TextField
          label="Approved FX Amount (USD)"
          type="number"
          value={fxAmount}
          onChange={(e) => setFxAmount(e.target.value)}
          fullWidth
        />
        <TextField
          label="FX Rate (ETB/USD)"
          type="number"
          value={fxRate}
          onChange={(e) => setFxRate(e.target.value)}
          fullWidth
        />
        <TextField
          label="Approval Notes"
          value={approvalNotes}
          onChange={(e) => setApprovalNotes(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => onApprove({ fxAmount, fxRate, approvalNotes })}
        >
          Approve FX Allocation
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => setShowRejectDialog(true)}
        >
          Reject FX Application
        </Button>
      </CardActions>
    </Card>
  );
};
```

#### **Customs Clearance Form**
```jsx
// CustomsClearanceForm.jsx
const CustomsClearanceForm = ({ export, onApprove, onReject }) => {
  const [declarationNumber, setDeclarationNumber] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [clearanceDocuments, setClearanceDocuments] = useState([]);
  
  return (
    <Card>
      <CardHeader title="Customs Clearance" />
      <CardContent>
        <TextField
          label="Customs Declaration Number"
          value={declarationNumber}
          onChange={(e) => setDeclarationNumber(e.target.value)}
          fullWidth
        />
        <TextField
          label="Inspection Notes"
          value={inspectionNotes}
          onChange={(e) => setInspectionNotes(e.target.value)}
          multiline
          rows={4}
          fullWidth
        />
        <Button
          variant="outlined"
          component="label"
          startIcon={<Upload />}
        >
          Upload Clearance Documents
          <input type="file" hidden multiple onChange={handleFileUpload} />
        </Button>
      </CardContent>
      <CardActions>
        <Button 
          variant="contained" 
          color="success"
          onClick={() => onApprove({ declarationNumber, inspectionNotes, clearanceDocuments })}
        >
          Issue Customs Clearance
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => setShowRejectDialog(true)}
        >
          Reject at Customs
        </Button>
      </CardActions>
    </Card>
  );
};
```

### 5. **Rejection Dialog** (Reusable Component) 🔴 CRITICAL

```jsx
// RejectionDialog.jsx
const RejectionDialog = ({ open, onClose, onReject, stageName }) => {
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  
  const rejectionCategories = {
    ECX: ['Invalid Lot Number', 'Warehouse Receipt Mismatch', 'Quality Issues', 'Other'],
    ECTA_LICENSE: ['Expired License', 'Invalid Credentials', 'Missing Information', 'Other'],
    ECTA_QUALITY: ['Below Standard Quality', 'Contamination', 'Moisture Content', 'Other'],
    ECTA_CONTRACT: ['Invalid Buyer', 'Payment Terms Issue', 'Contract Discrepancy', 'Other'],
    BANK: ['Missing Documents', 'Document Mismatch', 'Invalid Signatures', 'Other'],
    NBE: ['Insufficient FX', 'Invalid Documentation', 'Compliance Issue', 'Other'],
    CUSTOMS: ['Declaration Error', 'Prohibited Items', 'Tax Issues', 'Other'],
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reject Export at {stageName}</DialogTitle>
      <DialogContent>
        <Select
          label="Rejection Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          {rejectionCategories[stageName]?.map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
        <TextField
          label="Detailed Reason for Rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={4}
          fullWidth
          required
          placeholder="Provide specific details about why this export is being rejected..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={() => onReject({ category, reason })}
          disabled={!reason || !category}
        >
          Confirm Rejection
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### 6. **Workflow Progress Tracker** ⚠️ IMPORTANT

```jsx
// WorkflowProgressTracker.jsx
const WorkflowProgressTracker = ({ export }) => {
  const stages = [
    { name: 'Created', status: 'DRAFT', org: 'Exporter' },
    { name: 'ECX Verified', status: 'ECX_VERIFIED', org: 'ECX' },
    { name: 'ECTA License', status: 'ECTA_LICENSE_APPROVED', org: 'ECTA' },
    { name: 'ECTA Quality', status: 'ECTA_QUALITY_APPROVED', org: 'ECTA' },
    { name: 'ECTA Contract', status: 'ECTA_CONTRACT_APPROVED', org: 'ECTA' },
    { name: 'Bank Verified', status: 'BANK_DOCUMENT_VERIFIED', org: 'Bank' },
    { name: 'NBE FX Approved', status: 'FX_APPROVED', org: 'NBE' },
    { name: 'Customs Cleared', status: 'CUSTOMS_CLEARED', org: 'Customs' },
    { name: 'Shipped', status: 'SHIPPED', org: 'Shipping' },
    { name: 'Completed', status: 'COMPLETED', org: 'System' },
  ];
  
  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.status === export.status);
  };
  
  return (
    <Stepper activeStep={getCurrentStageIndex()} orientation="vertical">
      {stages.map((stage, index) => (
        <Step key={stage.name}>
          <StepLabel
            optional={<Typography variant="caption">{stage.org}</Typography>}
            error={export.status.includes('REJECTED') && index === getCurrentStageIndex()}
          >
            {stage.name}
          </StepLabel>
          <StepContent>
            <Typography variant="body2">
              {index < getCurrentStageIndex() && '✓ Completed'}
              {index === getCurrentStageIndex() && 'In Progress'}
              {index > getCurrentStageIndex() && 'Pending'}
            </Typography>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );
};
```

---

## 📊 Activity Tracking Implementation

### **Current Tracking Mechanisms**

#### 1. **Blockchain Audit Trail** ✅
**Location**: Chaincode automatically logs all transactions

**What's Tracked**:
- Transaction ID
- Timestamp
- Actor (who performed the action)
- Action type (create, approve, reject, update)
- Previous state
- New state
- Changes made

**Access**: `GET /api/exports/:id/history`

#### 2. **Status Tracking** ✅
**Location**: `exportService.ts` and `workflowManager.js`

**What's Tracked**:
- Current status
- Status timestamps
- Approver IDs
- Rejection reasons

#### 3. **Document Tracking** ✅ (NEW)
**Location**: `documentTracking.service.ts`

**What's Tracked**:
- Upload status
- Verification status
- Verifier identity
- Verification timestamp
- Document CID (IPFS hash)

---

## 🔄 Resubmission Workflow

### **How Resubmission Should Work**

```
1. Export gets REJECTED
   ↓
2. Exporter sees rejection alert with:
   - Rejection reason
   - Stage where rejected
   - Required actions to fix
   ↓
3. Exporter updates export:
   - Fixes issues mentioned in rejection
   - Uploads missing/corrected documents
   - Updates form fields
   ↓
4. Exporter clicks "Resubmit"
   ↓
5. System validates:
   - All required documents uploaded
   - All required fields filled
   - Issues addressed
   ↓
6. Status changes back to appropriate PENDING state
   ↓
7. Organization reviews again
```

### **Resubmission States**

| Rejected At | Resubmit To | New Status |
|-------------|-------------|------------|
| ECX_REJECTED | ECX | ECX_PENDING |
| ECTA_LICENSE_REJECTED | ECTA | ECTA_LICENSE_PENDING |
| ECTA_QUALITY_REJECTED | ECTA | ECTA_QUALITY_PENDING |
| ECTA_CONTRACT_REJECTED | ECTA | ECTA_CONTRACT_PENDING |
| BANK_DOCUMENT_REJECTED | Bank | BANK_DOCUMENT_PENDING |
| FX_REJECTED | NBE | FX_APPLICATION_PENDING |
| CUSTOMS_REJECTED | Customs | CUSTOMS_PENDING |

---

## 📝 Summary

### **What EXISTS** ✅
1. Export creation form (multi-step)
2. Document upload functionality
3. Workflow state management
4. Rejection state detection
5. Resubmission capability logic
6. History/audit trail
7. Some organization-specific approval pages

### **What's MISSING** 🔴
1. **Exporter submission buttons** (Submit to ECX, ECTA, Bank)
2. **Document checklist display** (visual tracking of uploaded docs)
3. **Rejection handling UI** (clear display of rejection reasons + resubmit button)
4. **Standardized approval/rejection forms** for each organization
5. **Reusable rejection dialog** component
6. **Visual workflow progress tracker**

### **Priority Implementation Order**
1. 🔴 **Exporter submission buttons** - Critical for workflow
2. 🔴 **Document checklist display** - Critical for tracking
3. 🔴 **Rejection handling UI** - Critical for resubmission
4. ⚠️ **Organization approval forms** - Important for consistency
5. ⚠️ **Workflow progress tracker** - Important for UX

---

## 🎯 Next Steps

Would you like me to implement any of these missing components? I can create:
1. Submission buttons component
2. Document checklist component
3. Rejection handler component
4. Any organization-specific approval form
5. Workflow progress tracker

Let me know which one(s) you'd like me to build first!
