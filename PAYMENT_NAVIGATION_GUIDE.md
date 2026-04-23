# Payment System Navigation Guide

## Quick Access Routes

### 🏢 For Exporters

#### Main Payment Dashboard
```
URL: /payments
Features:
- View all payments
- Initiate new payments
- Track payment status
- Submit documents
- View statistics
```

#### Initiate New Payment
```
URL: /payments/new
OR: Click "Initiate Payment" button on /payments
```

#### View Payment Details
```
URL: /payments/:id
OR: Click "View Details" icon on any payment
```

#### Filter by Status
```
/payments/initiated   - View initiated payments
/payments/completed   - View completed payments
```

---

### 🏦 For Commercial Banks

#### Payment Review Dashboard
```
URL: /banking/payment-review
OR: /banking/payments

Features:
- Review pending payments
- Verify documents
- Approve/reject payments
- Open Letters of Credit
- Process payments
```

#### Banking Operations
```
URL: /banking
Submenu includes:
- Documents (/banking/documents)
- Payment Review (/banking/payment-review)
- Financing (/banking/financing)
- Compliance (/banking/compliance)
```

---

### 🏛️ For National Bank of Ethiopia (NBE)

#### FX Approval Dashboard
```
URL: /fx/payment-approval
OR: /fx/payments

Features:
- Review FX requests
- Set exchange rates
- Approve/reject FX
- View FX statistics
- Monitor daily approvals
```

#### FX Management
```
URL: /fx
Submenu includes:
- FX Rates (/fx/rates)
- FX Approvals (/fx/approvals)
- Payment Approval (/fx/payment-approval)
- Approved (/fx/approved)
- Rejected (/fx/rejected)
```

---

## Navigation Menu Structure

### Exporter Portal Menu
```
📊 Dashboard
📦 Exports
   ├─ Export Management
   ├─ New Export
   └─ Export Status
💰 Payments                    ← NEW!
   ├─ All Payments
   ├─ Initiate Payment
   ├─ Initiated
   └─ Completed
📄 Documents
👤 Profile
📞 Support
```

### Commercial Bank Menu
```
📊 Dashboard
🏦 Banking
   ├─ Operations
   ├─ Documents
   ├─ Payment Review          ← NEW!
   ├─ Financing
   └─ Compliance
📦 Exports
💱 FX Rates
👥 Users
```

### NBE Menu
```
📊 Dashboard
💱 FX Management
   ├─ FX Rates
   ├─ FX Approvals
   ├─ Payment Approval        ← NEW!
   ├─ Approved
   └─ Rejected
🏦 Banking
📈 Monetary Policy
📊 Reports
```

---

## User Workflows

### Workflow 1: Exporter Initiates Payment

```
1. Login as Exporter
   ↓
2. Navigate to /payments
   ↓
3. Click "Initiate Payment"
   ↓
4. Fill in payment form:
   - Select Export ID
   - Choose Payment Method (LC/TT/CAD/DP/DA/OA)
   - Enter Amount & Currency
   - Add LC details (if LC selected)
   - Add notes
   ↓
5. Click "Initiate Payment"
   ↓
6. Payment created with status: INITIATED
   ↓
7. Click "Submit Documents" icon
   ↓
8. Add required documents:
   - Commercial Invoice
   - Packing List
   - Bill of Lading
   - Certificate of Origin
   ↓
9. Click "Submit Documents"
   ↓
10. Payment status: DOCUMENTS_SUBMITTED
```

### Workflow 2: Bank Reviews Payment

```
1. Login as Bank User
   ↓
2. Navigate to /banking/payment-review
   ↓
3. View pending payments list
   ↓
4. Click "View Details" on a payment
   ↓
5. Review payment information:
   - Payment details
   - Export information
   - Submitted documents
   ↓
6. Click "Approve" button
   ↓
7. Enter:
   - Bank Reference Number
   - Approval Notes
   ↓
8. Click "Approve Payment"
   ↓
9. Payment status: APPROVED
```

### Workflow 3: NBE Approves FX

