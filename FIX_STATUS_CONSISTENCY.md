# Fix Export Status Consistency

## Problem Summary

The sidebar activities and "Create & Manage Exports" page show **different statuses** for the same exports, causing confusion.

### Example:
- **Sidebar** shows: "Pending", "Rejected", "Completed"
- **Export Page** shows: "Pending", "FX_APPROVED", "BANKING_PENDING", "QUALITY_CERTIFIED", etc.

## Solution

Standardize both components to use the same **detailed workflow statuses**.

## Files to Update

### 1. Layout.jsx (Sidebar)
**Location:** `/home/gu-da/cbc/frontend/src/components/Layout.jsx`

**Current (commercialbank):**
```javascript
children: [
  { name: 'Pending', path: '/exports', icon: Package, filter: 'pending', badge: 3 },
  { name: 'Rejected', path: '/exports', icon: Package, filter: 'rejected', badge: 1 },
  { name: 'Completed', path: '/exports', icon: Package, filter: 'completed', badge: 0 },
]
```

**Should be:**
```javascript
children: [
  { name: 'Pending', path: '/exports', icon: Package, filter: 'PENDING', badge: 3 },
  { name: 'FX Pending', path: '/exports', icon: Package, filter: 'FX_PENDING', badge: 2 },
  { name: 'FX Approved', path: '/exports', icon: Package, filter: 'FX_APPROVED', badge: 1 },
  { name: 'Rejected', path: '/exports', icon: Package, filter: 'FX_REJECTED', badge: 1 },
  { name: 'Completed', path: '/exports', icon: Package, filter: 'COMPLETED', badge: 0 },
]
```

### 2. ExportManagement.jsx (Status Filter)
**Location:** `/home/gu-da/cbc/frontend/src/pages/ExportManagement.jsx`

**Current:**
```javascript
<Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
  <MenuItem value="all">All Status</MenuItem>
  <MenuItem value="PENDING">Pending</MenuItem>
  <MenuItem value="FX_APPROVED">FX Approved</MenuItem>
  ...
</Select>
```

**Already correct** - No changes needed here

## Status Mapping

### commercialbank
- PENDING → Initial submission
- FX_PENDING → Awaiting FX approval
- FX_APPROVED → FX approved
- FX_REJECTED → FX rejected
- COMPLETED → Completed

### National Bank
- PENDING → Awaiting review
- FX_PENDING → Pending FX approval
- FX_APPROVED → FX approved
- BANKING_PENDING → Awaiting banking approval
- BANKING_APPROVED → Banking approved
- BANKING_REJECTED → Banking rejected

### ECTA
- FX_APPROVED → Ready for certification
- QUALITY_PENDING → Awaiting certification
- QUALITY_CERTIFIED → Quality certified
- QUALITY_REJECTED → Quality rejected

### Custom Authorities
- QUALITY_CERTIFIED → Ready for clearance
- EXPORT_CUSTOMS_PENDING → Awaiting clearance
- EXPORT_CUSTOMS_CLEARED → Customs cleared
- EXPORT_CUSTOMS_REJECTED → Customs rejected

### Shipping Line
- EXPORT_CUSTOMS_CLEARED → Ready for shipment
- SHIPMENT_PENDING → Awaiting scheduling
- SHIPMENT_SCHEDULED → Shipment scheduled
- SHIPMENT_REJECTED → Shipment rejected
- SHIPPED → Shipped

## Implementation Steps

1. **Update Layout.jsx sidebar navigation** to use workflow statuses
2. **Update status filter mapping** in ExportManagement.jsx
3. **Test all organization views** to verify consistency
4. **Verify badge counts** are accurate
5. **Test filtering** works correctly

## Expected Result

After fix:
- ✅ Sidebar shows same statuses as export page
- ✅ Filtering works consistently
- ✅ No confusion about export status
- ✅ Better user experience

## Time to Implement

~30 minutes

## Complexity

Medium - Requires updating navigation structure and filter mappings

---

**Status:** Ready for implementation
