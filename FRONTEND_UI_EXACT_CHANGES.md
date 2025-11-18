# Frontend UI - Exact Changes Needed

**Status:** Code locations identified  
**Action:** Add ECX fields to existing forms  
**Time:** 2-3 hours of work

---

## File 1: ExportManagement.jsx

**Location:** `/home/gu-da/cbc/frontend/src/pages/ExportManagement.jsx`  
**Lines:** 1708 total  
**Form starts:** Line ~1111

### Change 1: Update State (Line ~174)

**Find this:**
```javascript
const [newExportData, setNewExportData] = useState({
  // Exporter Details
  exporterName: '',
  exporterAddress: '',
  exporterContact: '',
  exporterEmail: '',
  // Trade Details
  coffeeType: '',
  quantity: '',
  unitPrice: '',
  destinationCountry: '',
  estimatedValue: '',
  portOfLoading: '',
  portOfDischarge: '',
});
```

**Add these 4 fields:**
```javascript
const [newExportData, setNewExportData] = useState({
  // Exporter Details
  exporterName: '',
  exporterAddress: '',
  exporterContact: '',
  exporterEmail: '',
  // Trade Details
  coffeeType: '',
  quantity: '',
  unitPrice: '',
  destinationCountry: '',
  estimatedValue: '',
  portOfLoading: '',
  portOfDischarge: '',
  // ECX FIELDS - NEW
  ecxLotNumber: '',              // Required
  warehouseReceiptNumber: '',    // Required
  warehouseLocation: '',         // Optional
  exporterTIN: '',               // Required
});
```

---

### Change 2: Add ECX Step to Stepper (After Line ~1180)

**After the "Trade Details" step, add new step:**

```jsx
{/* NEW STEP 2: ECX Information */}
<Step>
  <StepLabel>ECX Information</StepLabel>
  <StepContent>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Ethiopian Commodity Exchange verification details
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="ECX Lot Number"
          value={newExportData.ecxLotNumber}
          onChange={(e) =>
            setNewExportData({ ...newExportData, ecxLotNumber: e.target.value })
          }
          placeholder="e.g., LOT-2024-001"
          required
          helperText="Enter the ECX lot number from warehouse receipt"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Warehouse Receipt Number"
          value={newExportData.warehouseReceiptNumber}
          onChange={(e) =>
            setNewExportData({ ...newExportData, warehouseReceiptNumber: e.target.value })
          }
          placeholder="e.g., WR-2024-001"
          required
          helperText="Official warehouse receipt number"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Warehouse Location"
          value={newExportData.warehouseLocation}
          onChange={(e) =>
            setNewExportData({ ...newExportData, warehouseLocation: e.target.value })
          }
          placeholder="e.g., Addis Ababa Central Warehouse"
          helperText="Optional: Warehouse location"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Exporter TIN"
          value={newExportData.exporterTIN}
          onChange={(e) =>
            setNewExportData({ ...newExportData, exporterTIN: e.target.value })
          }
          placeholder="e.g., TIN123456789"
          required
          helperText="Tax Identification Number"
        />
      </Grid>
    </Grid>
    <Box sx={{ mt: 2 }}>
      <Button onClick={handleBack} sx={{ mr: 1 }}>
        Back
      </Button>
      <Button
        variant="contained"
        onClick={handleNext}
        disabled={!isStepValid(activeStep)}
      >
        Continue
      </Button>
    </Box>
  </StepContent>
</Step>
```

---

### Change 3: Update Validation (Line ~467)

**Find the `isStepValid` function and add:**

```javascript
const isStepValid = (step) => {
  switch (step) {
    case 0: // Exporter Details
      return (
        newExportData.exporterName &&
        newExportData.exporterAddress &&
        newExportData.exporterContact &&
        newExportData.exporterEmail
      );
    case 1: // Trade Details
      return (
        newExportData.coffeeType &&
        newExportData.quantity &&
        newExportData.unitPrice &&
        newExportData.destinationCountry &&
        newExportData.estimatedValue &&
        newExportData.portOfLoading &&
        newExportData.portOfDischarge
      );
    case 2: // ECX Information - NEW
      return (
        newExportData.ecxLotNumber &&
        newExportData.warehouseReceiptNumber &&
        newExportData.exporterTIN
      );
    case 3: // Documents (was case 2)
      return (
        uploadedDocuments.commercialInvoice &&
        uploadedDocuments.packingList &&
        uploadedDocuments.qualityReport &&
        uploadedDocuments.exportLicense
      );
    default:
      return false;
  }
};
```

---

### Change 4: Update API Call (Line ~400)

**Find `handleCreateExport` function and update:**

```javascript
const handleCreateExport = async () => {
  try {
    // UPDATED: Submit to ECX API instead of NBE
    const response = await apiClient.post('http://localhost:3006/api/ecx/create-export', {
      exporterName: newExportData.exporterName,
      coffeeType: newExportData.coffeeType,
      quantity: parseFloat(newExportData.quantity),
      destinationCountry: newExportData.destinationCountry,
      estimatedValue: parseFloat(newExportData.estimatedValue),
      // NEW ECX FIELDS
      ecxLotNumber: newExportData.ecxLotNumber,
      warehouseReceiptNumber: newExportData.warehouseReceiptNumber,
      warehouseLocation: newExportData.warehouseLocation,
      exporterTIN: newExportData.exporterTIN,
    });

    const exportId = response.data.data.exportId;
    
    // ... rest of the function
  } catch (error) {
    console.error('Error creating export:', error);
    alert('Failed to create export via ECX: ' + (error.response?.data?.message || error.message));
  }
};
```

