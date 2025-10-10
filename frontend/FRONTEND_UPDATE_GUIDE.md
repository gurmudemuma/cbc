# Frontend Update Guide

## How to Update Pages to Use Centralized API Configuration

### 1. Import the API configuration

```javascript
import { API_ENDPOINTS } from '../config/api.config';
```

### 2. Update API URL setting

**Before:**
```javascript
setApiBaseUrl('http://localhost:3003/api');
```

**After:**
```javascript
import { API_ENDPOINTS } from '../config/api.config';
setApiBaseUrl(API_ENDPOINTS.ncat);
```

### 3. Pages to Update

#### QualityCertification.jsx
```javascript
// Add import at top
import { API_ENDPOINTS } from '../config/api.config';

// In useEffect, replace:
setApiBaseUrl('http://localhost:3003/api');
// With:
setApiBaseUrl(API_ENDPOINTS.ncat);
```

#### FXRates.jsx
```javascript
// Add import at top
import { API_ENDPOINTS } from '../config/api.config';

// In useEffect, replace:
setApiBaseUrl('http://localhost:3002/api');
// With:
setApiBaseUrl(API_ENDPOINTS.nationalbank);
```

#### ShipmentTracking.jsx
```javascript
// Add import at top
import { API_ENDPOINTS } from '../config/api.config';

// In useEffect, replace:
setApiBaseUrl('http://localhost:3004/api');
// With:
setApiBaseUrl(API_ENDPOINTS.shipping);
```

#### Login.jsx
```javascript
// Add import at top
import { ORGANIZATIONS, getApiUrl } from '../config/api.config';

// Replace organizations array with:
// (Already imported from config)

// In handleSubmit, replace:
const org = organizations.find(o => o.value === formData.organization);
if (org) {
  setApiBaseUrl(`http://localhost:${org.port}/api`);
}
// With:
const apiUrl = getApiUrl(formData.organization);
setApiBaseUrl(apiUrl);
```

## Benefits

1. ✅ Centralized configuration
2. ✅ Environment variable support
3. ✅ Easy to change for different environments
4. ✅ Consistent across all pages
5. ✅ Production-ready

## Testing

After updates:
1. Test login with each organization
2. Test each page functionality
3. Verify API calls go to correct endpoints
4. Test with different .env configurations
