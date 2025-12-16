# Quick Test Guide - Frontend & Backend Integration

## 🚀 System Status
- ✅ Backend: All 5 APIs connected to Fabric
- ✅ Frontend: Running at http://localhost:5173
- ✅ Test Users: All registered successfully

## 🔐 Test Login Credentials

### Option 1: Exporter (Commercial Bank)
```
Organization: Commercial Bank
Username: exporter1
Password: Exporter123
Role: Create and manage export requests
```

### Option 2: Banker (Commercial Bank)
```
Organization: Commercial Bank
Username: banker1
Password: Banker123
Role: Banking operations and document verification
```

### Option 3: Governor (National Bank)
```
Organization: NBE (National Bank of Ethiopia)
Username: governor1
Password: Governor123
Role: Foreign exchange approval
```

### Option 4: Inspector (ECTA)
```
Organization: ECTA
Username: inspector1
Password: Inspector123
Role: Quality certification
```

### Option 5: Shipper (Shipping Line)
```
Organization: Shipping Line
Username: shipper1
Password: Shipper123
Role: Shipment management
```

### Option 6: Customs Officer
```
Organization: Customs
Username: custom1
Password: Custom123
Role: Export clearance
```

## 🧪 How to Test

### Step 1: Open Frontend
Open your browser and navigate to:
```
http://localhost:5173
```

### Step 2: Login
1. Select an organization from the dropdown
2. Enter the username and password
3. Click "Sign In"

### Step 3: Verify Dashboard
- Each user should see a role-specific dashboard
- Check that the organization name is displayed correctly
- Verify navigation menu shows appropriate options

## 🔍 What to Check

### For Exporter (exporter1)
- ✅ Can create new export requests
- ✅ Can view export list
- ✅ Dashboard shows "Create & Manage Exports"

### For Banker (banker1)
- ✅ Can view banking operations
- ✅ Can verify documents
- ✅ Dashboard shows "Banking Operations"

### For Governor (governor1)
- ✅ Can approve foreign exchange
- ✅ Can view pending FX requests
- ✅ Dashboard shows "FX Approval & Compliance"

### For Inspector (inspector1)
- ✅ Can certify coffee quality
- ✅ Can issue quality certificates
- ✅ Dashboard shows "Quality Certification"

## 🐛 Troubleshooting

### If login fails:
1. Check API is running: `curl http://localhost:3001/health`
2. Check frontend console for errors (F12 in browser)
3. Verify organization selection matches user's org

### If dashboard doesn't load:
1. Check browser console for errors
2. Verify token is stored in localStorage
3. Check API connectivity

### If role-based features don't work:
1. Verify user role in response: `curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"exporter1","password":"Exporter123"}'`
2. Check frontend role detection logic

## 📊 API Health Check
```bash
# Check all APIs are healthy
curl http://localhost:3001/health | jq
curl http://localhost:3002/health | jq
curl http://localhost:3003/health | jq
curl http://localhost:3004/health | jq
curl http://localhost:3005/health | jq
```

All should return `"fabric": "connected"`

## 🎯 Expected Behavior

1. **Login**: Should redirect to appropriate dashboard based on role
2. **Navigation**: Should show role-specific menu items
3. **Permissions**: Should only allow actions appropriate for the role
4. **Organization**: Should display correct organization name (Commercial Bank, not commercialbank)

## ✅ Success Criteria

- [ ] All 6 test users can login successfully
- [ ] Each user sees their role-specific dashboard
- [ ] Organization names display correctly (Commercial Bank, not commercialbank)
- [ ] Role-based permissions work correctly
- [ ] No console errors in browser
- [ ] API calls succeed (check Network tab in browser DevTools)
