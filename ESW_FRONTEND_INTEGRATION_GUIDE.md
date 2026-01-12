# ESW Frontend Integration Guide

## Overview
This guide explains how to integrate the ESW frontend pages into your existing React application.

---

## Files Created

### Services
- `frontend/src/services/esw.service.js` - ESW API service layer

### Pages
- `frontend/src/pages/ESWSubmission.tsx` - ESW submission wizard
- `frontend/src/pages/AgencyApprovalDashboard.tsx` - Agency approval dashboard
- `frontend/src/pages/ESWStatistics.tsx` - Statistics and analytics

### Components
- `frontend/src/components/ESWStatusTracker.tsx` - Status tracking component

---

## Step 1: Add Routes

Add the ESW pages to your React Router configuration:

```typescript
// In your main routing file (e.g., App.tsx or routes.tsx)

import ESWSubmission from './pages/ESWSubmission';
import AgencyApprovalDashboard from './pages/AgencyApprovalDashboard';
import ESWStatistics from './pages/ESWStatistics';

// Add these routes to your router
<Route path="/esw/submission" element={<ESWSubmission user={user} org={org} />} />
<Route path="/esw/agency-dashboard" element={<AgencyApprovalDashboard user={user} org={org} />} />
<Route path="/esw/statistics" element={<ESWStatistics user={user} org={org} />} />
```

---

## Step 2: Add Navigation Menu Items

Add ESW menu items to your navigation:

```typescript
// For Exporters
{
  label: 'ESW Submission',
  path: '/esw/submission',
  icon: <Send />,
  roles: ['exporter']
}

// For Agency Officers
{
  label: 'Agency Approvals',
  path: '/esw/agency-dashboard',
  icon: <Building2 />,
  roles: ['agency_officer', 'mot', 'erca', 'nbe', 'moa', 'moh', 'eic', 'eslse', 'epa', 'ecta', 'ecx']
}

// For Administrators
{
  label: 'ESW Statistics',
  path: '/esw/statistics',
  icon: <BarChart3 />,
  roles: ['admin', 'manager']
}
```

---

## Step 3: Update API Configuration

Ensure your API client is configured to route ESW requests:

```javascript
// In your api.js or apiClient.js

// ESW API runs on port 3008
// Requests to /api/esw/* should be routed to http://localhost:3008

// If using a proxy in development:
// vite.config.ts or webpack config
proxy: {
  '/api/esw': {
    target: 'http://localhost:3008',
    changeOrigin: true,
  }
}
```

---

## Step 4: Add User Permissions

Update your user roles/permissions to include ESW access:

```typescript
// User roles for ESW
const ESW_ROLES = {
  EXPORTER: 'exporter',           // Can submit to ESW
  AGENCY_OFFICER: 'agency_officer', // Can approve/reject
  ADMIN: 'admin',                 // Can view statistics
};

// Agency-specific roles
const AGENCY_ROLES = {
  MOT: 'mot_officer',
  ERCA: 'erca_officer',
  NBE: 'nbe_officer',
  // ... etc for all 16 agencies
};
```

---

## Step 5: Update Export Status Flow

Update your export workflow to include ESW statuses:

```typescript
// Export status flow with ESW
const EXPORT_STATUS_FLOW = [
  'DRAFT',
  'SUBMITTED',
  'ECTA_LICENSE_PENDING',
  'ECTA_LICENSE_APPROVED',
  'ECTA_QUALITY_PENDING',
  'ECTA_QUALITY_APPROVED',
  'ECTA_CONTRACT_PENDING',
  'ECTA_CONTRACT_APPROVED',
  // ESW statuses start here
  'ESW_SUBMISSION_PENDING',    // Ready for ESW submission
  'ESW_SUBMITTED',             // Submitted to ESW
  'ESW_UNDER_REVIEW',          // Agencies reviewing
  'ESW_APPROVED',              // All agencies approved
  'ESW_REJECTED',              // One or more agencies rejected
  'ESW_ADDITIONAL_INFO_REQUIRED', // Agencies need more info
  // Continue with banking
  'BANK_DOCUMENT_PENDING',
  // ... rest of flow
];
```

---

## Step 6: Add Status Badge Colors

Update your status color mapping:

```typescript
const getStatusColor = (status: string) => {
  // ... existing statuses
  
  // ESW statuses
  if (status === 'ESW_SUBMISSION_PENDING') return 'info';
  if (status === 'ESW_SUBMITTED') return 'primary';
  if (status === 'ESW_UNDER_REVIEW') return 'warning';
  if (status === 'ESW_APPROVED') return 'success';
  if (status === 'ESW_REJECTED') return 'error';
  if (status === 'ESW_ADDITIONAL_INFO_REQUIRED') return 'info';
  
  return 'default';
};
```

---

## Step 7: Update Dashboard

Add ESW metrics to your main dashboard:

```typescript
// Add ESW statistics card
<Card>
  <CardContent>
    <Typography variant="h6">ESW Submissions</Typography>
    <Typography variant="h4">{eswStats.totalSubmissions}</Typography>
    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
      <Chip label={`${eswStats.pending} Pending`} color="warning" size="small" />
      <Chip label={`${eswStats.approved} Approved`} color="success" size="small" />
    </Box>
  </CardContent>
</Card>
```

---

## Step 8: Add Notifications

Integrate ESW notifications:

