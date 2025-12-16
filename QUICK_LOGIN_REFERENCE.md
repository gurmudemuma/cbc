# 🔐 Quick Login Reference Card

## 🚀 Quick Start

### Application URL
```
http://localhost:3010
```

---

## 👤 Test User Accounts

### Commercial Bank
```
Username: bank_user
Password: Bank@123456
Role: Banking Officer
```

### National Bank
```
Username: nbe_user
Password: NBE@123456
Role: FX Officer
```

### ECTA
```
Username: ecta_user
Password: ECTA@123456
Role: Quality Officer
```

### ECX
```
Username: ecx_user
Password: ECX@123456
Role: Lot Verifier
```

### Customs
```
Username: customs_user
Password: Customs@123456
Role: Customs Officer
```

### Shipping Line
```
Username: shipping_user
Password: Shipping@123456
Role: Shipping Officer
```

### Exporter Portal
```
Username: exporter_user
Password: Exporter@123456
Role: Exporter
```

### System Admin
```
Username: system_admin
Password: Admin@123456
Role: Admin
```

---

## 📋 Setup Instructions

### 1. Create Database Tables
```bash
psql -U postgres -d coffee_export_db -f \
  /home/gu-da/cbc/apis/shared/database/migrations/007_create_users_table.sql
```

### 2. Create Test Users
```bash
psql -U postgres -d coffee_export_db -f \
  /home/gu-da/cbc/CREATE_TEST_USERS.sql
```

### 3. Verify Setup
```bash
psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) FROM users;"
```

### 4. Start Application
```bash
cd /home/gu-da/cbc/frontend
npm start
```

### 5. Open Browser
```
http://localhost:3010
```

---

## 🔑 Login Steps

1. **Open Application**
   - Go to http://localhost:3010

2. **Select Organization**
   - Choose from dropdown (Commercial Bank, National Bank, etc.)

3. **Enter Username**
   - Use username from table above

4. **Enter Password**
   - Use password from table above

5. **Click Sign In**
   - System authenticates
   - Redirected to dashboard

---

## 🔍 Verify Login

### Check PostgreSQL
```bash
psql -U postgres -d coffee_export_db -c "
SELECT username, last_login FROM users WHERE username = 'bank_user';
"
```

### Check Blockchain
```bash
docker exec cli peer chaincode query \
  -C coffeechannel \
  -n user-management \
  -c '{"function":"GetUserByUsername","Args":["bank_user"]}'
```

---

## 📊 All Test Users

| Username | Password | Organization | Role |
|----------|----------|---------------|------|
| bank_user | Bank@123456 | Commercial Bank | Banking Officer |
| nbe_user | NBE@123456 | National Bank | FX Officer |
| ecta_user | ECTA@123456 | ECTA | Quality Officer |
| ecx_user | ECX@123456 | ECX | Lot Verifier |
| customs_user | Customs@123456 | Customs | Customs Officer |
| shipping_user | Shipping@123456 | Shipping Line | Shipping Officer |
| exporter_user | Exporter@123456 | Exporter Portal | Exporter |
| system_admin | Admin@123456 | System | Admin |

---

## 🆘 Troubleshooting

### "Invalid credentials"
- Verify username and password are correct
- Check user exists: `SELECT * FROM users WHERE username = 'bank_user';`
- Verify user is active: `is_active = true`

### "Blockchain authentication failed"
- Check blockchain is running: `docker ps | grep fabric`
- Check API is running: `curl http://localhost:3001/health`
- Check user on blockchain: `docker exec cli peer chaincode query -C coffeechannel -n user-management -c '{"function":"GetUserByUsername","Args":["bank_user"]}'`

### "Token expired"
- Logout and login again
- Clear browser cache
- Check system time

---

## 📚 Documentation

- **Full Setup Guide**: `USER_SETUP_GUIDE.md`
- **Alignment Details**: `USER_MANAGEMENT_ALIGNMENT.md`
- **Complete Summary**: `USER_MANAGEMENT_COMPLETE.md`
- **Integration Status**: `INTEGRATION_VERIFICATION.md`

---

## ✅ Status

- [x] Database tables created
- [x] Test users configured
- [x] Blockchain synchronized
- [x] Frontend login working
- [x] Ready to use

---

**Ready to log in!** 🎉

Choose any user from the table above and start using the application.
