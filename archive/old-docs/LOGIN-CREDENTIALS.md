# 🔐 Login Credentials - Quick Reference

## Default User Accounts

All accounts are automatically created when you run `START-UNIFIED-SYSTEM.bat`

---

## 👤 ADMIN ACCOUNT

**Username**: `admin`  
**Password**: `admin123`  
**Role**: Administrator  
**Status**: Approved  
**Company**: Ethiopian Coffee & Tea Authority  
**Email**: admin@ecta.gov.et

**Permissions**:
- Full system access
- Approve/reject exporters
- View all data
- Manage users
- Access analytics

---

## 📦 EXPORTER ACCOUNTS (Approved)

### Exporter 1
**Username**: `exporter1`  
**Password**: `password123`  
**Status**: ✅ Approved  
**Company**: Ethiopian Coffee Exports Ltd  
**Email**: contact@ethiopiancoffee.com

### Exporter 2
**Username**: `exporter2`  
**Password**: `password123`  
**Status**: ✅ Approved  
**Company**: Addis Coffee Trading PLC  
**Email**: info@addiscoffee.com

**Permissions**:
- Register exports
- Submit ESW applications
- Upload documents
- Track shipments
- View own data

---

## 📦 EXPORTER ACCOUNT (Pending)

### Exporter 3
**Username**: `exporter3`  
**Password**: `password123`  
**Status**: ⏳ Pending Approval  
**Company**: Sidamo Coffee Traders  
**Email**: sales@sidamocoffee.com

**Note**: This account cannot login until approved by admin

---

## 🏦 BANK ACCOUNT

**Username**: `bank1`  
**Password**: `password123`  
**Role**: Commercial Bank  
**Status**: Approved  
**Company**: Commercial Bank of Ethiopia  
**Email**: forex@cbe.com.et

**Permissions**:
- Verify export documents
- Process forex transactions
- Issue letters of credit
- View exporter profiles

---

## 🏛️ ECTA ACCOUNT

**Username**: `ecta1`  
**Password**: `password123`  
**Role**: ECTA Officer  
**Status**: Approved  
**Company**: ECTA Quality Control Department  
**Email**: quality@ecta.gov.et

**Permissions**:
- Approve/reject pre-registrations
- Issue quality certificates
- Conduct inspections
- Manage exporter licenses

---

## 🛃 CUSTOMS ACCOUNT

**Username**: `customs1`  
**Password**: `password123`  
**Role**: Customs Officer  
**Status**: Approved  
**Company**: Ethiopian Customs Authority  
**Email**: clearance@customs.gov.et

**Permissions**:
- Process customs clearance
- Verify export documents
- Issue clearance certificates
- Track shipments

---

## 🏦 NATIONAL BANK ACCOUNT

**Username**: `nbe1`  
**Password**: `password123`  
**Role**: NBE Officer  
**Status**: Approved  
**Company**: National Bank of Ethiopia  
**Email**: forex@nbe.gov.et

**Permissions**:
- Monitor forex compliance
- Approve large transactions
- View financial reports
- Set exchange rates

---

## 📊 ECX ACCOUNT

**Username**: `ecx1`  
**Password**: `password123`  
**Role**: ECX Officer  
**Status**: Approved  
**Company**: Ethiopian Commodity Exchange  
**Email**: trading@ecx.com.et

**Permissions**:
- Verify coffee quality
- Issue ECX certificates
- Track lot information
- Manage warehouse receipts

---

## 🚢 SHIPPING ACCOUNT

**Username**: `shipping1`  
**Password**: `password123`  
**Role**: Shipping Agent  
**Status**: Approved  
**Company**: Ethiopian Shipping Lines  
**Email**: logistics@shipping.com.et

**Permissions**:
- Manage container bookings
- Track vessel schedules
- Issue shipping documents
- Update shipment status

---

## 🔒 Security Notes

### Password Policy
- Default passwords are for testing only
- Change passwords in production
- Use strong passwords (min 8 characters)
- Include uppercase, lowercase, numbers

### Account Status
- ✅ **Approved**: Can login and use system
- ⏳ **Pending**: Cannot login until approved
- ❌ **Rejected**: Cannot login

### Role-Based Access
Each role has specific permissions:
- **Admin**: Full system access
- **Exporter**: Export management
- **Bank**: Financial operations
- **ECTA**: Quality control & licensing
- **Customs**: Clearance operations
- **NBE**: Forex monitoring
- **ECX**: Commodity trading
- **Shipping**: Logistics operations

---

## 🚀 Quick Start

### 1. Start the System
```bash
START-UNIFIED-SYSTEM.bat
```

### 2. Open Frontend
http://localhost:5173

### 3. Login
Use any account from above

### 4. Explore
- Admin: Approve exporters, view analytics
- Exporter: Register exports, submit ESW
- Bank: Process transactions
- Others: Perform role-specific tasks

---

## 📝 Creating New Users

### Via Frontend (Exporter Registration)
1. Click "Register" on login page
2. Fill in company details
3. Submit application
4. Wait for admin approval

### Via Admin Panel
1. Login as admin
2. Go to "User Management"
3. Click "Add User"
4. Fill in details
5. Assign role and status

### Via API
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "companyName": "Company Name",
  "tin": "TIN123456",
  "capitalETB": 50000000
}
```

---

## 🔄 Password Reset

### For Testing
1. Stop system: `STOP-UNIFIED-SYSTEM.bat`
2. Start system: `START-UNIFIED-SYSTEM.bat`
3. Users are recreated with default passwords

### For Production
1. Implement password reset flow
2. Send reset email
3. User sets new password
4. Update in both PostgreSQL and Blockchain

---

## 📊 User Statistics

After seeding, you'll have:
- **1** Admin account
- **3** Exporter accounts (2 approved, 1 pending)
- **6** Organization accounts (bank, ECTA, customs, NBE, ECX, shipping)
- **Total**: 10 default users

All users are created in:
- ✅ PostgreSQL (fast queries)
- ✅ Blockchain (immutable records)

---

## 🎯 Testing Scenarios

### Scenario 1: Admin Workflow
1. Login as `admin`
2. View pending exporters
3. Approve `exporter3`
4. View analytics dashboard

### Scenario 2: Exporter Workflow
1. Login as `exporter1`
2. Register new export
3. Upload documents
4. Submit ESW application
5. Track shipment

### Scenario 3: Multi-Role Workflow
1. Exporter submits export
2. ECTA approves quality
3. Bank processes payment
4. Customs clears shipment
5. Shipping updates status

---

## 💡 Pro Tips

1. **Quick Login**: Use `admin` / `admin123` for fastest access
2. **Test Approval**: Use `exporter3` to test approval workflow
3. **Multi-Role**: Open multiple browsers to test different roles
4. **API Testing**: Use Postman with these credentials
5. **Reset Data**: Restart system to reset to default state

---

## 📞 Support

If you can't login:
1. Check system is running: `CHECK-HYBRID-STATUS.bat`
2. Verify credentials match this document
3. Check user status (pending users can't login)
4. Restart system: `STOP-UNIFIED-SYSTEM.bat` then `START-UNIFIED-SYSTEM.bat`
5. Check logs: `docker logs coffee-gateway -f`

---

**All users are ready to login immediately after system start!** 🎉

*Login Credentials Reference v1.0*  
*Last Updated: March 1, 2026*  
*Everyone Can Login!* 🔓
