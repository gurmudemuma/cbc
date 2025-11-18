#!/bin/bash

# Frontend Configuration Fix Script
# Fixes environment variable usage in the Coffee Export Consortium Blockchain frontend

set -e

echo "🎨 Coffee Export Consortium Blockchain - Frontend Configuration Fix"
echo "===================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the CBC root directory"
    exit 1
fi

if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found"
    exit 1
fi

echo "Starting frontend configuration fixes..."
echo ""

# Fix 1: Create .env file from .env.example
echo "Fix 1: Creating .env file..."
if [ -f "frontend/.env.example" ]; then
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env from .env.example"
    else
        print_info "frontend/.env already exists"
    fi
else
    print_warning "frontend/.env.example not found"
fi
echo ""

# Fix 2: Create API configuration file
echo "Fix 2: Creating centralized API configuration..."
mkdir -p frontend/src/config
cat > "frontend/src/config/api.config.js" << 'EOF'
/**
 * API Configuration
 * Centralized API endpoint management
 */

// Get environment variables with fallbacks
const getEnvVar = (key, fallback) => {
  return import.meta.env[key] || fallback;
};

// API Endpoints
export const API_ENDPOINTS = {
  exporter: getEnvVar('VITE_EXPORTER_API', 'http://localhost:3001/api'),
  nationalbank: getEnvVar('VITE_NATIONALBANK_API', 'http://localhost:3002/api'),
  ncat: getEnvVar('VITE_ECTA_API', 'http://localhost:3003/api'),
  shipping: getEnvVar('VITE_SHIPPING_API', 'http://localhost:3004/api'),
};

// Organization Configuration
export const ORGANIZATIONS = [
  { 
    value: 'exporter', 
    label: 'commercialbank', 
    apiUrl: API_ENDPOINTS.exporter,
    port: 3001 
  },
  { 
    value: 'nationalbank', 
    label: 'National Bank', 
    apiUrl: API_ENDPOINTS.nationalbank,
    port: 3002 
  },
  { 
    value: 'ncat', 
    label: 'ECTA', 
    apiUrl: API_ENDPOINTS.ncat,
    port: 3003 
  },
  { 
    value: 'shipping', 
    label: 'Shipping Line', 
    apiUrl: API_ENDPOINTS.shipping,
    port: 3004 
  }
];

// Get API URL by organization value
export const getApiUrl = (orgValue) => {
  const org = ORGANIZATIONS.find(o => o.value === orgValue);
  return org ? org.apiUrl : API_ENDPOINTS.exporter;
};

export default {
  API_ENDPOINTS,
  ORGANIZATIONS,
  getApiUrl
};
EOF

mkdir -p frontend/src/config
print_success "Created frontend/src/config/api.config.js"
echo ""

# Fix 3: Create production environment file
echo "Fix 3: Creating production environment configuration..."
cat > "frontend/.env.production.example" << 'EOF'
# Production Environment Variables

# API Endpoints - Update these for your production environment
VITE_EXPORTER_API=https://api.coffeeexport.com/exporter/api
VITE_NATIONALBANK_API=https://api.coffeeexport.com/nationalbank/api
VITE_ECTA_API=https://api.coffeeexport.com/ncat/api
VITE_SHIPPING_API=https://api.coffeeexport.com/shipping/api

# Optional: Analytics, monitoring, etc.
# VITE_ANALYTICS_ID=your-analytics-id
# VITE_SENTRY_DSN=your-sentry-dsn
EOF

print_success "Created frontend/.env.production.example"
print_info "Copy this to .env.production and update URLs for production"
echo ""

# Fix 4: Update services/api.ts to use environment variables
echo "Fix 4: Updating services/api.ts..."
if [ -f "frontend/src/services/api.ts" ]; then
    # Backup original
    cp frontend/src/services/api.ts frontend/src/services/api.ts.backup
    
    cat > "frontend/src/services/api.ts" << 'EOF'
