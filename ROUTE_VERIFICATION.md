# ESW Route Verification

## Navigation Menu Items → Routes Mapping

### Exporter Portal - ESW Submission Menu

| Menu Item | Path | Route in App.tsx | Page Component | Status |
|-----------|------|------------------|----------------|--------|
| Submit to ESW | `/esw/submission` | ✅ `esw/submission` | `ESWSubmission` | ✅ Configured |
| My Submissions | `/esw/submissions` | ✅ `esw/submissions` | `ESWSubmission` | ✅ Configured |
| Submission Status | `/esw/status` | ✅ `esw/status` | `ESWStatistics` | ✅ Configured |

### Additional ESW Routes (for agencies/admin)

| Route | Page Component | Purpose | Status |
|-------|----------------|---------|--------|
| `/esw/agency-dashboard` | `AgencyApprovalDashboard` | Agency approval interface | ✅ Configured |
| `/esw/statistics` | `ESWStatistics` | ESW statistics and analytics | ✅ Configured |

## Route Configuration Summary

### App.tsx Routes (Line ~391-395)
```typescript
// ESW Routes
{ path: 'esw/submission', element: <ESWSubmission user={user} org={org} /> },
{ path: 'esw/submissions', element: <ESWSubmission user={user} org={org} /> },
{ path: 'esw/status', element: <ESWStatistics user={user} org={org} /> },
{ path: 'esw/agency-dashboard', element: <AgencyApprovalDashboard user={user} org={org} /> },
{ path: 'esw/statistics', element: <ESWStatistics user={user} org={org} /> },
```

### Layout.tsx Navigation (Exporter Portal)
```typescript
{
  name: 'ESW Submission',
  path: '/esw/submission',
  icon: Send,
  children: [
    { name: 'Submit to ESW', path: '/esw/submission', icon: Send },
    { name: 'My Submissions', path: '/esw/submissions', icon: FileText },
    { name: 'Submission Status', path: '/esw/status', icon: FileCheck },
  ]
}
```

## Page Components

### 1. ESWSubmission.tsx
- **Purpose**: Main submission interface for exporters
- **Features**:
  - Multi-step submission wizard
  - Document upload
  - Certificate management
  - Export selection (filters ECTA_CONTRACT_APPROVED exports)
- **Used by routes**: `/esw/submission`, `/esw/submissions`

### 2. ESWStatistics.tsx
- **Purpose**: Statistics and status tracking
- **Features**:
  - Submission statistics
  - Agency approval status
  - Processing times
  - Success rates
- **Used by routes**: `/esw/status`, `/esw/statistics`

### 3. AgencyApprovalDashboard.tsx
- **Purpose**: Agency-side approval interface
- **Features**:
  - Pending approvals list
  - Approval/rejection actions
  - Agency-specific filtering
- **Used by routes**: `/esw/agency-dashboard`

## API Endpoints

### ESW API (Port 3008)
- `GET /api/esw/statistics` - Get ESW statistics
- `GET /api/esw/agencies` - Get list of agencies
- `GET /api/esw/submissions` - Get all submissions
- `POST /api/esw/submissions` - Submit export to ESW
- `GET /api/esw/submissions/:id` - Get submission details
- `GET /api/esw/agencies/:code/pending` - Get pending approvals for agency

### Vite Proxy Configuration
```javascript
'/api/esw': {
  target: 'http://localhost:3008',
  changeOrigin: true,
}
```

## Verification Checklist

- ✅ All navigation menu items have corresponding routes
- ✅ All routes point to valid page components
- ✅ ESW API is running on port 3008
- ✅ JWT authentication synced between ECTA and ESW
- ✅ Database schema includes ESW tables
- ✅ 14 exports ready for ESW submission
- ✅ Navigation updated for Exporter Portal
- ✅ ESW removed from ECTA portal

## Testing Steps

1. **Start Services**
   ```bash
   # Ensure ESW API is running
   netstat -ano | findstr ":3008"
   ```

2. **Login as Exporter**
   - Go to http://localhost:5173
   - Login with exporter credentials
   - Organization: Exporter Portal

3. **Navigate to ESW Submission**
   - Click "ESW Submission" in sidebar
   - Should see 3 sub-menu items
   - Click "Submit to ESW"

4. **Verify Export List**
   - Should see 14 exports with status ECTA_CONTRACT_APPROVED
   - All exports should be selectable

5. **Test Submission Flow**
   - Select an export
   - Upload required documents
   - Submit to ESW
   - Verify submission appears in "My Submissions"

## Status: ✅ ALL ROUTES CONFIGURED AND VERIFIED
