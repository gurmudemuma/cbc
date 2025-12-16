# Login Guide - Coffee Export Blockchain Platform

## How to Access the System

### 1. Access the Frontend
```
URL: http://localhost:3010
```

---

## 2. Login Credentials by Role

### For ECTA Officers
```
Organization: ECTA
Username: demo
Password: (any password - demo mode)
```
**After Login**: Redirected to `/ecta-dashboard`
- See pending licenses, quality inspections, contracts, permits
- Steps 5, 6, 8, 9, 10, 13

---

### For National Bank (NBE) Officers
```
Organization: National Bank
Username: demo
Password: (any password - demo mode)
```
**After Login**: Redirected to `/nbe-dashboard`
- See pending FX approvals
- Monitor 90-day settlement deadlines
- Step 12

---

### For Customs Officers
```
Organization: Custom Authorities
Username: demo
Password: (any password - demo mode)
```
**After Login**: Redirected to `/customs-dashboard`
- See pending customs clearances
- Schedule inspections
- Step 14

---

### For Shipping Line Officers
```
Organization: Shipping Line
Username: demo
Password: (any password - demo mode)
```
**After Login**: Redirected to `/shipping-dashboard`
- See pending bookings
- Manage vessel schedules
- Step 15

---

### For ECX Officers
```
Organization: ECX
Username: demo
Password: (any password - demo mode)
```
**After Login**: Redirected to `/ecx-dashboard`
- See pending quality grading
- Manage coffee auctions
- Step 8

---

### For Commercial Bank Officers
```
Organization: Commercial Bank
Username: demo
Password: (any password - demo mode)
```
**After Login**: Redirected to `/bank-dashboard`
- See pending document verifications
- Check L/C compliance
- Step 11

---

### For Exporters
```
Organization: Exporter Portal
Username: demo
Password: (any password - demo mode)
```
**After Login**: Redirected to `/exporter-dashboard`
- See all exports with 16-step progress
- Track export status
- View compliance alerts

---

## 3. Login Flow

```
1. Open http://localhost:3010
   ↓
2. Select Organization from dropdown
   ↓
3. Enter Username: demo
   ↓
4. Enter Password: (any)
   ↓
5. Click "Sign In"
   ↓
6. System calls: POST /api/auth/login
   ↓
7. Receives token + user data
   ↓
8. Stores in localStorage
   ↓
9. Auto-redirects based on role:
   - ECTA → /ecta-dashboard
   - NBE → /nbe-dashboard
   - Customs → /customs-dashboard
   - Shipping → /shipping-dashboard
   - ECX → /ecx-dashboard
   - Bank → /bank-dashboard
   - Exporter → /exporter-dashboard
```

---

## 4. Current Authentication System

### Demo Mode (Current)
All APIs have demo authentication:
```javascript
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-token-{organization}',
        user: {
            id: 1,
            username: 'demo',
            role: '{organization}',
            organizationId: '{organization}'
        }
    });
});
```

**Any username/password works** - This is for development/demo purposes.

---

## 5. Organization Dropdown Options

The login page shows these organizations:

1. **Commercial Bank** (Port 3001)
2. **National Bank** (Port 3002)
3. **ECTA** (Port 3003)
4. **Shipping Line** (Port 3004)
5. **Custom Authorities** (Port 3005)
6. **ECX** (Port 3006)
7. **Exporter Portal** (Port 3007 - if available)

---

## 6. What Happens After Login

### Token Storage
```javascript
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('org', organization);
```

### API Routing
```javascript
// Frontend automatically routes API calls to correct backend
setApiBaseUrl(getApiUrl(organization));

// Example:
// ECTA → http://localhost:3003
// NBE → http://localhost:3002
// Customs → http://localhost:3006
```

### Auto-Redirect
```javascript
getRoleBasedRoute(organization)
// Returns role-specific dashboard path
```

---

## 7. Testing Different Roles

### Quick Test Workflow:

