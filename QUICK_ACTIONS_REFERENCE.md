# Quick Actions Reference Guide

## 📋 Complete Quick Actions Map

This document provides a quick reference for all quick action buttons in the system and their navigation targets.

---

## 🎯 Quick Actions by Organization

### 1. Exporter Portal (Commercial Bank - Exporter Role)

**Location:** ExportManagement page - Quick Actions sidebar

| Button | Action | Target | Status |
|--------|--------|--------|--------|
| Create Export Request | Opens modal | Modal dialog | ✅ Working |
| View My Exports | Filter view | setView('all') | ✅ Working |
| Generate Report | Navigate | `/reports` | ✅ Working |

---

### 2. Commercial Bank (Banker Role)

**Location:** ExportManagement page - Quick Actions sidebar

| Button | Action | Target | Status |
|--------|--------|--------|--------|
| Pending Documents | Filter view | setView('pending') | ✅ Working |
| Approved Documents | Filter view | setView('approved') | ✅ Working |
| Banking Reports | Navigate | `/reports` | ✅ Working |

---

### 3. National Bank (Governor Role)

**Location:** ExportManagement page - Quick Actions sidebar

| Button | Action | Target | Status |
|--------|--------|--------|--------|
| View Pending FX Approvals | Filter view | setView('fx') | ✅ Working |
| Approved Exports | Filter view | setView('fx_approved') | ✅ Working |
| Generate Compliance Report | Navigate | `/reports` | ✅ Working |

---

### 4. ECTA (Inspector Role)

**Location:** ExportManagement page - Quick Actions sidebar

| Button | Action | Target | Status |
|--------|--------|--------|--------|
| Pending Certifications | Filter view | setView('quality') | ✅ Working |
| Certified Exports | Filter view | setView('quality_certified') | ✅ Working |
| Quality Reports | Navigate | `/reports` | ✅ Working |

---

### 5. Shipping Line (Shipper Role)

**Location:** ExportManagement page - Quick Actions sidebar

| Button | Action | Target | Status |
|--------|--------|--------|--------|
| Schedule New Shipment | Filter view | setView('shipments') | ✅ Working |
| Active Shipments | Filter view | setView('shipments') | ✅ Working |
| Shipping History | Filter view | setView('shipped') | ✅ Working |

---

### 6. Customs (Officer Role)

**Location:** ExportManagement page - Quick Actions sidebar

| Button | Action | Target | Status |
|--------|--------|--------|--------|
| Pending Clearances | Filter view | setView('customs') | ✅ Working |
| Cleared Exports | Filter view | setView('customs_cleared') | ✅ Working |
| Inspection Reports | Navigate | `/reports` | ✅ Working |

---

## 📊 Summary Statistics

| Metric | Value |
|--------|-------|
| Total Organizations | 6 |
| Total Quick Actions | 18 |
| Navigation Actions | 5 |
| Filter Actions | 13 |
| Working Actions | 18 (100%) |
| Broken Actions | 0 (0%) |

---

## 🔍 Action Types

### Type 1: Navigation Actions
Navigate to a different page in the application.

**Examples:**
- Generate Report → `/reports`
- Banking Reports → `/reports`
- Quality Reports → `/reports`

**Implementation:**
```typescript
<Button onClick={() => navigate('/reports')}>
  Generate Report
</Button>
```

### Type 2: Filter Actions
Change the view/filter on the current page.

**Examples:**
- View My Exports → setView('all')
- Pending Documents → setView('pending')
- Approved Exports → setView('fx_approved')

**Implementation:**
```typescript
<Button onClick={() => setView('pending')}>
  Pending Documents
</Button>
```

### Type 3: Modal Actions
Open a dialog or modal for data entry.

**Examples:**
- Create Export Request → Opens modal

**Implementation:**
```typescript
<Button onClick={() => setIsModalOpen(true)}>
  Create Export Request
</Button>
```

---

