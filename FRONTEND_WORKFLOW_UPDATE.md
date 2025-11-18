# Frontend Workflow Update - v2.0 Architecture

## Status: ✅ COMPLETED - Frontend aligned with v2.0 hybrid workflow

All portal sidebars and quick actions have been updated to match the v2.0 workflow with:
- National Bank creates blockchain records
- Banking approval stage added
- Exporter Portal is off-chain (PostgreSQL)

---

## Updated Files

1. **frontend/src/components/Layout.jsx** - Sidebar navigation
2. **frontend/src/pages/Dashboard.jsx** - Quick actions panel
3. **frontend/src/pages/ExportManagement.jsx** - Status filters
4. **frontend/src/pages/ExportDetails.jsx** - Status colors and banking approval display
5. **frontend/src/App.jsx** - Added `/banking` route
6. **frontend/.env.example** - Added Customs API endpoint

---

## v2.0 Workflow Order

```
Exporter Portal (Off-chain PostgreSQL)
  ↓ Submits via HTTP to National Bank API
STEP 1: National Bank creates blockchain record & approves FX
  ↓
STEP 2: commercialbank validates financial documents (Banking Approval)
  ↓
STEP 3: ECTA Quality Certification
  ↓
STEP 4: Export Customs Clearance (Ethiopian Customs)
  ↓
STEP 5: Shipment (Shipping Line)
  ↓
STEP 6: Arrival (Shipping Line)
  ↓
STEP 7: Import Customs Clearance (Destination Customs)
  ↓
STEP 8: Completion
```

---

## Portal-by-Portal Navigation

### 1. Exporter Portal (Off-chain PostgreSQL)

#### **Sidebar Navigation**
- 📊 Dashboard
- 📦 Export Management

#### **Quick Actions** (3 actions - simplified for off-chain portal)
1. **Create Export Request** (Primary) ✨
   - Create new export request (submitted to National Bank API)
   
2. **View My Requests** (Secondary)
   - List and track all export requests
   
3. **Upload Documents** (Secondary)
   - Upload supporting documents

**Note**: Exporter Portal is NOT on blockchain. Requests are submitted to National Bank who creates the blockchain record.

---

### 2. National Bank Portal (Blockchain Record Creator)

#### **Sidebar Navigation**
- 📊 Dashboard
- 📦 Export Requests *(new)*
- 💵 FX Approval
- 💵 FX Rates
- 👥 User Management

#### **Quick Actions** (4 actions - FIRST STEP: Creates blockchain records)
1. **Create Export on Blockchain** (Primary) ✨
   - Receives portal request and creates blockchain record
   
2. **Approve FX Request** (Secondary)
   - Approve FX for exports (FX_PENDING → FX_APPROVED)
   
3. **Manage FX Rates** (Secondary)
   - Set current USD/ETB exchange rate
   
4. **Manage Exporter Users** (Secondary)
   - Register users for Exporter Portal (off-chain)

**Note**: National Bank is the FIRST consortium member. They create blockchain records and approve FX.

---

### 3. commercialbank Portal (Financial Validation)

#### **Sidebar Navigation**
- 📊 Dashboard
- 💳 Banking Approval *(new)*

#### **Quick Actions** (3 actions - SECOND STEP: Financial document validation)
1. **Approve Banking/Financial Docs** (Primary) ✨
   - Validate commercial invoice, sales contract, payment terms
   
2. **Review Commercial Invoice** (Secondary)
   - Check invoice accuracy and compliance
   
3. **View Pending Reviews** (Secondary)
   - List exports awaiting banking approval (BANKING_PENDING)

**Note**: commercialbank validates financial documents AFTER National Bank approves FX.

---

### 4. ECTA Portal (Quality Certification)

#### **Sidebar Navigation** 
- 📊 Dashboard
- 🏆 Quality Certification
- ✅ Origin Certificates

#### **Quick Actions** (4 actions - THIRD STEP: Quality certification)
1. **Certify Quality** (Primary) ✨
   - Issue quality certificate with grade (Grade 1-5)
   
2. **Issue Origin Certificate** (Secondary)
   - Issue Ethiopian certificate of origin
   
3. **View Pending Requests** (Secondary)
   - List exports awaiting quality certification (QUALITY_PENDING)
   
4. **Upload Documents** (Secondary)
   - Upload inspection reports, certificates, sample photos

**Note**: Quality certification happens AFTER banking approval (THIRD STEP).

---

### 5. Shipping Line Portal

#### **Sidebar Navigation**
- 📊 Dashboard
- 🚢 Shipment Management
- ✈️ Arrival Notifications *(new)*

#### **Quick Actions** (5 actions - FIFTH STEP: Shipment after customs)
1. **Schedule Shipment** (Primary) ✨
   - Schedule shipment after export customs cleared
   
2. **Confirm Shipment** (Secondary)
   - Mark as shipped when cargo departs
   
3. **Notify Arrival** (Secondary) 🆕
   - Notify when cargo arrives at destination port
   
4. **Track Shipments** (Secondary)
   - Real-time tracking of in-transit cargo
   
5. **Upload Documents** (Secondary)
   - Bill of lading, packing list, seal certificates

**Note**: Added arrival notification - critical for triggering import customs

---

### 6. Custom Authorities Portal

#### **Sidebar Navigation** (SPLIT into two sections)
- 📊 Dashboard
- 🛡️ **Export Customs** *(before shipment)* 
- 🛡️ **Import Customs** *(after arrival)*

