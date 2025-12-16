# Role-Based Portals Status

## Current Status: ⚠️ PARTIALLY IMPLEMENTED

---

## What EXISTS Now:

### ✅ Basic Infrastructure
- User authentication with roles
- Role detection in App.tsx
- API routing based on role
- Generic Dashboard component
- 8 approval forms (but not role-restricted)

### ⚠️ What's MISSING:

**No role-specific portals** - All users see the same dashboard

---

## Required Role-Based Portals (7 Organizations)

### 1. **Exporter Portal** ❌ NOT IMPLEMENTED
**Users**: Coffee exporters  
**Current Step Visibility**: Steps 1-16 (all)  
**Should See**:
- Registration progress (Steps 1-6)
- Export creation and tracking
- Document upload
- Progress dashboard (16-step tracker)
- Compliance alerts (15-day, 90-day)
- Payment status

**Should Do**:
- Register business
- Apply for licenses
- Purchase coffee
- Submit contracts
- Upload documents
- Track shipments

---

### 2. **ECTA Portal** ❌ NOT IMPLEMENTED
**Users**: ECTA officers  
**Current Step Visibility**: Steps 5, 6, 8, 9, 10, 13  
**Should See**:
- Pending competence certificate applications (Step 5)
- Pending export license applications (Step 6)
- Quality inspection requests (Step 8)
- Sales contract registrations (Step 9)
- Certificate of origin requests (Step 10)
- Export permit applications (Step 13)

**Should Do**:
- Review competence certificates → `ECTALicenseForm`
- Approve export licenses → `ECTALicenseForm`
- Conduct quality inspections → `ECTAQualityForm`
- Register sales contracts → `ECTAContractForm`
- Issue certificates of origin
- Issue export permits

**Forms Available**: ✅ ECTALicenseForm, ECTAQualityForm, ECTAContractForm

---

### 3. **ECX Portal** ❌ NOT IMPLEMENTED
**Users**: ECX officers  
**Current Step Visibility**: Steps 7, 8  
**Should See**:
- Coffee auction listings
- Warehouse inventory
- Quality grading requests (Step 8)
- Lot purchase records (Step 7)

**Should Do**:
- Manage coffee auctions
- Process lot purchases
- Conduct quality grading → `ECXApprovalForm`
- Issue warehouse receipts

**Forms Available**: ✅ ECXApprovalForm

---

### 4. **National Bank (NBE) Portal** ❌ NOT IMPLEMENTED
**Users**: NBE officers  
**Current Step Visibility**: Step 12  
**Should See**:
- Pending FX approval requests (Step 12)
- Settlement deadline monitoring (90-day)
- Payment method tracking
- Foreign exchange allocations

**Should Do**:
- Review FX applications → `NBEFXApprovalForm`
- Approve/reject FX allocations
- Monitor settlement deadlines
- Track payment compliance

**Forms Available**: ✅ NBEFXApprovalForm

---

### 5. **Commercial Bank Portal** ❌ NOT IMPLEMENTED
**Users**: Commercial bank officers  
**Current Step Visibility**: Step 11  
**Should See**:
- Pending document verification requests (Step 11)
- L/C compliance checks
- Export document submissions
- Payment processing

**Should Do**:
- Verify export documents → `BankDocumentVerificationForm`
- Check L/C compliance
- Process payments
- Submit to NBE

**Forms Available**: ✅ BankDocumentVerificationForm

---

### 6. **Customs Portal** ❌ NOT IMPLEMENTED
**Users**: Customs officers  
**Current Step Visibility**: Step 14  
**Should See**:
- Pending customs declarations (Step 14)
- Physical inspection schedules
- Pre-shipment inspection requests
- Clearance requests

**Should Do**:
- Process customs declarations → `CustomsClearanceForm`
- Conduct physical inspections
- Calculate fees (warehouse, service, duty, tax)
- Issue release notes
- Issue final declarations

**Forms Available**: ✅ CustomsClearanceForm

---

### 7. **Shipping Line Portal** ❌ NOT IMPLEMENTED
**Users**: Shipping line officers  
**Current Step Visibility**: Step 15  
**Should See**:
- Pending booking requests (Step 15)
- Vessel schedules
- Container availability
- Pre-shipment inspection status

**Should Do**:
- Process booking requests → `ShipmentScheduleForm`
- Allocate containers
- Schedule pre-shipment inspections
- Issue Bills of Lading
- Track shipments

**Forms Available**: ✅ ShipmentScheduleForm

---

## What Each Portal Should Display

### Common Elements (All Portals):
- Role-specific navigation
- Pending tasks counter
- Recent activity feed
- Quick actions menu
- Notifications

### Exporter Portal Dashboard:
```
┌─────────────────────────────────────────┐
│ Export Progress                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Step 8 of 16 (50% Complete)            │
│ Next: Register Sales Contract           │
│                                         │
│ Active Exports: 3                       │
│ Pending Actions: 2                      │
│ Compliance Alerts: 1                    │
│                                         │
│ [Create New Export] [View All]          │
└─────────────────────────────────────────┘
```

### ECTA Portal Dashboard:
```
┌─────────────────────────────────────────┐
│ Pending Approvals                       │
│                                         │
│ Competence Certificates: 5              │
│ Export Licenses: 3                      │
│ Quality Inspections: 8                  │
│ Sales Contracts: 12                     │
│ Export Permits: 6                       │
│                                         │
│ [Review Queue] [Reports]                │
└─────────────────────────────────────────┘
```