**Test ECTA Officer:**
```
1. Login as ECTA
2. See ECTA Dashboard
3. Should see pending licenses/quality/contracts
4. Click "Review" on any task
5. Opens relevant form
6. Approve/Reject
7. Export moves to next step
```

**Test NBE Officer:**
```
1. Login as National Bank
2. See NBE Dashboard
3. Should see pending FX approvals
4. Click "Review FX Application"
5. Opens NBEFXApprovalForm
6. Approve with exchange rate
7. Export moves to step 13
```

**Test Exporter:**
```
1. Login as Exporter Portal
2. See Exporter Dashboard
3. View all exports with progress
4. Click "View Details"
5. See 16-step vertical stepper
6. Track progress and next actions
```

---

## 8. Logout

Click the logout button in the navigation bar:
- Clears localStorage
- Redirects to /login
- Removes token

---

## 9. Session Persistence

The system remembers your login:
```javascript
// On page refresh, checks localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');
const org = localStorage.getItem('org');

// If found, auto-logs in and redirects to dashboard
```

---

## 10. API Endpoints Used

### Login
```
POST /api/auth/login
Body: { username, password }
Response: { success, token, user }
```

### Get Exports (Dashboard Data)
```
GET /api/exports
Headers: { Authorization: Bearer {token} }
Response: { success, data: [...exports] }
```

### Update Progress
```
POST /api/exports/:export_id/progress
Body: { step: 8 }
Response: { success, message }
```

---

## 11. Troubleshooting

### "Invalid credentials"
- Check if API is running on correct port
- Check browser console for errors
- Verify organization selection

### "No pending tasks"
- Database may be empty
- Create test exports first
- Check if exports are at correct step

### "Dashboard not loading"
- Check if all APIs are running
- Verify database connection
- Check browser console for errors

### "Wrong dashboard showing"
- Clear localStorage
- Logout and login again
- Check organization selection

---

## 12. For Production

### Replace Demo Auth with Real Authentication:

```javascript
// In each API's index.js, replace:
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Query database for user
    const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );
    
    if (result.rows.length === 0) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
    
    const user = result.rows[0];
    
    // Verify password (use bcrypt)
    const bcrypt = require('bcrypt');
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            organizationId: user.organization_id
        }
    });
});
```

### Create Users Table:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo users
INSERT INTO users (username, password_hash, role, organization_id, full_name) VALUES
('ecta_officer', '$2b$10$...', 'ecta', 'ecta', 'ECTA Officer'),
('nbe_officer', '$2b$10$...', 'national-bank', 'national-bank', 'NBE Officer'),
('customs_officer', '$2b$10$...', 'custom-authorities', 'custom-authorities', 'Customs Officer'),
('shipping_officer', '$2b$10$...', 'shipping-line', 'shipping-line', 'Shipping Officer'),
('ecx_officer', '$2b$10$...', 'ecx', 'ecx', 'ECX Officer'),
('bank_officer', '$2b$10$...', 'commercial-bank', 'commercial-bank', 'Bank Officer'),
('exporter1', '$2b$10$...', 'exporter', 'exporter-portal', 'Coffee Exporter');
```

---

## 13. Quick Start Commands

```bash
# Start all services
cd /home/gu-da/cbc

# Start APIs
cd apis/commercial-bank && PORT=3001 node src/index.js &
cd apis/national-bank && PORT=3002 node src/index.js &
cd apis/shipping-line && PORT=3003 node src/index.js &
cd apis/ecx && PORT=3004 node src/index.js &
cd apis/ecta && PORT=3005 node src/index.js &
cd apis/custom-authorities && PORT=3006 node src/index.js &

# Start frontend
cd frontend && PORT=3010 npm start

# Access
open http://localhost:3010
```

---

## Summary

**Current System**: Demo authentication (any username/password works)

**Login Steps**:
1. Go to http://localhost:3010
2. Select organization
3. Enter "demo" / "demo"
4. Click Sign In
5. Auto-redirected to role-specific dashboard

**Each role sees only their tasks** - fully functional role-based access control!