---

## File 2: ExportDetails.jsx

**Location:** `/home/gu-da/cbc/frontend/src/pages/ExportDetails.jsx`  
**Action:** Add ECX and ECTA display sections

### Add After Export Information Card:

```jsx
{/* ECX Verification Section - NEW */}
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CheckCircle size={20} />
      ECX Verification
    </Typography>
    <Divider sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          ECX Lot Number
        </Typography>
        <Typography variant="body1" fontWeight="medium">
          {exportData.ecxLotNumber || 'N/A'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          Warehouse Receipt
        </Typography>
        <Typography variant="body1" fontWeight="medium">
          {exportData.warehouseReceiptNumber || 'N/A'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          Warehouse Location
        </Typography>
        <Typography variant="body1">
          {exportData.warehouseLocation || 'N/A'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" color="text.secondary">
          Verification Status
        </Typography>
        <Chip
          label={exportData.ecxVerified ? 'Verified' : 'Pending'}
          color={exportData.ecxVerified ? 'success' : 'warning'}
          size="small"
        />
      </Grid>
      {exportData.ecxVerifiedAt && (
        <Grid item xs={12} md={6}>
          <Typography variant="body2" color="text.secondary">
            Verified Date
          </Typography>
          <Typography variant="body1">
            {new Date(exportData.ecxVerifiedAt).toLocaleString()}
          </Typography>
        </Grid>
      )}
    </Grid>
  </CardContent>
</Card>

{/* ECTA Regulation Section - NEW */}
<Card sx={{ mb: 3 }}>
  <CardContent>
    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ShieldCheck size={20} />
      ECTA Regulation (3-Step Process)
    </Typography>
    <Divider sx={{ mb: 2 }} />
    
    {/* Step 1: License Validation */}
    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
        1. Export License Validation
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Chip
          label={exportData.ectaLicenseApproved ? 'Approved' : 'Pending'}
          color={exportData.ectaLicenseApproved ? 'success' : 'warning'}
          size="small"
        />
        {exportData.ectaLicenseApprovedAt && (
          <Typography variant="caption" color="text.secondary">
            {new Date(exportData.ectaLicenseApprovedAt).toLocaleDateString()}
          </Typography>
        )}
      </Stack>
    </Box>
    
    {/* Step 2: Quality Certification */}
    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
        2. Quality Certification
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Chip
          label={exportData.qualityGrade || 'Pending'}
          color={exportData.qualityCertified ? 'success' : 'warning'}
          size="small"
        />
        {exportData.qualityCertifiedAt && (
          <Typography variant="caption" color="text.secondary">
            {new Date(exportData.qualityCertifiedAt).toLocaleDateString()}
          </Typography>
        )}
      </Stack>
    </Box>
    
    {/* Step 3: Contract Approval */}
    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
        3. Contract Approval
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Chip
          label={exportData.contractApproved ? 'Approved' : 'Pending'}
          color={exportData.contractApproved ? 'success' : 'warning'}
          size="small"
        />
        {exportData.contractApprovedAt && (
          <Typography variant="caption" color="text.secondary">
            {new Date(exportData.contractApprovedAt).toLocaleDateString()}
          </Typography>
        )}
      </Stack>
    </Box>
  </CardContent>
</Card>
```

---

## File 3: Dashboard.jsx

**Location:** `/home/gu-da/cbc/frontend/src/pages/Dashboard.jsx`  
**Action:** Update statistics cards

### Update Stats Section (Find the stats cards):

```jsx
{/* Update statistics to show new workflow */}
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {stats.ecxPending || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending ECX Verification
            </Typography>
          </Box>
          <CheckCircle size={40} color="#1976d2" />
        </Stack>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {stats.ectaPending || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              At ECTA
            </Typography>
          </Box>
          <ShieldCheck size={40} color="#9c27b0" />
        </Stack>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {stats.fxPending || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Awaiting FX Approval
            </Typography>
          </Box>
          <DollarSign size={40} color="#ed6c02" />
        </Stack>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {stats.shipped || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Transit
            </Typography>
          </Box>
          <Ship size={40} color="#2e7d32" />
        </Stack>
      </CardContent>
    </Card>
  </Grid>
</Grid>
```

---

## Summary

### Total Changes: 3 Files

1. **ExportManagement.jsx** - 4 changes
   - Add 4 ECX fields to state
   - Add ECX step to stepper
   - Update validation
   - Update API endpoint

2. **ExportDetails.jsx** - 2 additions
   - Add ECX verification section
   - Add ECTA 3-step section

3. **Dashboard.jsx** - 1 update
   - Update statistics cards

### Estimated Time
- ExportManagement: 1-2 hours
- ExportDetails: 30 minutes
- Dashboard: 30 minutes
- **Total: 2-3 hours**

### Testing
- [ ] Form validation works
- [ ] ECX fields are required
- [ ] Form submits to Port 3006
- [ ] Detail page displays ECX info
- [ ] Detail page shows ECTA 3-step
- [ ] Dashboard shows correct stats

---

**Status:** Ready to implement  
**Complexity:** LOW  
**All code provided above - just copy and paste!**
