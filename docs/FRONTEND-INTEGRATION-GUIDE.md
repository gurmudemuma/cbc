# Frontend Integration Guide - Sales Contract Workflow

## Overview

This guide explains how to integrate the sales contract workflow into your React frontend application. The implementation includes contract creation, negotiation, finalization, and certificate generation.

## Components Created

### 1. **SalesContractDashboard** (`cbc/frontend/src/pages/SalesContractDashboard.tsx`)
Main page component that orchestrates the entire workflow.

**Features:**
- Tab-based interface (My Drafts, Create New, Details)
- List all contract drafts with status tracking
- Create new drafts
- View and manage individual contracts
- Handle accept/reject/counter operations
- Finalize contracts to blockchain
- Download certificates

**Usage:**
```tsx
import SalesContractDashboard from './pages/SalesContractDashboard';

// Add to your router
<Route path="/contracts" element={<SalesContractDashboard />} />
```

### 2. **SalesContractDraftForm** (`cbc/frontend/src/components/forms/SalesContractDraftForm.tsx`)
Form component for creating new contract drafts.

**Features:**
- Coffee type selection
- Quantity and pricing inputs
- Payment and delivery terms
- Legal framework selection
- Certification requirements
- Real-time total value calculation
- Form validation

**Props:**
```tsx
interface SalesContractDraftFormProps {
  buyerId: string;
  buyerName: string;
  onSubmit: (data: any) => void;
  loading?: boolean;
}
```

### 3. **SalesContractNegotiationForm** (`cbc/frontend/src/components/forms/SalesContractNegotiationForm.tsx`)
Form component for managing contract negotiations.

**Features:**
- Display current contract terms
- Submit counter offers with modified terms
- Accept or reject contracts
- Dialog-based interactions
- Change tracking
- Notes/reason fields

**Props:**
```tsx
interface SalesContractNegotiationFormProps {
  draft: ContractDraft;
  onCounter: (updates: any, notes: string) => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  loading?: boolean;
}
```

### 4. **SalesContractService** (`cbc/frontend/src/services/salesContractService.ts`)
Service layer for API communication.

**Methods:**
```tsx
// Create a new draft
createDraft(data: CreateDraftRequest): Promise<{ draft: ContractDraft }>

// Get draft details
getDraft(draftId: string): Promise<ContractDraft>

// List exporter's drafts
listExporterDrafts(exporterId: string): Promise<{ drafts: ContractDraft[] }>

// Submit counter offer
submitCounterOffer(draftId: string, data: CounterOfferRequest): Promise<{ draft: ContractDraft }>

// Accept draft
acceptDraft(draftId: string): Promise<{ draft: ContractDraft }>

// Reject draft
rejectDraft(draftId: string, reason: string): Promise<{ draft: ContractDraft }>

// Get negotiation history
getNegotiationHistory(draftId: string): Promise<{ history: NegotiationActivity[] }>

// Finalize to blockchain
finalizeDraft(draftId: string): Promise<{ draft: ContractDraft; blockchainContractId: string }>

// Download certificate
downloadCertificate(draftId: string): Promise<Blob>

// Get legal frameworks
getLegalFrameworks(): Promise<{ frameworks: any[] }>

// Get contract clauses
getContractClauses(type: string): Promise<{ clauses: any[] }>
```

## Integration Steps

### Step 1: Add Route to Your Router

```tsx
// In your main router file (e.g., App.tsx or Router.tsx)
import SalesContractDashboard from './pages/SalesContractDashboard';

const routes = [
  // ... other routes
  {
    path: '/contracts',
    element: <SalesContractDashboard />,
    requiresAuth: true,
  },
];
```

### Step 2: Add Navigation Link

```tsx
// In your navigation component
import { Link } from 'react-router-dom';

<Link to="/contracts">Sales Contracts</Link>
```

### Step 3: Configure API Base URL

Ensure your `.env` file has:
```
REACT_APP_API_URL=http://localhost:3000/api
```

### Step 4: Verify Authentication Context

The dashboard uses `useAuth()` hook. Ensure your AuthContext provides:
```tsx
interface AuthContextType {
  user: { id: string; role: string; };
  token: string;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Sales Contract Workflow                   │
└─────────────────────────────────────────────────────────────┘

1. CREATE DRAFT
   ├─ Exporter fills form with contract terms
   ├─ System validates all required fields
   └─ Draft created with status: DRAFT

2. NEGOTIATION (Loop)
   ├─ Buyer receives draft
   ├─ Options:
   │  ├─ Accept → Status: ACCEPTED
   │  ├─ Reject → Status: REJECTED (End)
   │  └─ Counter → Status: COUNTERED (Back to step 1)
   └─ Repeat until ACCEPTED

3. FINALIZATION
   ├─ Exporter finalizes accepted draft
   ├─ Contract sent to blockchain
   └─ Status: FINALIZED

4. CERTIFICATE
   ├─ System generates PDF certificate
   ├─ Includes blockchain verification
   └─ Available for download
```

