# Exporter Journey - Complete Workflow

## Overview
Complete exporter journey from registration to sales contract execution.

---

## Phase 1: Registration & Pre-Qualification

### Step 1: User Registration → Profile Auto-Approval
- Submit company details, TIN, capital, business type
- Smart contract validates automatically
- ✅ Pass → Profile approved, can login
- ❌ Fail → Profile rejected, cannot login

### Step 2: First Login → Dashboard
- See compliance status
- Profile: ✅ Approved
- Laboratory: 🔓 Unlocked
- Taster: 🔒 Locked
- Competence: 🔒 Locked
- License: 🔒 Locked

### Step 3: Laboratory Registration
- Submit laboratory certificate
- ECTA reviews and approves
- ✅ Approved → Taster unlocks

### Step 4: Taster Registration
- Submit taster certificate
- ECTA reviews and approves
- ✅ Approved → Competence unlocks

### Step 5: Competence Certificate
- Apply for competence certificate
- ECTA issues certificate
- ✅ Issued → Export License unlocks

### Step 6: Export License
- Apply for export license
- ECTA issues license
- ✅ Issued → Status: `active` (FULLY QUALIFIED)

---

## Phase 2: Sales Contract Process (NEW)

### Step 7: Fully Qualified Dashboard
**Location**: `/dashboard`

**What Exporter Sees**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🎉 Congratulations! You're Fully Qualified                  │
│                                                              │
│ You have completed all pre-registration requirements        │
│ and are now authorized to export coffee.                    │
│                                                              │
│ Next Step: Create sales contracts with international buyers │
│                                                              │
│ [Start Sales Contract Process] [Browse Buyer Opportunities] │
└─────────────────────────────────────────────────────────────┘
```

**Action Buttons**:
1. **Start Sales Contract Process** → Navigate to `/sales-contracts`
2. **Browse Buyer Opportunities** → Navigate to `/marketplace/opportunities`

---

### Step 8: Browse Buyer Opportunities (Optional)
**Location**: `/marketplace/opportunities`

**Features**:
- View buyer requirements posted by international buyers
- Filter by coffee type, country, quantity, price
- See buyer verification status and reputation
- Express interest in opportunities
- AI-based matching suggestions

**Buyer Opportunity Details**:
- Coffee type and origin preferences
- Quantity requirements (min/max)
- Quality grade requirements
- Payment terms preferences
- Incoterms preferences
- Target price range
- Certifications required
- Delivery schedule

**Actions**:
- View opportunity details
- Express interest
- Contact buyer
- Create contract draft

---

### Step 9: Create Sales Contract Draft
**Location**: `/sales-contracts` → Click "New Draft"

**Contract Draft Form**:

**Coffee Details**:
- Coffee type (Arabica Grade 1, Yirgacheffe, etc.)
- Origin region
- Quantity (bags)
- Unit price (USD)
- Quality grade
- Total value (auto-calculated)

**Payment & Delivery Terms**:
- Payment terms (Net 30, Net 60, etc.)
- Payment method (LC, CAD, TT, DP, DA, OA)
- Incoterms (FOB, CIF, CFR, EXW, etc.)
- Delivery date
- Port of loading (e.g., Port of Djibouti)
- Port of discharge (e.g., Port of Hamburg)

**Legal Framework**:
- Governing law (CISG, Ethiopian Law, etc.)
- Arbitration rules (ICC, UNCITRAL, LCIA)
- Arbitration location (Geneva, etc.)
- Contract language (English, etc.)

**Certifications & Special Conditions**:
- Required certifications (ORGANIC, FAIR_TRADE, etc.)
- Special conditions (free text)

**Action**: Click "Create Draft" → Contract created with status `DRAFT`

---

### Step 10: Contract Negotiation
**Location**: `/sales-contracts` → View draft

**Negotiation Flow**:

```
Exporter creates draft → Status: DRAFT
         ↓
Buyer receives notification
         ↓
Buyer reviews draft
         ↓
    ┌────┴────┐
    ↓         ↓         ↓
 ACCEPT   REJECT   COUNTER-OFFER
    ↓         ↓         ↓
