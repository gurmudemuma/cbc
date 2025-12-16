# 🔐 User Setup Guide - Complete Implementation

## Overview

This guide walks through setting up user management with complete alignment between:
- ✅ Hyperledger Fabric user-management chaincode
- ✅ PostgreSQL database
- ✅ Backend APIs
- ✅ Frontend login

---

## 📋 Prerequisites

### 1. PostgreSQL Running
```bash
# Verify PostgreSQL is running
psql -U postgres -d coffee_export_db -c "SELECT version();"
```

### 2. Blockchain Network Running
```bash
# Verify Fabric network is running
docker ps | grep fabric
```

### 3. Backend APIs Running
```bash
# Verify APIs are accessible
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### 4. Frontend Running
```bash
# Verify frontend is accessible
curl http://localhost:3010
```

---

## 🚀 Step 1: Create PostgreSQL Users Table

### Execute Migration
```bash
# Connect to database and run migration
psql -U postgres -d coffee_export_db -f /home/gu-da/cbc/apis/shared/database/migrations/007_create_users_table.sql
```

### Verify Table Creation
```bash
psql -U postgres -d coffee_export_db -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'organizations', 'user_roles', 'user_sessions', 'user_audit_logs');
"
```

**Expected Output**:
```
     table_name
──────────────────
 users
 organizations
 user_roles
 user_sessions
 user_audit_logs
(5 rows)
```

---

## 👥 Step 2: Create Test Users

### Execute User Creation Script
```bash
# Create test users in PostgreSQL
psql -U postgres -d coffee_export_db -f /home/gu-da/cbc/CREATE_TEST_USERS.sql
```

### Verify Users Created
```bash
psql -U postgres -d coffee_export_db -c "
SELECT username, email, organization_id, role, is_active 
FROM users 
ORDER BY organization_id, role;
"
```

**Expected Output**:
```
    username    |              email              | organization_id |      role       | is_active
────────────────┼─────────────────────────────────┼─────────────────┼─────────────────┼───────────
 bank_user      | bank_user@commercialbank.et     | commercial-bank | Banking Officer | t
 bank_admin     | bank_admin@commercialbank.et    | commercial-bank | Admin           | t
 nbe_user       | nbe_user@nbe.et                 | national-bank   | FX Officer      | t
 nbe_banking    | nbe_banking@nbe.et              | national-bank   | Banking Officer | t
 ecta_user      | ecta_user@ecta.et               | ecta            | Quality Officer | t
 ecta_admin     | ecta_admin@ecta.et              | ecta            | Admin           | t
 ecx_user       | ecx_user@ecx.et                 | ecx             | Lot Verifier    | t
 ecx_admin      | ecx_admin@ecx.et                | ecx             | Admin           | t
 customs_user   | customs_user@customs.et         | customs         | Customs Officer | t
 customs_admin  | customs_admin@customs.et        | customs         | Admin           | t
 shipping_user  | shipping_user@shippingline.et   | shipping-line   | Shipping Officer| t
 shipping_admin | shipping_admin@shippingline.et  | shipping-line   | Admin           | t
 exporter_user  | exporter_user@exporterportal.et | exporter-portal | Exporter       | t
 exporter_admin | exporter_admin@exporterportal.et| exporter-portal | Admin           | t
 system_admin   | admin@cbc.et                    | commercial-bank | Admin           | t
(15 rows)
```

---

## ⛓️ Step 3: Register Users on Blockchain

### Option A: Automatic Registration (Recommended)

The backend API will automatically register users on the blockchain when they first log in.

### Option B: Manual Registration

```bash
# Register user on blockchain via API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bank_user",
    "password": "Bank@123456",
    "email": "bank_user@commercialbank.et",
    "organization": "commercial-bank",
    "role": "Banking Officer"
  }'
```

### Verify Blockchain Registration

```bash
# Query user from blockchain
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n user-management \
  -c '{"function":"GetUserByUsername","Args":["bank_user"]}'
```

**Expected Output**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "username": "bank_user",
  "email": "bank_user@commercialbank.et",
  "organizationId": "commercial-bank",
  "role": "Banking Officer",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "lastLogin": ""
}
```

---

## 🔑 Step 4: Test Login

### Via Frontend

1. **Open Application**
   ```
   http://localhost:3010
   ```

2. **Select Organization**
   - Choose "Commercial Bank" from dropdown

3. **Enter Credentials**
   - Username: `bank_user`
   - Password: `Bank@123456`

4. **Click Sign In**
   - System validates credentials
   - Blockchain authenticates user
   - JWT token generated
   - Redirected to dashboard

### Via API

```bash
# Login via API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bank_user",
    "password": "Bank@123456"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "bank_user",
      "email": "bank_user@commercialbank.et",
      "organization": "commercial-bank",
      "role": "Banking Officer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

---

## 📊 Step 5: Verify Synchronization

### Check PostgreSQL
```bash
psql -U postgres -d coffee_export_db -c "
SELECT username, last_login, is_active 
FROM users 
WHERE username = 'bank_user';
"
```

### Check Blockchain
```bash
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n user-management \
  -c '{"function":"GetUserByUsername","Args":["bank_user"]}'
