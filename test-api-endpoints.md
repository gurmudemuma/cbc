# API Endpoint Testing Guide

## Quick Test Commands

Test these endpoints directly to verify they're working:

### 1. Test ECTA API Health
```bash
curl http://localhost:3003/health
```

### 2. Test Exporter Portal API Health
```bash
curl http://localhost:3004/health
```

### 3. Test Authentication (Get Token)
```bash
# Login to get token
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"your_password\"}"
```

### 4. Test ECTA Preregistration Endpoints (with token)
```bash
# Replace YOUR_TOKEN with actual token from login
curl http://localhost:3003/api/preregistration/exporters/pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test via Vite Proxy (from frontend)
Open browser console and run:
```javascript
// Test if token exists
console.log('Token:', localStorage.getItem('token'));

// Test API call
fetch('/api/ecta/preregistration/exporters/pending', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

## Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Cause**: No token or expired token
**Solution**: 
1. Check if token exists: `localStorage.getItem('token')`
2. Login again to get fresh token
3. Verify token is being sent in Authorization header

### Issue 2: 404 Not Found
**Cause**: Wrong endpoint path or proxy not working
**Solution**:
1. Verify backend is running on correct port
2. Check Vite proxy configuration
3. Verify endpoint path matches backend routes

### Issue 3: CORS Error
**Cause**: CORS not configured properly
**Solution**:
1. Check backend CORS configuration
2. Verify `changeOrigin: true` in Vite proxy
3. Ensure credentials are being sent

### Issue 4: Empty Response
**Cause**: No data in database
**Solution**:
1. Run seed scripts to populate database
2. Check database connection
3. Verify queries are returning data

## Current Configuration

### Frontend (Vite Proxy)
- Frontend: http://localhost:5173
- Proxy `/api/ecta` → http://localhost:3003 (rewrites to `/api`)
- Proxy `/api/exporter` → http://localhost:3004 (no rewrite)

### Backend Services
- Commercial Bank: http://localhost:3001
- Custom Authorities: http://localhost:3002
- ECTA: http://localhost:3003
- Exporter Portal: http://localhost:3004
- National Bank: http://localhost:3005
- ECX: http://localhost:3006
- Shipping Line: http://localhost:3007

### API Paths
- ECTA Preregistration: `/api/preregistration/*`
- Exporter Portal: `/api/exporter/*`
- Frontend calls: `/api/ecta/preregistration/*` (proxied to ECTA)