Finalize  Closed   New version created
                        ↓
                   Exporter reviews
                        ↓
                   ACCEPT/REJECT/COUNTER
                        ↓
                   (repeat until accepted)
```

**Negotiation Actions**:
1. **Accept**: Both parties agree → Status: `ACCEPTED`
2. **Reject**: Provide reason → Status: `REJECTED`
3. **Counter-Offer**: Propose changes → Creates new version

**Version Control**:
- Each counter-offer creates new version
- Parent-child relationship maintained
- Complete audit trail preserved
- All changes tracked

---

### Step 11: Contract Finalization
**Location**: `/sales-contracts` → Accepted contract

**When**: Both parties have accepted the contract

**Action**: Click "Finalize to Blockchain"

**What Happens**:
1. Contract committed to blockchain (immutable)
2. Status changes to `FINALIZED`
3. Blockchain transaction ID generated
4. Contract becomes legally binding
5. Certificate generation enabled

**Blockchain Benefits**:
- ✅ Immutable record
- ✅ Tamper-proof
- ✅ Transparent audit trail
- ✅ Multi-party verification
- ✅ Timestamped proof

---

### Step 12: Download Sales Contract Certificate
**Location**: `/sales-contracts` → Finalized contract

**Action**: Click "Download Certificate (PDF)"

**Certificate Includes**:
- Contract number and version
- Exporter details (name, TIN, license)
- Buyer details (name, country, verification status)
- Coffee specifications (type, quantity, quality)
- Payment terms (method, terms, currency)
- Delivery terms (Incoterms, ports, dates)
- Legal framework (governing law, arbitration)
- Blockchain transaction ID
- QR code for verification
- Digital signatures
- ECTA seal and branding

**Uses**:
- Submit to bank for LC opening
- Submit to customs for clearance
- Submit to shipping line for booking
- Submit to NBE for FX approval
- Legal proof of contract

---

## Phase 3: Export Execution (After Sales Contract)

### Step 13: Network Submission System Submission
**Location**: `/esw/submission`

**Prerequisites**:
- ✅ Fully qualified exporter
- ✅ Finalized sales contract
- ✅ All certificates issued

**ESW Documents Required**:
1. Sales contract certificate
2. Export license
3. Competence certificate
4. Quality certificate (from ECX)
5. Origin certificate
6. Phytosanitary certificate
7. Weight certificate
8. Packing list
9. Commercial invoice
10. Bill of lading

**Agency Approvals**:
- ECTA (contract & quality)
- ECX (auction verification)
- Commercial Bank (LC & payment)
- NBE (FX approval)
- Customs (clearance & SAD)
- Shipping Line (booking & B/L)

---

## Complete Workflow Summary

```
1. Register → Smart Contract Validates → Profile Approved
2. Login → Dashboard → See Compliance Status
3. Submit Laboratory → ECTA Approves → Taster Unlocked
4. Submit Taster → ECTA Approves → Competence Unlocked
5. Apply Competence → ECTA Issues → License Unlocked
6. Apply License → ECTA Issues → FULLY QUALIFIED ✅
7. Dashboard Shows: "Start Sales Contract Process" 🎉
8. Browse Buyer Opportunities (optional)
9. Create Sales Contract Draft
10. Negotiate with Buyer (Accept/Reject/Counter)
11. Finalize Contract to Blockchain
12. Download Sales Contract Certificate
13. Submit ESW with All Documents
14. Get Agency Approvals
15. Export Coffee ☕
```

---

## Key Features

### Automatic Redirection
- ✅ When exporter becomes fully qualified
- ✅ Dashboard shows prominent call-to-action
- ✅ "Start Sales Contract Process" button
- ✅ Direct navigation to sales contract dashboard

### Buyer Discovery
- ✅ Marketplace for buyer opportunities
- ✅ AI-based matching algorithm
- ✅ Buyer verification and reputation
- ✅ Express interest system

### Contract Negotiation
- ✅ Version control with audit trail
- ✅ Accept/Reject/Counter-offer workflow
- ✅ Field-level change tracking
- ✅ Time-bound offers

### Legal Compliance
- ✅ CISG compliant
- ✅ Incoterms 2020 support
- ✅ Multiple payment methods
- ✅ Arbitration framework

### Blockchain Integration
- ✅ Immutable contract record
- ✅ Transparent audit trail
- ✅ Multi-party verification
- ✅ Timestamped proof

---

## User Experience Flow

### Before Fully Qualified
```
Dashboard → "Complete pre-registration requirements"
         → Action buttons for each stage
         → Progress tracking