import axios from 'axios';

// Get base URL from environment or use default
const getBaseURL = () => {
  return import.meta.env.VITE_EXPORTER_API || 'http://localhost:3001/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const setApiBaseUrl = (baseUrl: string) => {
  apiClient.defaults.baseURL = baseUrl;
};

export default apiClient;
EOF
    
    print_success "Updated frontend/src/services/api.ts"
    print_info "Backup saved as frontend/src/services/api.ts.backup"
else
    print_warning "frontend/src/services/api.ts not found"
fi
echo ""

# Fix 5: Create updated Login.jsx that uses API config
echo "Fix 5: Creating updated Login component example..."
cat > "frontend/src/pages/Login.example.jsx" << 'EOF'
import { useState } from 'react';
import { Coffee, LogIn } from 'lucide-react';
import Button from '../components/Button';
import apiClient, { setApiBaseUrl } from '../services/api';
import { ORGANIZATIONS, getApiUrl } from '../config/api.config';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    organization: 'exporter'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use centralized API configuration
      const apiUrl = getApiUrl(formData.organization);
      setApiBaseUrl(apiUrl);

      const response = await apiClient.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      onLogin(user, token);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-page">
      {/* ... rest of the component ... */}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="organization">Organization</label>
          <select
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            required
          >
            {ORGANIZATIONS.map(org => (
              <option key={org.value} value={org.value}>
                {org.label}
              </option>
            ))}
          </select>
        </div>
        {/* ... rest of the form ... */}
      </form>
    </div>
  );
};

export default Login;
EOF

print_success "Created frontend/src/pages/Login.example.jsx"
print_info "This is an example showing how to use the new API config"
print_info "You can update your actual Login.jsx to use this pattern"
echo ""

# Fix 6: Create page update examples
echo "Fix 6: Creating page update guide..."
cat > "frontend/FRONTEND_UPDATE_GUIDE.md" << 'EOF'
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
EOF

print_success "Created frontend/FRONTEND_UPDATE_GUIDE.md"
echo ""

# Fix 7: Create staging environment file
echo "Fix 7: Creating staging environment configuration..."
cat > "frontend/.env.staging.example" << 'EOF'
# Staging Environment Variables

# API Endpoints - Staging environment
VITE_EXPORTER_API=https://staging-api.coffeeexport.com/exporter/api
VITE_NATIONALBANK_API=https://staging-api.coffeeexport.com/nationalbank/api
VITE_ECTA_API=https://staging-api.coffeeexport.com/ncat/api
VITE_SHIPPING_API=https://staging-api.coffeeexport.com/shipping/api
EOF

print_success "Created frontend/.env.staging.example"
echo ""

# Summary
echo "===================================================================="
echo "✅ Frontend configuration fixes completed successfully!"
echo ""
echo "Summary of changes:"
echo "  1. ✅ Created .env file from .env.example"
echo "  2. ✅ Created centralized API configuration (api.config.js)"
echo "  3. ✅ Created production environment template"
echo "  4. ✅ Updated services/api.ts to use environment variables"
echo "  5. ✅ Created Login component example"
echo "  6. ✅ Created page update guide"
echo "  7. ✅ Created staging environment template"
echo ""
echo "Next steps:"
echo "  1. Review frontend/FRONTEND_UPDATE_GUIDE.md"
echo "  2. Update pages to use new API configuration"
echo "  3. Test with: cd frontend && npm run dev"
echo "  4. For production: Copy .env.production.example to .env.production"
echo ""
echo "Files created:"
echo "  - frontend/.env"
echo "  - frontend/src/config/api.config.js"
echo "  - frontend/.env.production.example"
echo "  - frontend/.env.staging.example"
echo "  - frontend/src/pages/Login.example.jsx"
echo "  - frontend/FRONTEND_UPDATE_GUIDE.md"
echo ""
echo "Backup files:"
echo "  - frontend/src/services/api.ts.backup"
echo "===================================================================="
