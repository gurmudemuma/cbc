# Role-Based Routing & Task Management

## Overview
Each user is routed to their primary task page upon login and sees only sidebar items relevant to their role and responsibilities.

---

## 🏢 **commercialbank**

### **Login Redirect**
`/exports` - Export Management page

### **Sidebar Menu**
1. **My Exports** - View all created exports
2. **Pending** - Exports awaiting approval
3. **Rejected** - Exports that need resubmission
4. **Completed** - Successfully completed exports
5. **Users** - User management

### **Primary Tasks**
- ✅ Create new export requests
- ✅ Upload required documents
- ✅ Track export status
- ✅ Resubmit rejected exports
- ✅ View rejection feedback

### **Workflow Position**
**INITIATOR** - Starts the export process

---

## 🏦 **National Bank**

### **Login Redirect**
`/fx-approval` - FX Approval & Compliance page

### **Sidebar Menu**
1. **FX Pending** - Exports awaiting FX approval
2. **FX Approved** - Approved exports
3. **FX Rates** - Foreign exchange rates
4. **All Exports** - Complete export list
5. **Users** - User management

### **Primary Tasks**
- ✅ Review FX applications
- ✅ Approve or reject FX requests
- ✅ Verify compliance
- ✅ Manage FX rates
- ✅ Provide rejection feedback

### **Workflow Position**
**STAGE 1** - FX & Compliance approval (after export creation)

---

## 🔬 **ECTA (Quality Certification)**

### **Login Redirect**
`/quality` - Quality Certification page

### **Sidebar Menu**
1. **Pending Certification** - Exports awaiting quality check
2. **Certified** - Quality-certified exports
3. **Quality Reports** - Certification reports
4. **All Exports** - Complete export list
5. **Users** - User management

### **Primary Tasks**
- ✅ Review coffee quality specifications
- ✅ Certify or reject quality
- ✅ Issue quality certificates
- ✅ Generate quality reports
- ✅ Provide quality feedback

### **Workflow Position**
**STAGE 2** - Quality certification (after FX approval)

---

## 🛃 **Custom Authorities**

### **Login Redirect**
`/customs` - Customs Clearance page

### **Sidebar Menu**
1. **Pending Clearance** - Exports awaiting customs
2. **Cleared** - Customs-cleared exports
3. **Customs Reports** - Clearance reports
4. **All Exports** - Complete export list
5. **Users** - User management

### **Primary Tasks**
- ✅ Review customs documentation
- ✅ Clear or reject customs
- ✅ Verify compliance
- ✅ Generate clearance reports
- ✅ Provide clearance feedback

### **Workflow Position**
**STAGE 3** - Customs clearance (after quality certification)

---

## 🚢 **Shipping Line**

### **Login Redirect**
`/shipments` - Shipment Management page

### **Sidebar Menu**
1. **Pending Shipments** - Exports ready for shipment
2. **Scheduled** - Scheduled shipments
3. **Shipped** - Shipped exports
4. **All Exports** - Complete export list
5. **Users** - User management

### **Primary Tasks**
- ✅ Review shipment requirements
- ✅ Schedule shipments
- ✅ Track shipments
- ✅ Mark as shipped
- ✅ Provide logistics feedback

### **Workflow Position**
**STAGE 4** - Shipment & delivery (after customs clearance)

---

## 🔄 **Complete Workflow Flow**

```
1. commercialbank
   └─> Creates export request
   └─> Uploads documents
   └─> Submits for approval
        ↓
2. National Bank
   └─> Reviews FX application
   └─> Approves/Rejects FX
   └─> Verifies compliance
        ↓
3. ECTA
   └─> Reviews coffee quality
   └─> Certifies/Rejects quality
   └─> Issues certificate
        ↓
4. Custom Authorities
   └─> Reviews customs docs
   └─> Clears/Rejects customs
   └─> Issues clearance
        ↓
5. Shipping Line
   └─> Reviews shipment
   └─> Schedules/Rejects shipment
   └─> Marks as shipped
        ↓
6. COMPLETED ✅
```

