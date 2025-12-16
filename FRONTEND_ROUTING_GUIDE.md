# Frontend Routing Guide - Coffee Export Blockchain Platform

## 🏠 Base URL
```
http://localhost:3010
```

---

## 🔐 Authentication Routes

### Login Page
```
Route: /login
Component: Login.tsx
Access: Public (no auth required)

What it does:
- Organization dropdown (7 options)
- Username/password fields
- Calls POST /api/auth/login
- Auto-redirects to role-specific dashboard
```

---

## 📊 Role-Based Dashboard Routes

### 1. ECTA Dashboard
```
Route: /ecta-dashboard
Component: ECTADashboard.tsx
Role: ECTA officers
Auto-redirect: When org = 'ecta'

Shows:
- Pending export licenses (Step 6)
- Pending quality inspections (Step 8)
- Pending sales contracts (Step 9)
- Pending export permits (Step 13)

Actions:
- Click "Review" → Opens relevant form
- Approve/Reject → Updates database
- Auto-refreshes task queue
```

### 2. National Bank Dashboard
```
Route: /nbe-dashboard
Component: NBEDashboard.tsx
Role: NBE officers
Auto-redirect: When org = 'national-bank'

Shows:
- Pending FX approvals (Step 12)
- 90-day settlement deadlines
- Total FX allocated

Actions:
- Click "Review FX Application" → Opens NBEFXApprovalForm
- Approve with exchange rate
- Monitor settlement compliance
```

### 3. Customs Dashboard
```
Route: /customs-dashboard
Component: CustomsDashboard.tsx
Role: Customs officers
Auto-redirect: When org = 'custom-authorities'

Shows:
- Pending customs declarations (Step 14)
- Scheduled inspections
- Awaiting release

Actions:
- Click "Process Clearance" → Opens CustomsClearanceForm
- Enter fees (warehouse, service, duty, tax)
- Issue release notes
```

### 4. Shipping Line Dashboard
```
Route: /shipping-dashboard
Component: ShippingLineDashboard.tsx
Role: Shipping line officers
Auto-redirect: When org = 'shipping-line'

Shows:
- Pending bookings (Step 15)
- Scheduled departures
- Container availability

Actions:
- Click "Process Booking" → Opens ShipmentScheduleForm
- Schedule vessels
- Track pre-shipment inspections
```

### 5. ECX Dashboard
```
Route: /ecx-dashboard
Component: ECXDashboard.tsx
Role: ECX officers
Auto-redirect: When org = 'ecx'

Shows:
- Active coffee lots
- Pending quality grading (Step 8)
- Warehouse capacity

Actions:
- Click "Grade Coffee" → Opens ECXApprovalForm
- Assign grades
- Issue quality certificates
```

### 6. Commercial Bank Dashboard
```
Route: /bank-dashboard
Component: CommercialBankDashboard.tsx
Role: Bank officers
Auto-redirect: When org = 'commercial-bank'

Shows:
- Pending document verifications (Step 11)
- L/C compliance checks
- Awaiting NBE submission

Actions:
- Click "Verify Documents" → Opens BankDocumentVerificationForm
- Check L/C compliance
- Approve for FX application
```

### 7. Exporter Dashboard
```
Route: /exporter-dashboard
Component: ExporterDashboard.tsx
Role: Coffee exporters
Auto-redirect: When org = 'exporter'

Shows:
- All exports with progress bars
- Active exports count
- Completed exports
- Compliance alerts

Features:
- Click "View Details" → Shows 16-step vertical stepper
- Progress percentage for each export
- Next action indicators
- Timeline tracking
```

---

## 📋 Export Management Routes

### Export List
```
Route: /exports
Component: ExportManagement.tsx
Access: All authenticated users

Shows:
- List of all exports
- Filter by status
- Search functionality
- Create new export button
```

### Export Details
```
Route: /exports/:id
Component: ExportDetails.tsx
Access: All authenticated users
Example: /exports/EXP001

Shows:
- Complete export information
- Current step and status
- Document history
- Timeline
- Actions based on role
```

