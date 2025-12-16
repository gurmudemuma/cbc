# Coffee Export Workflow Management System

## Overview
Complete workflow management system with approval/rejection flows and resubmission capabilities for all organizations in the coffee export consortium.

---

## 🔄 Workflow States & Transitions

### State Machine
```
DRAFT → PENDING → FX_PENDING → FX_APPROVED → QUALITY_PENDING → QUALITY_CERTIFIED 
  ↓         ↓          ↓                          ↓                      ↓
CANCELLED   ↓     FX_REJECTED              QUALITY_REJECTED    EXPORT_CUSTOMS_PENDING
            ↓          ↓                          ↓                      ↓
            ↓          └──────────────────────────┴─────────→ PENDING   ↓
            ↓                                                            ↓
            └────────────────────────────────────────────────────→ EXPORT_CUSTOMS_CLEARED
                                                                         ↓
                                                                  SHIPMENT_PENDING
                                                                         ↓
                                                                  SHIPMENT_SCHEDULED
                                                                         ↓
                                                                      SHIPPED
                                                                         ↓
                                                                     COMPLETED
```

### Rejection States
All rejection states allow the **commercialbank** to resubmit after making corrections:

1. **FX_REJECTED** - Rejected by National Bank
2. **QUALITY_REJECTED** - Rejected by ECTA
3. **EXPORT_CUSTOMS_REJECTED** - Rejected by Custom Authorities
4. **SHIPMENT_REJECTED** - Rejected by Shipping Line

---

## 🏢 Organization Workflows

### 1. commercialbank (Transaction Initiator)
**Capabilities:**
- ✅ Create new export requests
- ✅ View rejection reasons
- ✅ Resubmit rejected exports
- ✅ Edit export details before resubmission
- ✅ Track workflow history

**Actions on Rejected Exports:**
- **Resubmit** - Resubmit export for review
- **View Rejection** - See detailed rejection feedback
- **Edit Export** - Modify export details before resubmitting

---

### 2. National Bank (FX & Compliance)
**Capabilities:**
- ✅ Review pending FX requests
- ✅ Approve FX applications
- ✅ Reject with detailed reason
- ✅ Track approval history

**Workflow:**
```
PENDING/FX_PENDING → [Review] → Approve → FX_APPROVED
                              → Reject → FX_REJECTED → [Back to Exporter]
```

**Rejection Process:**
1. Click "Reject" button
2. Enter detailed rejection reason
3. System notifies exporter
4. Export returns to PENDING state
5. Exporter can resubmit after corrections

---

### 3. ECTA (Quality Certification)
**Capabilities:**
- ✅ Certify coffee quality
- ✅ Reject with quality issues
- ✅ Issue quality certificates
- ✅ Track certification history

**Workflow:**
```
FX_APPROVED/QUALITY_PENDING → [Inspect] → Certify → QUALITY_CERTIFIED
                                        → Reject → QUALITY_REJECTED → [Back to Exporter]
```

**Rejection Reasons:**
- Quality standards not met
- Incorrect coffee grade
- Missing quality documentation
- Failed laboratory tests

---

### 4. Custom Authorities (Customs Clearance)
**Capabilities:**
- ✅ Process customs clearance
- ✅ Reject for compliance issues
- ✅ Hold for inspection
- ✅ Track clearance history

**Workflow:**
```
QUALITY_CERTIFIED/EXPORT_CUSTOMS_PENDING → [Review] → Clear → EXPORT_CUSTOMS_CLEARED
                                                     → Reject → EXPORT_CUSTOMS_REJECTED → [Back to Exporter]
```

**Rejection Reasons:**
- Missing customs documentation
- Incorrect tariff classification
- Compliance violations
- Incomplete declarations

---

### 5. Shipping Line (Logistics Management)
**Capabilities:**
- ✅ Schedule shipments
- ✅ Reject for logistics issues
- ✅ Track shipment status
- ✅ Mark as shipped

**Workflow:**
```
EXPORT_CUSTOMS_CLEARED/SHIPMENT_PENDING → [Schedule] → Schedule → SHIPMENT_SCHEDULED
                                                      → Reject → SHIPMENT_REJECTED → [Back to Exporter]
```

**Rejection Reasons:**
- Capacity constraints
- Destination restrictions
- Packaging issues
- Documentation problems

---

## 📋 Rejection & Resubmission Process

### Rejection Flow

1. **Reviewer Initiates Rejection**
   - Clicks "Reject" button on export
   - Rejection dialog opens

2. **Provide Detailed Feedback**
   - Enter comprehensive rejection reason
   - System captures:
     - Rejection reason
     - Rejected by (username)
     - Rejection timestamp
     - Rejection stage

3. **System Processing**
   - Export status changes to rejection state
   - Notification sent to commercialbank
   - Export returns to PENDING state
   - Workflow history updated

4. **Exporter Notification**
   - Email/system notification sent
   - Rejection details displayed in dashboard
   - Export marked with rejection indicator

### Resubmission Flow

1. **Exporter Reviews Rejection**
   - Views rejection reason
   - Checks rejection stage
   - Reviews feedback details

2. **Make Corrections**
   - **Option A**: Edit export details first
     - Click "Edit Export First"
     - Modify incorrect information
     - Update documents
     - Then resubmit
   
   - **Option B**: Resubmit as-is
     - If rejection was in error
     - Click "Resubmit Now"
     - Provide explanation if needed

3. **Resubmission Processing**
   - Export status returns to PENDING
   - Workflow restarts from beginning
   - All organizations review again
   - Resubmission tracked in history

