# Quick Reference Guide for Enhanced Components

This file provides quick copy-paste examples for using the enhanced components.

## BUTTONS

### Standard button with hover lift
```tsx
<EnhancedButton variant="contained" onClick={handleClick}>
  Save Changes
</EnhancedButton>
```

### Outlined button
```tsx
<EnhancedButton variant="outlined" color="primary">
  Cancel
</EnhancedButton>
```

### Text button
```tsx
<EnhancedButton variant="text">
  Learn More
</EnhancedButton>
```

### Disabled button
```tsx
<EnhancedButton variant="contained" disabled>
  Disabled
</EnhancedButton>
```

## CARDS

### Standard card with low elevation
```tsx
<EnhancedCard elevation="low">
  <CardContent>
    <Typography variant="h6">Card Title</Typography>
    <Typography>Card content goes here</Typography>
  </CardContent>
</EnhancedCard>
```

### Hoverable clickable card
```tsx
<EnhancedCard hoverable onClick={handleCardClick} elevation="medium">
  <CardContent>
    <Typography>Click me!</Typography>
  </CardContent>
</EnhancedCard>
```

### Glass morphism card
```tsx
<EnhancedCard glassMorphism elevation="high">
  <CardContent>
    <Typography>Premium content</Typography>
  </CardContent>
</EnhancedCard>
```

## INPUTS

### Standard input with focus glow
```tsx
<EnhancedInput
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  fullWidth
/>
```

### Input with success state
```tsx
<EnhancedInput
  label="Email"
  value={email}
  success={isValid}
  helperText="Email is valid"
/>
```

### Input with error
```tsx
<EnhancedInput
  label="Email"
  value={email}
  error={hasError}
  helperText="Invalid email format"
/>
```

## TOAST NOTIFICATIONS

```tsx
function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success("Operation completed successfully!");
  };

  const handleError = () => {
    toast.error("Something went wrong");
  };

  const handleWarning = () => {
    toast.warning("Please review before proceeding");
  };

  const handleInfo = () => {
    toast.info("New updates available");
  };

  // Custom duration (default is 6000ms)
  const handleCustom = () => {
    toast.success("This will show for 10 seconds", 10000);
  };
}
```

## BREADCRUMBS

### Auto-generated from current route
```tsx
<Breadcrumbs />
```

### Custom breadcrumbs
```tsx
<Breadcrumbs
  items={[
    { label: 'Home', path: '/', icon: <Home size={16} /> },
    { label: 'Exports', path: '/exports' },
    { label: 'Export Details' } // Last item has no path
  ]}
/>
```

### Without home icon
```tsx
<Breadcrumbs showHome={false} />
```

## ENHANCED TABLE

```tsx
<EnhancedTable
  columns={[
    { 
      id: 'name', 
      label: 'Name', 
      sortable: true 
    },
    { 
      id: 'status', 
      label: 'Status',
      render: (value) => <Chip label={value} color="primary" />
    },
    { 
      id: 'date', 
      label: 'Date',
      align: 'right'
    }
  ]}
  data={exports}
  selectable
  selected={selectedIds}
  onSelectionChange={setSelectedIds}
  onRowClick={handleRowClick}
  stickyHeader
  maxHeight={600}
  emptyState={<NoExportsEmptyState onCreate={handleCreate} />}
/>
```

## EMPTY STATES

### Preset: No exports
```tsx
<NoExportsEmptyState onCreate={handleCreate} />
```

### Preset: No search results
```tsx
<NoSearchResultsEmptyState 
  searchTerm={searchQuery}
  onClear={handleClearSearch}
/>
```

### Preset: No data
```tsx
<NoDataEmptyState />
```

### Preset: All caught up
```tsx
<NoPendingItemsEmptyState />
```

### Preset: Error state
```tsx
<ErrorEmptyState onRetry={handleRetry} />
```

### Custom empty state
```tsx
<EmptyState
  icon={Package}
  title="No Items Found"
  description="Try adjusting your filters or search terms"
  type="info"
  size="medium"
  action={{
    label: "Reset Filters",
    onClick: handleReset,
    variant: "outlined"
  }}
/>
```

## COMPLETE PAGE EXAMPLE

```tsx
import { useState } from 'react';
import { Box, CardContent, Typography, Chip } from '@mui/material';
import { Package } from 'lucide-react';
import { EnhancedCard, EnhancedButton } from './components/enhanced';
import { useToast } from './components/ToastProvider';
import Breadcrumbs from './components/Breadcrumbs';
import EnhancedTable from './components/EnhancedTable';
import { NoExportsEmptyState } from './components/EmptyState';

function ExportsPage() {
  const toast = useToast();
  const [exports, setExports] = useState([]);
  const [selected, setSelected] = useState([]);

  const handleCreate = () => {
    // Create logic
    toast.success("Export created successfully!");
  };

  const handleRowClick = (row) => {
    // Navigate to details
  };

  const columns = [
    { id: 'id', label: 'ID', width: 100 },
    { id: 'name', label: 'Name', sortable: true },
    { 
      id: 'status', 
      label: 'Status',
      render: (value) => (
        <Chip 
          label={value} 
          color={value === 'COMPLETED' ? 'success' : 'warning'}
          size="small"
        />
      )
    },
    { id: 'date', label: 'Date', align: 'right' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs />
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Export Requests</Typography>
        <EnhancedButton variant="contained" onClick={handleCreate}>
          Create Export
        </EnhancedButton>
      </Box>

      <EnhancedCard elevation="low">
        <CardContent>
          <EnhancedTable
            columns={columns}
            data={exports}
            selectable
            selected={selected}
            onSelectionChange={setSelected}
            onRowClick={handleRowClick}
            emptyState={<NoExportsEmptyState onCreate={handleCreate} />}
          />
        </CardContent>
      </EnhancedCard>
    </Box>
  );
}

export default ExportsPage;
```