### ECX Portal Dashboard:
```
┌─────────────────────────────────────────┐
│ Today's Auctions                        │
│                                         │
│ Active Lots: 15                         │
│ Pending Grading: 8                      │
│ Warehouse Capacity: 75%                 │
│                                         │
│ [Manage Auctions] [Quality Grading]     │
└─────────────────────────────────────────┘
```

### NBE Portal Dashboard:
```
┌─────────────────────────────────────────┐
│ FX Approval Queue                       │
│                                         │
│ Pending Approvals: 7                    │
│ Approaching 90-day Deadline: 3          │
│ Total FX Allocated Today: $2.5M         │
│                                         │
│ [Review Applications] [Reports]         │
└─────────────────────────────────────────┘
```

### Commercial Bank Portal Dashboard:
```
┌─────────────────────────────────────────┐
│ Document Verification Queue             │
│                                         │
│ Pending Verifications: 9                │
│ L/C Compliance Checks: 4                │
│ Awaiting NBE Submission: 2              │
│                                         │
│ [Verify Documents] [L/C Management]     │
└─────────────────────────────────────────┘
```

### Customs Portal Dashboard:
```
┌─────────────────────────────────────────┐
│ Clearance Queue                         │
│                                         │
│ Pending Declarations: 11                │
│ Scheduled Inspections: 5                │
│ Awaiting Release: 3                     │
│                                         │
│ [Process Declarations] [Inspections]    │
└─────────────────────────────────────────┘
```

### Shipping Line Portal Dashboard:
```
┌─────────────────────────────────────────┐
│ Booking Management                      │
│                                         │
│ Pending Bookings: 6                     │
│ Scheduled Departures: 4                 │
│ Container Availability: 85%             │
│                                         │
│ [Process Bookings] [Vessel Schedule]    │
└─────────────────────────────────────────┘
```

---

## Implementation Requirements

### Phase 1: Portal Structure (Immediate)
1. Create 7 role-specific dashboard components
2. Add role-based routing
3. Implement role-based navigation menus
4. Add pending tasks counters

### Phase 2: Task Queues (Week 1)
1. Create task queue for each role
2. Filter exports by current step
3. Show only relevant actions
4. Add quick action buttons

### Phase 3: Forms Integration (Week 1)
1. Link forms to role-specific dashboards
2. Pre-fill forms with export data
3. Add form submission handlers
4. Update export progress on submission

### Phase 4: Notifications (Week 2)
1. Role-specific notifications
2. Pending task alerts
3. Compliance warnings
4. Deadline reminders

---

## Database Queries Needed

### For ECTA Portal:
```sql
-- Pending competence certificates
SELECT * FROM competence_certificates WHERE status = 'PENDING';

-- Pending export licenses
SELECT * FROM export_licenses WHERE status = 'PENDING';

-- Pending quality inspections
SELECT * FROM quality_inspections WHERE status = 'pending';

-- Pending contracts
SELECT * FROM sales_contracts WHERE status = 'REGISTERED';

-- Pending export permits
SELECT * FROM export_permits WHERE status = 'pending';
```

### For NBE Portal:
```sql
-- Pending FX approvals
SELECT * FROM fx_approvals WHERE approval_status = 'pending';

-- Approaching 90-day deadline
SELECT * FROM fx_approvals 
WHERE settlement_deadline < CURRENT_DATE + INTERVAL '7 days'
AND approval_status != 'settled';
```

### For Customs Portal:
```sql
-- Pending clearances
SELECT * FROM customs_clearances WHERE status = 'pending';

-- Scheduled inspections
SELECT * FROM customs_clearances 
WHERE status = 'pending' 
AND inspection_date IS NOT NULL;
```

### For Shipping Line Portal:
```sql
-- Pending bookings
SELECT * FROM shipments WHERE status = 'booked';

-- Pre-shipment inspections needed
SELECT * FROM shipments 
WHERE pre_shipment_inspection_status = 'pending';
```

---

## API Endpoints Needed

### For Each Portal:
```
GET /api/dashboard/stats          - Role-specific statistics
GET /api/dashboard/pending-tasks  - Pending tasks for role
GET /api/dashboard/recent-activity - Recent activity
POST /api/dashboard/quick-action  - Quick action handler
```

---

## Frontend Components Needed

### New Components to Create:
1. `ExporterDashboard.tsx`
2. `ECTADashboard.tsx`
3. `ECXDashboard.tsx`
4. `NBEDashboard.tsx`
5. `CommercialBankDashboard.tsx`
6. `CustomsDashboard.tsx`
7. `ShippingLineDashboard.tsx`
8. `TaskQueue.tsx` (shared component)
9. `PendingTaskCard.tsx` (shared component)
10. `ProgressTracker.tsx` (shared component)

---

## Summary

**Current State**: ❌ No role-specific portals  
**Forms Available**: ✅ All 8 forms exist  
**Database**: ✅ All tables exist  
**APIs**: ✅ All endpoints exist  

**What's Missing**: Role-specific dashboards and task queues

**Estimated Implementation Time**: 3-4 days
- Day 1: Create 7 dashboard components
- Day 2: Implement task queues and routing
- Day 3: Integrate forms and actions
- Day 4: Add notifications and polish

**Priority**: HIGH - This is critical for usability