## 🎯 Reports Page Features

### Available Report Types by Organization

#### Exporter Portal
1. My Export Requests
2. Export Summary
3. Financial Summary

#### Commercial Bank
1. Banking Documents Report
2. Compliance Report
3. Transaction Volume

#### National Bank
1. FX Approval Report
2. Regulatory Compliance
3. Monetary Policy Impact

#### ECTA
1. Quality Certifications
2. License Status Report
3. Contract Approvals

#### Customs
1. Customs Clearance Report
2. Inspection Results
3. Border Activity

#### Shipping Line
1. Shipment Tracking Report
2. Vessel Utilization
3. Logistics Performance

### Date Range Options
- Today
- Last 7 Days
- Last 30 Days
- Last 90 Days
- This Year
- Custom Range

### Export Formats
- PDF
- Excel (XLSX)
- CSV

---

## 🚀 Usage Examples

### Example 1: Exporter Generating Report
```
1. Login as Exporter
2. Navigate to Export Management page
3. Look at Quick Actions sidebar (right side)
4. Click "Generate Report" button
5. Reports page opens
6. Select "My Export Requests" from dropdown
7. Select "Last 30 Days" date range
8. Click "Generate Report" button
9. Report is generated (currently shows alert)
```

### Example 2: Banker Viewing Pending Documents
```
1. Login as Banker (Commercial Bank)
2. Navigate to Export Management page
3. Look at Quick Actions sidebar (right side)
4. Click "Pending Documents" button
5. View changes to show only pending documents
6. Review and approve/reject documents
```

### Example 3: ECTA Inspector Viewing Quality Reports
```
1. Login as ECTA Inspector
2. Navigate to Export Management page
3. Look at Quick Actions sidebar (right side)
4. Click "Quality Reports" button
5. Reports page opens
6. Select "Quality Certifications" from dropdown
7. Select desired date range
8. Click "Generate Report" button
9. Quality certification report is generated
```

---

## 🔧 Developer Notes

### Adding New Quick Actions

To add a new quick action button:

1. **Identify the organization and role**
   ```typescript
   const canDoSomething = orgLower === 'your-org' && userRole === 'your-role';
   ```

2. **Add the quick action in ExportManagement.tsx**
   ```typescript
   {canDoSomething && (
     <>
       <Alert severity="info" sx={{ mb: 1 }}>
         <Typography variant="caption">
           Your action description
         </Typography>
       </Alert>
       <Button variant="contained" fullWidth onClick={() => handleAction()}>
         Your Action Button
       </Button>
     </>
   )}
   ```

3. **Implement the action handler**
   ```typescript
   const handleAction = () => {
     // For navigation
     navigate('/your-route');
     
     // For filtering
     setView('your-filter');
     
     // For modal
     setModalOpen(true);
   };
   ```

4. **Ensure the route exists (if navigation)**
   ```typescript
   // In App.tsx
   { path: 'your-route', element: <YourComponent user={user} org={org} /> }
   ```

---

## ✅ Testing Checklist

When testing quick actions:

- [ ] Button is visible for correct organization/role
- [ ] Button is not visible for other organizations/roles
- [ ] Button click triggers correct action
- [ ] Navigation goes to correct page (if applicable)
- [ ] Filter changes view correctly (if applicable)
- [ ] Modal opens correctly (if applicable)
- [ ] No console errors
- [ ] Responsive on mobile devices
- [ ] Accessible via keyboard
- [ ] Proper loading states

---

## 📚 Related Documentation

- **QUICK_ACTIONS_FIX_COMPLETE.md** - Complete fix report
- **NAVIGATION_FIX_COMPLETE.md** - Navigation system fixes
- **SINGLE_SOURCE_OF_TRUTH_SUMMARY.md** - Route coverage analysis

---

**Last Updated:** January 1, 2026  
**Status:** ✅ All Quick Actions Working  
**Coverage:** 100%