---

## 🎯 **Role-Specific Features**

### **commercialbank Only**
- Create new exports
- Resubmit rejected exports
- Upload documents
- Edit export details

### **National Bank Only**
- Approve/Reject FX
- Manage FX rates
- View financial compliance

### **ECTA Only**
- Certify/Reject quality
- Issue quality certificates
- Generate quality reports

### **Custom Authorities Only**
- Clear/Reject customs
- Issue clearance certificates
- Generate customs reports

### **Shipping Line Only**
- Schedule shipments
- Mark as shipped
- Track shipments
- Manage logistics

---

## 🔐 **Access Control**

### **What Each Role Can See**

| Feature | Exporter | National Bank | ECTA | Customs | Shipping |
|---------|----------|---------------|------|---------|----------|
| Create Export | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Exports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve FX | ❌ | ✅ | ❌ | ❌ | ❌ |
| Certify Quality | ❌ | ❌ | ✅ | ❌ | ❌ |
| Clear Customs | ❌ | ❌ | ❌ | ✅ | ❌ |
| Schedule Shipment | ❌ | ❌ | ❌ | ❌ | ✅ |
| Resubmit Export | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Rejection | ✅ | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📊 **Sidebar Badge Counts**

Each sidebar item shows a count badge:

**commercialbank:**
- My Exports: Total exports created
- Pending: Exports in any pending state
- Rejected: Exports needing resubmission
- Completed: Successfully completed exports

**National Bank:**
- FX Pending: Exports awaiting FX approval
- FX Approved: FX-approved exports
- All Exports: Total visible exports

**ECTA:**
- Pending Certification: Exports awaiting quality check
- Certified: Quality-certified exports
- All Exports: Total visible exports

**Custom Authorities:**
- Pending Clearance: Exports awaiting customs
- Cleared: Customs-cleared exports
- All Exports: Total visible exports

**Shipping Line:**
- Pending Shipments: Exports ready for shipment
- Scheduled: Scheduled shipments
- Shipped: Shipped exports
- All Exports: Total visible exports

---

## 🎨 **UI Consistency**

### **All Portals Have:**
- ✅ Persistent left sidebar (desktop)
- ✅ Mobile-responsive drawer (mobile)
- ✅ Sticky right Quick Actions panel
- ✅ Role-specific title and subtitle
- ✅ Active item highlighting
- ✅ Badge counts per view
- ✅ Search and filter capabilities

### **Color Coding:**
- 🟡 **Pending/Warning** - Items awaiting action
- 🟢 **Success/Approved** - Completed items
- 🔴 **Error/Rejected** - Items needing attention
- 🔵 **Info** - General information

---

## 🚀 **Login Flow**

1. User enters credentials
2. System authenticates user
3. System detects organization:
   - `exporter` → `/exports`
   - `nb-regulatory`, `banker` → `/fx-approval`
   - `ncat` → `/quality`
   - `customauthorities` → `/customs`
   - `shipping` → `/shipments`
4. User lands on role-specific page
5. Sidebar shows role-specific menu
6. Quick Actions show role-specific buttons

---

## 📱 **Responsive Behavior**

### **Desktop (>900px)**
- Permanent left sidebar (260px)
- Main content area (flexible)
- Sticky right panel (25%)

### **Tablet (600-900px)**
- Toggleable left drawer
- Main content (full width)
- Right panel below content

### **Mobile (<600px)**
- Menu button → drawer
- Stacked layout
- Full-width components

---

## ✨ **Key Benefits**

1. **Role-Focused** - Users see only what they need
2. **Task-Oriented** - Sidebar items match daily tasks
3. **Efficient** - Quick access to pending work
4. **Transparent** - Badge counts show workload
5. **Consistent** - Same UX across all portals
6. **Responsive** - Works on all devices
7. **Accessible** - Proper ARIA labels and navigation

---

**Every user now has a personalized, role-specific experience!** 🎉