```typescript
// When export reaches ECTA_CONTRACT_APPROVED
showNotification(
  'Export approved! You can now submit to ESW.',
  'success',
  {
    action: {
      label: 'Submit to ESW',
      onClick: () => navigate('/esw/submission')
    }
  }
);

// When ESW submission is approved
showNotification(
  'ESW submission approved by all agencies!',
  'success'
);

// When agency needs more info
showNotification(
  'Additional information requested by agency',
  'warning',
  {
    action: {
      label: 'View Details',
      onClick: () => navigate(`/esw/submission/${submissionId}`)
    }
  }
);
```

---

## Step 9: Add Breadcrumbs

Add breadcrumbs for navigation:

```typescript
// ESW Submission
<Breadcrumbs>
  <Link to="/">Home</Link>
  <Link to="/exports">Exports</Link>
  <Typography>ESW Submission</Typography>
</Breadcrumbs>

// Agency Dashboard
<Breadcrumbs>
  <Link to="/">Home</Link>
  <Link to="/esw">ESW</Link>
  <Typography>Agency Dashboard</Typography>
</Breadcrumbs>

// Statistics
<Breadcrumbs>
  <Link to="/">Home</Link>
  <Link to="/esw">ESW</Link>
  <Typography>Statistics</Typography>
</Breadcrumbs>
```

---

## Step 10: Testing

### Manual Testing Checklist

**ESW Submission:**
1. Start ESW API: `npm run dev` in `api/esw`
2. Start frontend: `npm run dev` in `frontend`
3. Navigate to `/esw/submission`
4. Select an export with ECTA_CONTRACT_APPROVED status
5. Add required documents
6. Add certificates (optional)
7. Review and submit
8. Verify ESW reference number is displayed
9. Check export status updated to ESW_SUBMITTED

**Agency Dashboard:**
1. Navigate to `/esw/agency-dashboard`
2. Select an agency from dropdown
3. Verify pending submissions load
4. Click "Review" on a submission
5. Make a decision (approve/reject/info required)
6. Verify submission status updates
7. Check pending list refreshes

**Statistics:**
1. Navigate to `/esw/statistics`
2. Verify metrics display correctly
3. Check status breakdown
4. Review recent submissions table
5. Test refresh button

---

## Step 11: Environment Variables

Add ESW API URL to your environment:

```bash
# .env.development
VITE_ESW_API_URL=http://localhost:3008

# .env.production
VITE_ESW_API_URL=https://api.yourdomain.com
```

Update API client:

```javascript
const ESW_API_URL = import.meta.env.VITE_ESW_API_URL || 'http://localhost:3008';
```

---

## Step 12: Error Handling

Add global error handling for ESW API:

```typescript
// In your API client
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.config.url.includes('/api/esw')) {
      // ESW-specific error handling
      if (error.response?.status === 404) {
        showNotification('ESW submission not found', 'error');
      } else if (error.response?.status === 403) {
        showNotification('You do not have permission to access this ESW resource', 'error');
      } else if (error.response?.status === 500) {
        showNotification('ESW API error. Please try again later.', 'error');
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Step 13: Loading States

Add loading states for better UX:

```typescript
// Global loading state for ESW operations
const [eswLoading, setEswLoading] = useState(false);

// Show loading overlay
{eswLoading && (
  <Backdrop open={true}>
    <CircularProgress />
    <Typography>Processing ESW submission...</Typography>
  </Backdrop>
)}
```

---

## Step 14: Mobile Responsiveness

Ensure ESW pages work on mobile:

```typescript
// Use Material-UI breakpoints
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// Adjust layout for mobile
<Grid container spacing={isMobile ? 2 : 3}>
  {/* Content */}
</Grid>
```

---

## Step 15: Accessibility

Add accessibility features:

```typescript
// Add ARIA labels
<Button
  aria-label="Submit export to ESW"
  onClick={handleSubmit}
>
  Submit to ESW
</Button>

// Add keyboard navigation
<TableRow
  tabIndex={0}
  onKeyPress={(e) => {
    if (e.key === 'Enter') handleSelect(export);
  }}
>
  {/* Content */}
</TableRow>
```

---

## Common Issues & Solutions

### Issue 1: ESW API not accessible
**Solution:** Ensure ESW API is running on port 3008 and CORS is configured

### Issue 2: Exports not showing in submission page
**Solution:** Check export status is ECTA_CONTRACT_APPROVED

### Issue 3: Agency dropdown empty
**Solution:** Verify ESW agencies are seeded in database

### Issue 4: Documents not uploading
**Solution:** File upload is placeholder - implement actual upload in Phase 4

### Issue 5: Statistics not loading
**Solution:** Check ESW API statistics endpoint is working

---

## Next Steps

After integration:
1. Test all workflows end-to-end
2. Add unit tests for components
3. Add integration tests
4. Implement file upload
5. Add real-time updates (WebSocket)
6. Add email notifications
7. Performance optimization
8. Security audit

---

## Support

For issues or questions:
- Check ESW API logs: `docker logs cbc-esw`
- Check browser console for errors
- Verify API endpoints with: `node test-esw-api.js`
- Review Phase 3 documentation: `ESW_PHASE3_COMPLETE.md`

---

**Integration Status:** Ready for integration
**Estimated Time:** 2-4 hours
**Complexity:** Medium
**Dependencies:** ESW API (Phase 2), Database (Phase 1)