```
1. Login as NBE Official
   ↓
2. Navigate to /fx/payment-approval
   ↓
3. View pending FX approvals
   ↓
4. Click "View Details" on a payment
   ↓
5. Review FX request:
   - Payment amount (USD/EUR)
   - Exporter details
   - Export information
   ↓
6. Click "Approve FX"
   ↓
7. Enter:
   - Exchange Rate (ETB/USD)
   - NBE Reference Number
   - Approval Notes
   ↓
8. System calculates ETB amount
   ↓
9. Click "Approve FX"
   ↓
10. Payment status: FX_APPROVED
```

---

## Quick Reference: Payment Status Flow

```
INITIATED
   ↓
DOCUMENTS_SUBMITTED
   ↓
UNDER_REVIEW (Bank reviewing)
   ↓
APPROVED (Bank approved)
   ↓
FX_APPROVED (NBE approved exchange)
   ↓
PROCESSING (Payment being processed)
   ↓
COMPLETED (Payment successful)
```

### Alternative Paths:
```
Any Status → FAILED (Payment failed)
Any Status → DISPUTED (Payment disputed)
COMPLETED → REFUNDED (Payment refunded)
```

---

## Payment Methods Quick Reference

| Method | Code | Description | Security | Speed |
|--------|------|-------------|----------|-------|
| Letter of Credit | LC | Bank-guaranteed payment | High | Slow |
| Telegraphic Transfer | TT | Direct bank transfer | Medium | Fast |
| Cash Against Documents | CAD | Payment on document presentation | Medium | Medium |
| Documents Against Payment | DP | Payment before document release | Medium | Medium |
| Documents Against Acceptance | DA | Payment after acceptance | Low | Slow |
| Open Account | OA | Payment after delivery | Low | Fast |

---

## Document Types Required

### For Letter of Credit (LC)
- ✅ Commercial Invoice
- ✅ Packing List
- ✅ Bill of Lading
- ✅ Certificate of Origin
- ✅ Insurance Certificate
- ✅ Quality Certificate
- ✅ Phytosanitary Certificate

### For Other Methods
- ✅ Commercial Invoice (Required)
- ✅ Packing List (Required)
- ✅ Bill of Lading (Required)
- ✅ Certificate of Origin (Recommended)
- ✅ Quality Certificate (Recommended)

---

## Keyboard Shortcuts (Future Enhancement)

```
Ctrl + N  - New Payment (on /payments)
Ctrl + R  - Refresh List
Ctrl + F  - Search Payments
Ctrl + D  - View Details (when payment selected)
Esc       - Close Dialog
```

---

## Mobile Access

All payment pages are fully responsive and work on:
- 📱 Mobile phones (iOS/Android)
- 📱 Tablets
- 💻 Desktop browsers
- 🖥️ Large screens

---

## Browser Support

✅ Chrome (recommended)
✅ Firefox
✅ Safari
✅ Edge
✅ Opera

---

## API Endpoints Reference

### Exporter Endpoints
```
POST   /api/payments/initiate
GET    /api/payments
GET    /api/payments/:id
POST   /api/payments/:id/documents
GET    /api/payments/statistics
```

### Bank Endpoints
```
GET    /api/payments/bank/pending-review
POST   /api/payments/bank/:id/approve
POST   /api/payments/bank/:id/reject
POST   /api/payments/bank/:id/lc/open
POST   /api/payments/bank/:id/process
```

### NBE Endpoints
```
GET    /api/payments/nbe/pending-fx-approval
POST   /api/payments/nbe/:id/fx/approve
POST   /api/payments/nbe/:id/fx/reject
GET    /api/payments/nbe/statistics
```

---

## Troubleshooting

### Can't see payment menu?
- Check your user role (must be Exporter, Bank, or NBE)
- Verify you're logged in
- Clear browser cache

### Payment initiation fails?
- Verify export ID exists
- Check amount is positive
- Ensure payment method is selected
- Verify all required fields are filled

### Document upload not working?
- Check file size (max 10MB)
- Verify file type is supported
- Ensure payment status is INITIATED

### FX approval not showing?
- Verify you're logged in as NBE user
- Check payment has status APPROVED
- Refresh the page

---

## Support

For technical support or questions:
- 📧 Email: support@coffeeexport.et
- 📞 Phone: +251-11-XXX-XXXX
- 💬 In-app: Navigate to /support

---

**Last Updated:** 2024
**Version:** 1.0.0