---

## 📝 Form Routes (Embedded in Dashboards)

These forms open within dashboards, not as separate routes:

### 1. ECTA License Form
```
Component: ECTALicenseForm.tsx
Used in: ECTADashboard
Triggered by: Click "Review" on license task

Fields:
- License number
- Exporter TIN
- License expiry date
- Validation notes
```

### 2. ECTA Quality Form
```
Component: ECTAQualityForm.tsx
Used in: ECTADashboard
Triggered by: Click "Review" on quality task

Fields:
- Coffee type
- Moisture content
- Defect count
- Cup score
- Grade
```

### 3. ECTA Contract Form
```
Component: ECTAContractForm.tsx
Used in: ECTADashboard
Triggered by: Click "Review" on contract task

Fields:
- Contract number
- Buyer name/country
- Payment terms
- L/C number (eSW)
- Notification date (15-day)
- Settlement deadline (90-day)
```

### 4. NBE FX Approval Form
```
Component: NBEFXApprovalForm.tsx
Used in: NBEDashboard
Triggered by: Click "Review FX Application"

Fields:
- Approved FX amount
- Exchange rate
- Payment method (L/C, CAD, Advance)
- L/C number
- Settlement deadline (90 days)
- Bank permit number
```

### 5. Customs Clearance Form
```
Component: CustomsClearanceForm.tsx
Used in: CustomsDashboard
Triggered by: Click "Process Clearance"

Fields:
- Declaration number
- Tariff classification
- Customs duty
- VAT
- Warehouse fees (eSW)
- Service charges (eSW)
- Release note number (eSW)
```

### 6. Shipment Schedule Form
```
Component: ShipmentScheduleForm.tsx
Used in: ShippingLineDashboard
Triggered by: Click "Process Booking"

Fields:
- Vessel/flight number
- Container number
- Departure/arrival dates
- Ports
- Pre-shipment inspection status (eSW)
- Inspector name (eSW)
- Insurance policy number (eSW)
```

### 7. ECX Approval Form
```
Component: ECXApprovalForm.tsx
Used in: ECXDashboard
Triggered by: Click "Grade Coffee"

Fields:
- Coffee type
- Cup score
- Grade
- Certificate number
```

### 8. Bank Document Verification Form
```
Component: BankDocumentVerificationForm.tsx
Used in: CommercialBankDashboard
Triggered by: Click "Verify Documents"

Fields:
- Document type
- Document hash
- Verification status
- L/C compliance
```

---

## 🔄 Navigation Flow Examples

### Example 1: ECTA Officer Workflow
```
1. Login as ECTA
   ↓
2. Auto-redirect to /ecta-dashboard
   ↓
3. See "5 Pending Quality Inspections"
   ↓
4. Click "Review" on EXP001
   ↓
5. ECTAQualityForm opens (same page)
   ↓
6. Fill form: moisture=11.5%, cup_score=85, grade="Grade 1"
   ↓
7. Click "Approve"
   ↓
8. POST /api/quality/inspect
   ↓
9. POST /api/exports/EXP001/progress (step=8)
   ↓
10. Form closes, dashboard refreshes
   ↓
11. EXP001 removed from queue (moved to step 9)
```

### Example 2: Exporter Workflow
```
1. Login as Exporter
   ↓
2. Auto-redirect to /exporter-dashboard
   ↓
3. See "3 Active Exports"
   ↓
4. Click "View Details" on EXP001
   ↓
5. See 16-step vertical stepper
   ↓
6. Steps 1-8: ✅ Completed (green checkmarks)
   ↓
7. Step 9: ⏳ Current (waiting for ECTA contract approval)
   ↓
8. Steps 10-16: ⭕ Pending (gray)
   ↓
9. Alert: "Next Action: Waiting for ECTA contract approval"
   ↓
10. Click "← Back to Dashboard"
```

