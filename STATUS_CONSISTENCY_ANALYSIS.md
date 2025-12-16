# Export Status Consistency Analysis

## Issue Found

The **"Create & Manage Exports"** page and **sidebar activities** have **inconsistent status definitions** for different organizations.

## Current Inconsistencies

### commercialbank (Exporter Portal)

**Sidebar Activities:**
```
- All Exports (filter: 'all')
  - Pending (filter: 'pending', badge: 3)
  - Rejected (filter: 'rejected', badge: 1)
  - Completed (filter: 'completed', badge: 0)
```

**Export Management Page Status Filter:**
```
- All Status
- Pending
- FX_APPROVED
- BANKING_PENDING
- BANKING_APPROVED
- QUALITY_CERTIFIED
- SHIPMENT_SCHEDULED
- SHIPPED
- COMPLETED
```

**Issue:** Sidebar uses simple filters (pending, rejected, completed) but page uses detailed workflow statuses (FX_APPROVED, BANKING_PENDING, etc.)

---

### National Bank (FX Approval)

**Sidebar Activities:**
```
- All Exports (filter: 'all')
  - FX Pending (filter: 'fx', badge: 5)
  - FX Approved (filter: 'fx_approved')
```

**Export Management Page Status Filter:**
```
- All Status
- Pending
- FX_APPROVED
- BANKING_PENDING
- BANKING_APPROVED
- QUALITY_CERTIFIED
- SHIPMENT_SCHEDULED
- SHIPPED
- COMPLETED
```

**Issue:** Sidebar only shows FX-related statuses, but page shows all workflow statuses

---

### ECTA (Quality Certification)

**Sidebar Activities:**
```
- All Exports (filter: 'all')
  - Pending Certification (filter: 'quality', badge: 2)
  - Certified (filter: 'quality_certified')
```

**Export Management Page Status Filter:**
```
- All Status
- Pending
- FX_APPROVED
- BANKING_PENDING
- BANKING_APPROVED
- QUALITY_CERTIFIED
- SHIPMENT_SCHEDULED
- SHIPPED
- COMPLETED
```

**Issue:** Sidebar only shows quality-related statuses, but page shows all workflow statuses

---

### Custom Authorities (Customs Clearance)

**Sidebar Activities:**
```
- All Exports (filter: 'all')
  - Pending Clearance (filter: 'customs', badge: 4)
  - Cleared (filter: 'customs_cleared')
```

**Export Management Page Status Filter:**
```
- All Status
- Pending
- FX_APPROVED
- BANKING_PENDING
- BANKING_APPROVED
- QUALITY_CERTIFIED
- SHIPMENT_SCHEDULED
- SHIPPED
- COMPLETED
```

**Issue:** Sidebar only shows customs-related statuses, but page shows all workflow statuses

---

### Shipping Line (Shipment Management)

**Sidebar Activities:**
```
- All Exports (filter: 'all')
  - Pending Shipments (filter: 'shipments', badge: 3)
  - Scheduled (filter: 'shipments_scheduled')
  - Shipped (filter: 'shipped')
```

**Export Management Page Status Filter:**
```
- All Status
- Pending
- FX_APPROVED
- BANKING_PENDING
- BANKING_APPROVED
- QUALITY_CERTIFIED
- SHIPMENT_SCHEDULED
- SHIPPED
- COMPLETED
```

**Issue:** Sidebar only shows shipment-related statuses, but page shows all workflow statuses

---

## Root Cause

The sidebar uses **simplified filter names** (pending, rejected, completed, fx, quality, customs, shipments) while the ExportManagement page uses **detailed workflow statuses** (PENDING, FX_APPROVED, BANKING_PENDING, etc.).

The mapping between them is:
- `pending` → PENDING, FX_PENDING
- `rejected` → FX_REJECTED, BANKING_REJECTED, QUALITY_REJECTED
- `completed` → COMPLETED
- `fx` → PENDING, FX_PENDING
- `fx_approved` → FX_APPROVED
- `quality` → FX_APPROVED, QUALITY_PENDING
- `quality_certified` → QUALITY_CERTIFIED
- `customs` → QUALITY_CERTIFIED, EXPORT_CUSTOMS_PENDING
- `customs_cleared` → EXPORT_CUSTOMS_CLEARED
- `shipments` → EXPORT_CUSTOMS_CLEARED, SHIPMENT_PENDING
- `shipments_scheduled` → SHIPMENT_SCHEDULED
- `shipped` → SHIPPED

## Recommended Solution

### Option 1: Standardize on Workflow Statuses (Recommended)
Update the sidebar to show the same detailed workflow statuses as the ExportManagement page.

**Advantages:**
- Consistent across the application
- More detailed information
- Better for tracking workflow progress

**Disadvantages:**
- Sidebar becomes more complex
- More menu items

### Option 2: Simplify ExportManagement Page
Update the ExportManagement page to use simplified filters matching the sidebar.

**Advantages:**
- Simpler UI
- Fewer menu items
- Easier to understand

**Disadvantages:**
- Less detailed information
- May hide important workflow states

### Option 3: Hybrid Approach
Keep sidebar simple but add a secondary filter in ExportManagement page for detailed statuses.

**Advantages:**
- Best of both worlds
- Sidebar remains simple
- Page has detailed filtering

**Disadvantages:**
- More complex implementation

## Recommendation

**Use Option 1: Standardize on Workflow Statuses**

This ensures consistency across the application and provides users with complete visibility into the export workflow at all times.

## Implementation Steps

1. Update sidebar to show all workflow statuses for each organization
2. Ensure status filter in ExportManagement page matches sidebar
3. Update status mapping in both components
4. Test filtering across all organizations
5. Verify badges show correct counts

## Files to Update

1. `/home/gu-da/cbc/frontend/src/components/Layout.jsx` - Sidebar navigation
2. `/home/gu-da/cbc/frontend/src/pages/ExportManagement.jsx` - Status filters

## Status Mapping Reference

### Complete Workflow Status List
```
PENDING                    - Initial submission
FX_PENDING                 - Awaiting FX approval
FX_APPROVED                - FX approved
FX_REJECTED                - FX rejected
BANKING_PENDING            - Awaiting banking approval
BANKING_APPROVED           - Banking approved
BANKING_REJECTED           - Banking rejected
QUALITY_PENDING            - Awaiting quality certification
QUALITY_CERTIFIED          - Quality certified
QUALITY_REJECTED           - Quality rejected
EXPORT_CUSTOMS_PENDING     - Awaiting customs clearance
EXPORT_CUSTOMS_CLEARED     - Customs cleared
EXPORT_CUSTOMS_REJECTED    - Customs rejected
SHIPMENT_PENDING           - Awaiting shipment scheduling
SHIPMENT_SCHEDULED         - Shipment scheduled
SHIPMENT_REJECTED          - Shipment rejected
SHIPPED                    - Shipped
COMPLETED                  - Completed
CANCELLED                  - Cancelled
```

---

## Summary

| Aspect | Current | Recommended |
|--------|---------|-------------|
| **Sidebar Filters** | Simplified | Detailed workflow statuses |
| **Page Filters** | Detailed workflow | Detailed workflow |
| **Consistency** | ❌ Inconsistent | ✅ Consistent |
| **User Experience** | Confusing | Clear |
| **Complexity** | Low | Medium |

**Action Required:** Standardize status definitions across sidebar and export management page.