```

### After Fully Qualified
```
Dashboard → 🎉 "Congratulations! You're Fully Qualified"
         → [Start Sales Contract Process] (prominent button)
         → [Browse Buyer Opportunities] (secondary button)
         → Automatic guidance to next step
```

### Sales Contract Process
```
Sales Contracts → Create Draft → Negotiate → Finalize → Download Certificate
              → Browse Opportunities → Express Interest → Create Draft
              → View History → Track Status → Manage Contracts
```

---

## Navigation Structure

```
/dashboard (Fully Qualified)
    ↓
    ├─→ /sales-contracts (Main dashboard)
    │       ├─→ /sales-contracts/drafts (Draft contracts)
    │       ├─→ /sales-contracts/negotiations (Active negotiations)
    │       └─→ /sales-contracts/finalized (Finalized contracts)
    │
    ├─→ /marketplace/opportunities (Buyer opportunities)
    │       ├─→ View opportunities
    │       ├─→ Express interest
    │       └─→ Create contract from opportunity
    │
    └─→ /esw/submission (After contract finalized)
            └─→ Submit all documents for export
```

---

## Status Indicators

### Pre-Qualification Stages
- 🔒 **Locked**: Not yet available
- 🔓 **Unlocked**: Ready to submit
- ⏳ **Pending**: Submitted, awaiting ECTA review
- ✅ **Approved**: Completed successfully
- ❌ **Rejected**: Needs resubmission

### Sales Contract Stages
- 📝 **DRAFT**: Initial creation
- 📤 **OFFERED**: Sent to buyer
- 🔄 **COUNTERED**: Buyer proposed changes
- ✅ **ACCEPTED**: Both parties agreed
- ❌ **REJECTED**: Contract declined
- 🔐 **FINALIZED**: Committed to blockchain
- 📄 **CERTIFICATE**: PDF generated

---

## Benefits of This Workflow

### For Exporters
1. ✅ Clear guidance at every step
2. ✅ Automatic progression through stages
3. ✅ Prominent call-to-action when qualified
4. ✅ Easy buyer discovery
5. ✅ Streamlined contract creation
6. ✅ Transparent negotiation process
7. ✅ Blockchain-backed contracts
8. ✅ Professional certificates

### For Buyers
1. ✅ Post requirements to marketplace
2. ✅ Receive matched exporter suggestions
3. ✅ Review exporter qualifications
4. ✅ Negotiate contract terms
5. ✅ Blockchain-verified contracts
6. ✅ Transparent audit trail

### For ECTA
1. ✅ Automated pre-qualification validation
2. ✅ Reduced manual review workload
3. ✅ Complete audit trail
4. ✅ Blockchain transparency
5. ✅ Compliance monitoring
6. ✅ Dispute resolution support

---

## Implementation Status

✅ **Phase 1**: Pre-qualification workflow (COMPLETE)
✅ **Phase 2**: Sales contract process (COMPLETE)
✅ **Phase 3**: Automatic redirection (COMPLETE)
✅ **Phase 4**: Buyer marketplace (COMPLETE)
✅ **Phase 5**: Contract negotiation (COMPLETE)
✅ **Phase 6**: Blockchain finalization (COMPLETE)
✅ **Phase 7**: Certificate generation (COMPLETE)

---

**Status**: ✅ PRODUCTION READY
**Date**: March 27, 2026
**Version**: 1.0.0

The complete exporter journey from registration to sales contract execution is fully implemented and operational.