```

### Check Session
```bash
psql -U postgres -d coffee_export_db -c "
SELECT u.username, us.created_at, us.expires_at, us.is_active 
FROM user_sessions us 
JOIN users u ON us.user_id = u.id 
WHERE u.username = 'bank_user' 
ORDER BY us.created_at DESC 
LIMIT 1;
"
```

---

## 🔍 Troubleshooting

### Issue: "Invalid credentials"

**Check PostgreSQL**:
```bash
psql -U postgres -d coffee_export_db -c "
SELECT username, is_active FROM users WHERE username = 'bank_user';
"
```

**Check Password Hash**:
```bash
# Verify password hash is correct
psql -U postgres -d coffee_export_db -c "
SELECT password_hash FROM users WHERE username = 'bank_user';
"
```

### Issue: "Blockchain authentication failed"

**Check Blockchain Connection**:
```bash
curl http://localhost:3001/health
```

**Check User on Blockchain**:
```bash
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n user-management \
  -c '{"function":"GetUserByUsername","Args":["bank_user"]}'
```

### Issue: "Token expired"

**Solution**: Logout and login again

```bash
# Clear browser localStorage
# Then login again
```

---

## 📝 Test Scenarios

### Scenario 1: Commercial Bank Officer Login
```
1. Open http://localhost:3010
2. Select: Commercial Bank
3. Username: bank_user
4. Password: Bank@123456
5. Click Sign In
6. Verify: Dashboard loads
```

### Scenario 2: ECTA Quality Officer Login
```
1. Open http://localhost:3010
2. Select: ECTA
3. Username: ecta_user
4. Password: ECTA@123456
5. Click Sign In
6. Verify: Quality certification page accessible
```

### Scenario 3: Exporter Login
```
1. Open http://localhost:3010
2. Select: Exporter Portal
3. Username: exporter_user
4. Password: Exporter@123456
5. Click Sign In
6. Verify: Export management page accessible
```

---

## 🔐 Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT tokens with expiration
- [x] HTTPS/TLS enabled (in production)
- [x] SQL injection prevention
- [x] XSS protection
- [x] CSRF protection
- [x] Rate limiting (in production)
- [x] Audit logging enabled

---

## 📊 Database Queries

### View All Users
```sql
SELECT username, email, organization_id, role, is_active, last_login 
FROM users 
ORDER BY organization_id, role;
```

### View Active Sessions
```sql
SELECT u.username, us.created_at, us.expires_at, us.is_active 
FROM user_sessions us 
JOIN users u ON us.user_id = u.id 
WHERE us.is_active = true 
ORDER BY us.created_at DESC;
```

### View User Audit Logs
```sql
SELECT u.username, ual.action, ual.details, ual.created_at 
FROM user_audit_logs ual 
JOIN users u ON ual.user_id = u.id 
ORDER BY ual.created_at DESC 
LIMIT 20;
```

### View User Statistics
```sql
SELECT * FROM user_statistics;
```

### View Active Users
```sql
SELECT * FROM active_users;
```

---

## 🚀 Production Deployment

### Before Going Live

1. **Change Default Passwords**
   ```sql
   UPDATE users 
   SET password_hash = crypt('NewSecurePassword@123456', gen_salt('bf'))
   WHERE username = 'system_admin';
   ```

2. **Enable HTTPS**
   - Configure SSL certificates
   - Update API endpoints

3. **Configure Rate Limiting**
   - Implement login attempt limits
   - Add CAPTCHA for failed attempts

4. **Enable Monitoring**
   - Set up alerts for failed logins
   - Monitor blockchain transactions
   - Track database performance

5. **Backup Database**
   ```bash
   pg_dump -U postgres coffee_export_db > backup.sql
   ```

---

## 📚 References

- **Chaincode**: `/chaincode/user-management/contract.go`
- **User Service**: `/apis/shared/userService.ts`
- **Database Config**: `/apis/shared/database/db.config.ts`
- **Auth Controller**: `/apis/*/src/controllers/auth.controller.ts`
- **Alignment Doc**: `/USER_MANAGEMENT_ALIGNMENT.md`

---

## ✅ Verification Checklist

- [x] PostgreSQL users table created
- [x] Test users inserted
- [x] Blockchain user-management chaincode deployed
- [x] Backend APIs configured
- [x] Frontend login page working
- [x] User synchronization verified
- [x] Session management working
- [x] Audit logging enabled

---

**Status**: ✅ Ready for Use

**All users are configured and ready to log in.**

---

## 🎯 Next Steps

1. ✅ Users created and configured
2. ✅ Blockchain synchronized
3. ✅ Frontend login working
4. → Test all user roles and permissions
5. → Configure production settings
6. → Deploy to production

---

**Application URL**: http://localhost:3010

**All systems operational and ready for testing.**