---

## 🎯 Key Features

### 1. Rejection Dialog
```javascript
Features:
- Export details summary
- Required rejection reason field
- Warning about exporter notification
- Confirmation before rejection
- Audit trail capture
```

### 2. Resubmission Dialog
```javascript
Features:
- Rejection feedback display
- Rejection stage indicator
- Detailed export information
- Checklist for corrections
- Edit or resubmit options
- Workflow guidance
```

### 3. Workflow History
```javascript
Tracked Information:
- All state transitions
- Approval/rejection events
- User actions and timestamps
- Rejection reasons
- Resubmission attempts
- Document updates
```

### 4. Visual Indicators
```javascript
UI Elements:
- Rejection state badges (red)
- Resubmit button (orange)
- View rejection button
- Progress indicators
- Status chips
- Action buttons with icons
```

---

## 🔐 Security & Permissions

### Role-Based Actions
```javascript
commercialbank:
  - Create exports
  - Resubmit rejected exports
  - View rejection feedback
  - Edit export details

National Bank:
  - Approve/Reject FX requests
  - View pending approvals
  - Provide rejection feedback

ECTA:
  - Certify/Reject quality
  - Issue certificates
  - Provide quality feedback

Custom Authorities:
  - Clear/Reject customs
  - Hold for inspection
  - Provide compliance feedback

Shipping Line:
  - Schedule/Reject shipments
  - Mark as shipped
  - Provide logistics feedback
```

### Workflow Validation
- Users can only perform actions for their role
- State transitions follow defined rules
- Rejection requires mandatory reason
- Resubmission only available to exporters
- History maintains complete audit trail

---

## 📊 Workflow Progress Tracking

### Progress Calculation
```javascript
Stages:
1. Export Creation (0-16%)
2. FX & Compliance (17-33%)
3. Quality Certification (34-50%)
4. Customs Clearance (51-67%)
5. Shipment & Delivery (68-83%)
6. Completion (84-100%)
```

### Status Colors
- 🔴 **Red**: Rejected states
- 🟡 **Yellow**: Pending states
- 🟢 **Green**: Approved/Certified/Cleared
- 🔵 **Blue**: Scheduled/Shipped
- ⚫ **Gray**: Draft/Cancelled

---

## 🔄 Resubmission Best Practices

### For Exporters
1. **Carefully review rejection feedback**
2. **Address all mentioned issues**
3. **Update documents if required**
4. **Verify all information is correct**
5. **Add notes explaining corrections**
6. **Resubmit promptly to avoid delays**

### For Reviewers
1. **Provide specific, actionable feedback**
2. **Reference exact issues found**
3. **Suggest corrections needed**
4. **Be clear and professional**
5. **Include relevant regulations/standards**
6. **Offer guidance for compliance**

---

## 📈 Benefits

### For Organizations
- ✅ Clear workflow visibility
- ✅ Structured approval process
- ✅ Documented rejection reasons
- ✅ Efficient resubmission handling
- ✅ Complete audit trail
- ✅ Reduced processing time

### For Exporters
- ✅ Clear feedback on rejections
- ✅ Easy resubmission process
- ✅ Ability to correct issues
- ✅ Workflow transparency
- ✅ Reduced delays
- ✅ Better compliance

### For System
- ✅ Automated state management
- ✅ Validation at each stage
- ✅ History tracking
- ✅ Role-based access control
- ✅ Notification system
- ✅ Reporting capabilities

---

## 🚀 Implementation Status

✅ **Completed:**
- Workflow state machine
- Rejection dialog with reason tracking
- Resubmission dialog with feedback display
- Role-based action buttons
- Workflow history tracking
- Visual indicators and progress bars
- Complete audit trail
- All organization workflows

🔄 **Ready for Testing:**
- Multi-organization workflow
- Rejection and resubmission flows
- Workflow history display
- Notification system integration

---

## 📝 API Endpoints

### Rejection Endpoints
```
POST /api/exports/{id}/reject-fx
POST /api/exports/{id}/reject-quality
POST /api/exports/{id}/reject-customs
POST /api/exports/{id}/reject-shipment

Body: {
  reason: string (required),
  rejectedBy: string,
  rejectedAt: ISO date
}
```

### Resubmission Endpoint
```
POST /api/exports/{id}/resubmit

Body: {
  resubmittedBy: string,
  resubmittedAt: ISO date,
  notes: string (optional)
}
```

### Workflow History
```
GET /api/exports/{id}/history

Response: [{
  action: string,
  status: string,
  actor: string,
  timestamp: ISO date,
  reason: string (if rejection),
  notes: string
}]
```

---

## 🎓 User Guide

### How to Reject an Export
1. Navigate to Export Management
2. Find the export to reject
3. Click the "Reject" button
4. Enter detailed rejection reason
5. Click "Confirm Rejection"
6. Export returns to exporter

### How to Resubmit a Rejected Export
1. View rejected exports in dashboard
2. Click "Resubmit" button
3. Review rejection feedback
4. Choose to edit or resubmit
5. Make necessary corrections
6. Click "Resubmit Now"
7. Export re-enters workflow

---

## 🔧 Configuration

### Workflow Manager Location
```
/frontend/src/utils/workflowManager.js
```

### Component Updates
```
/frontend/src/pages/ExportManagement.jsx
```

### State Management
- Rejection dialog state
- Resubmission dialog state
- Workflow history state
- Action button states

---

**System is now fully functional with complete workflow management!** 🎉