## State Management

The dashboard manages state locally using React hooks:

```tsx
const [drafts, setDrafts] = useState<Draft[]>([]);
const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
```

For larger applications, consider using Redux or Zustand:

```tsx
// Example with Redux
const drafts = useSelector(state => state.contracts.drafts);
const dispatch = useDispatch();

dispatch(fetchDrafts(exporterId));
dispatch(createDraft(formData));
```

## Error Handling

The dashboard includes comprehensive error handling:

```tsx
try {
  const response = await fetch(url, options);
  if (response.ok) {
    // Success
    setSuccess('Operation completed');
  } else {
    const data = await response.json();
    setError(data.error || 'Operation failed');
  }
} catch (err) {
  setError('Network error');
}
```

## API Integration Points

### Create Draft
```
POST /api/contracts/drafts
Headers: Authorization: Bearer {token}
Body: {
  buyerId: string,
  coffeeType: string,
  quantity: number,
  unitPrice: number,
  ...
}
Response: { draft: ContractDraft }
```

### Accept Draft
```
POST /api/contracts/drafts/{draftId}/accept
Headers: Authorization: Bearer {token}
Body: {}
Response: { draft: ContractDraft }
```

### Counter Offer
```
POST /api/contracts/drafts/{draftId}/counter
Headers: Authorization: Bearer {token}
Body: {
  updates: { quantity: 100, unitPrice: 4.50, ... },
  notes: "Please adjust quantity"
}
Response: { draft: ContractDraft }
```

### Finalize to Blockchain
```
POST /api/contracts/drafts/{draftId}/finalize
Headers: Authorization: Bearer {token}
Body: {}
Response: { draft: ContractDraft, blockchainContractId: string }
```

### Download Certificate
```
GET /api/contracts/drafts/{draftId}/certificate
Headers: Authorization: Bearer {token}
Response: Binary PDF file
```

## Styling

Components use Material-UI (MUI) for consistent styling. Customize theme in your app:

```tsx
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    success: { main: '#4caf50' },
  },
});

<ThemeProvider theme={theme}>
  <SalesContractDashboard />
</ThemeProvider>
```

## Testing

### Unit Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SalesContractDashboard from './SalesContractDashboard';

test('renders dashboard', () => {
  render(<SalesContractDashboard />);
  expect(screen.getByText('Sales Contract Management')).toBeInTheDocument();
});
```

### Integration Tests
```tsx
test('creates draft successfully', async () => {
  render(<SalesContractDashboard />);
  
  fireEvent.click(screen.getByText('New Draft'));
  fireEvent.change(screen.getByLabelText('Coffee Type'), { target: { value: 'Arabica' } });
  fireEvent.click(screen.getByText('Create Draft'));
  
  await waitFor(() => {
    expect(screen.getByText('Contract draft created successfully')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Lazy Loading
```tsx
const SalesContractDashboard = lazy(() => import('./pages/SalesContractDashboard'));

<Suspense fallback={<Loading />}>
  <SalesContractDashboard />
</Suspense>
```

### Memoization
```tsx
const SalesContractNegotiationForm = memo(({ draft, onAccept, ... }) => {
  // Component code
});
```

### API Caching
```tsx
const [cache, setCache] = useState({});

const fetchDrafts = async () => {
  if (cache.drafts) return cache.drafts;
  const data = await apiClient.get('/contracts/drafts');
  setCache(prev => ({ ...prev, drafts: data }));
  return data;
};
```

## Troubleshooting

### Issue: "Access denied" error
**Solution:** Ensure user is authenticated and has exporter role
```tsx
if (!user || user.role !== 'exporter') {
  return <Navigate to="/login" />;
}
```

### Issue: Certificate download fails
**Solution:** Verify draft status is FINALIZED
```tsx
if (draft.status !== 'FINALIZED') {
  setError('Certificate only available for finalized contracts');
}
```

### Issue: Form validation errors
**Solution:** Check all required fields are filled
```tsx
const validate = () => {
  const errors = {};
  if (!formData.coffeeType) errors.coffeeType = 'Required';
  if (!formData.quantity) errors.quantity = 'Required';
  return Object.keys(errors).length === 0;
};
```

## Next Steps

1. **Add buyer selection** - Implement buyer search/selection in draft form
2. **Negotiation history** - Display timeline of all negotiations
3. **Email notifications** - Notify parties of status changes
4. **Digital signatures** - Add signature verification
5. **Multi-language support** - Translate UI to multiple languages
6. **Mobile optimization** - Ensure responsive design on mobile devices

## Support

For issues or questions:
1. Check the API documentation in `docs/SALES-CONTRACT-COMPLETE-FLOW.md`
2. Review test script in `scripts/test-sales-contract-flow.ps1`
3. Check backend routes in `coffee-export-gateway/src/routes/contract-drafts.routes.js`