### Example 3: Multi-Role Flow
```
Exporter creates export (Step 1-7)
   ↓
ECX grades coffee (Step 8)
   ↓
ECTA approves contract (Step 9)
   ↓
ECTA issues certificate of origin (Step 10)
   ↓
Commercial Bank verifies documents (Step 11)
   ↓
NBE approves FX (Step 12)
   ↓
ECTA issues export permit (Step 13)
   ↓
Customs clears export (Step 14)
   ↓
Shipping Line books vessel (Step 15)
   ↓
Payment settlement (Step 16)
   ↓
Export complete! 🎉
```

---

## 🗺️ Complete Route Map

```
/
├── /login (public)
│
├── / (authenticated root)
│   ├── → Redirects to role-specific dashboard
│
├── Role-Specific Dashboards
│   ├── /ecta-dashboard (ECTA officers)
│   ├── /nbe-dashboard (NBE officers)
│   ├── /customs-dashboard (Customs officers)
│   ├── /shipping-dashboard (Shipping officers)
│   ├── /ecx-dashboard (ECX officers)
│   ├── /bank-dashboard (Bank officers)
│   └── /exporter-dashboard (Exporters)
│
├── Export Management
│   ├── /exports (list all)
│   └── /exports/:id (details)
│
├── Legacy/Additional Routes
│   ├── /dashboard (generic dashboard)
│   ├── /quality (quality certification)
│   ├── /fx-rates (FX rates)
│   ├── /users (user management)
│   ├── /shipment-tracking (tracking)
│   ├── /customs (customs page)
│   ├── /profile (exporter profile)
│   ├── /application-tracking (tracking)
│   ├── /help (help & support)
│   ├── /banking (banking operations)
│   ├── /lot-management (ECX lots)
│   └── /monetary-policy (NBE policy)
```

---

## 🎯 Quick Access Guide

### For Testing Each Role:

**Test ECTA:**
```
1. Go to http://localhost:3010/login
2. Select "ECTA"
3. Login with demo/demo
4. You'll be at: /ecta-dashboard
5. See pending tasks for steps 5,6,8,9,10,13
```

**Test NBE:**
```
1. Go to http://localhost:3010/login
2. Select "National Bank"
3. Login with demo/demo
4. You'll be at: /nbe-dashboard
5. See pending FX approvals (step 12)
```

**Test Exporter:**
```
1. Go to http://localhost:3010/login
2. Select "Exporter Portal"
3. Login with demo/demo
4. You'll be at: /exporter-dashboard
5. See all exports with 16-step progress
```

---

## 🔒 Route Protection

All routes except `/login` require authentication:

```javascript
// In App.tsx
{
  path: '/',
  element: user ? (
    <Layout user={user} org={org} onLogout={handleLogout} />
  ) : (
    <Navigate to="/login" />
  ),
  children: [
    // All protected routes here
  ]
}
```

If not logged in:
- Any route → Redirects to `/login`

If logged in:
- `/login` → Redirects to role-specific dashboard
- `/` → Redirects to role-specific dashboard

---

## 📱 Responsive Design

All dashboards and forms are responsive:
- Desktop: Full layout with sidebars
- Tablet: Collapsed sidebars
- Mobile: Stacked layout

---

## 🚀 Direct URL Access

You can bookmark role-specific dashboards:

```
http://localhost:3010/ecta-dashboard
http://localhost:3010/nbe-dashboard
http://localhost:3010/customs-dashboard
http://localhost:3010/shipping-dashboard
http://localhost:3010/ecx-dashboard
http://localhost:3010/bank-dashboard
http://localhost:3010/exporter-dashboard
```

If not logged in, you'll be redirected to `/login` first.

---

## 🔄 Session Persistence

The system remembers your login:
- Refresh page → Stays logged in
- Close browser → Session persists (localStorage)
- Logout → Clears session, redirects to `/login`

---

## Summary

**Total Routes**: 30+
**Role-Specific Dashboards**: 7
**Forms**: 8 (embedded in dashboards)
**Protected Routes**: All except `/login`

**Key Feature**: Auto-routing based on role - each user sees only their relevant dashboard and tasks!