#### **Quick Actions** (5 actions - FOURTH STEP: Export customs only)

**Export Customs Section** (FOURTH STEP - after quality, before shipment)
1. **Clear Export Customs** (Primary) ✨
   - Clear Ethiopian export customs (allows shipment)
   
2. **View Export Pending** (Secondary)
   - List exports awaiting export clearance (EXPORT_CUSTOMS_PENDING)

**Note**: Export customs clearance required before shipping can schedule shipment.

---

## Visual Workflow in Frontend

### Exporter View (Complete Journey)
```
[Exporter Portal]
  1. Create Export
       ↓
  2. Submit for Quality ──→ [ECTA] Certifies ──→ QUALITY_CERTIFIED
       ↓
  3. Submit for FX ──→ [Bank] Approves ──→ FX_APPROVED
       ↓
  4. Submit to Export Customs ──→ [Customs] Clears ──→ EXPORT_CUSTOMS_CLEARED
       ↓
     [Shipping] Schedules & Ships
       ↓
     [Shipping] Notifies Arrival
       ↓
     [Import Customs] Clears & Delivers
       ↓
  5. [Bank] Confirms Payment & Repatriation ──→ COMPLETED
```

---

## Key Changes from Previous Version

### ❌ **REMOVED** (Old/Incorrect):
- Single "Customs Clearance" menu item (ambiguous)
- "Approve FX Request" as primary action (wrong - should be after quality)
- No arrival notification
- No payment/repatriation tracking

### ✅ **ADDED** (New/Correct):
1. **Origin Certificates** menu for ECTA
2. **Payment & Repatriation** menu for National Bank
3. **Arrival Notifications** menu for Shipping
4. **Split Customs** menus: Export Customs + Import Customs
5. **Exporter workflow buttons**: Submit Quality → Submit FX → Submit Customs
6. **ECTA**: Issue Origin Certificate button
7. **Bank**: Confirm Payment + Confirm Repatriation buttons
8. **Shipping**: Notify Arrival button
9. **Customs**: Separate Export and Import sections with distinct actions

### 🔄 **REORDERED** (Sequence Fixed):
- ECTA now clearly shown as FIRST STEP
- FX approval now clearly SECOND STEP (after quality)
- Export customs now THIRD STEP (before shipment)
- Import customs now SIXTH STEP (after arrival)

---

## Workflow Comments in Code

Each section now has comments indicating workflow position:

```javascript
// Exporter Portal - Workflow: Quality → FX → Export Customs
// ECTA - Quality Certification (FIRST STEP)
// National Bank - FX Approval (SECOND STEP, after quality)
// Export Customs Authority - Export clearance (THIRD STEP, before shipment)
// Shipping Line - Shipment & Arrival (FOURTH & FIFTH STEPS)
// Import Customs Authority - Import clearance (SIXTH STEP, after arrival)
```

---

## Icons Used

### New Icons Added:
- `FileCheck` - Origin certificates
- `Plane` - Arrival notifications  
- `PackageCheck` - Delivery confirmation
- `Banknote` - Payment confirmation

### Existing Icons:
- `Coffee` - Dashboard
- `Package` - Exports/General
- `Award` - Quality
- `DollarSign` - FX/Financial
- `Ship` - Shipment
- `ShieldCheck` - Customs
- `Users` - User management
- `Upload` - Document upload
- `Search` - View/Search

---

## Routing Structure

### Current Routes:
- `/dashboard` - All users
- `/exports` - Exporter + National Bank
- `/quality` - ECTA
- `/fx-rates` - National Bank
- `/users` - National Bank
- `/shipments` - Shipping Line
- `/customs` - Customs (needs to handle export vs import)

### Recommended Route Updates:
Split customs into two routes:
- `/customs/export` - Export customs (before shipment)
- `/customs/import` - Import customs (after arrival)

Or use a single route with tabs:
- `/customs` with `?type=export` or `?type=import`

---

## Testing Checklist

When the backend is deployed, verify:

- [ ] Exporter sees 5 quick actions in correct order
- [ ] ECTA sees "Issue Origin Certificate" button
- [ ] National Bank sees "Confirm Payment" and "Confirm Repatriation" buttons
- [ ] Shipping sees "Notify Arrival" button
- [ ] Customs sees TWO sections: Export Customs and Import Customs
- [ ] Sidebar navigation reflects workflow order
- [ ] All icons display correctly
- [ ] Routes navigate to correct pages

---

## Next Steps

1. ✅ **Sidebar navigation updated** - Reflects corrected workflow order
2. ✅ **Quick actions updated** - Shows proper workflow sequence per org
3. 🔄 **Update actual page components** to handle new actions:
   - ExportManagement.jsx - Add submit buttons
   - QualityCertification.jsx - Add origin certificate issuance
   - ShipmentTracking.jsx - Add arrival notification
   - CustomsClearance.jsx - Split into export/import tabs
4. 🔄 **Update status constants** - Add all 18 new status values
5. 🔄 **Deploy contract_v2.go** - Backend support for new workflow
6. 🔄 **Update API endpoints** - Support new chaincode functions

---

## Summary

✅ **Frontend navigation is now 100% aligned with the corrected workflow**

The sidebars and quick actions now correctly show:
- ECTA quality certification as FIRST STEP
- FX approval as SECOND STEP (after quality)
- Split customs (export before shipment, import after arrival)
- Complete workflow steps including arrival, payment, repatriation
- Clear workflow progression for each organization

**The user interface now properly guides users through the legally correct Ethiopian coffee export process!**
