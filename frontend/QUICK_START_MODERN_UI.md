# Quick Start: Modern UI/UX Implementation

## 🚀 Getting Started in 5 Minutes

### 1. Import Modern Components
```tsx
import {
  ModernStatCard,
  ModernProgressCard,
  ModernStatusBadge,
  ModernEmptyState,
  ModernFeatureCard,
  ModernMetricDisplay,
  ModernSectionHeader,
} from '../components/ModernUIKit';
```

### 2. Use in Your Component
```tsx
import { Box, Stack } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Package, Award, DollarSign } from 'lucide-react';
import { ModernStatCard, ModernSectionHeader } from '../components/ModernUIKit';

export const MyDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Section Header */}
      <ModernSectionHeader
        title="Dashboard"
        subtitle="Welcome back!"
      />

      {/* Stat Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Total Exports"
            value={1234}
            subtitle="On-chain records"
            icon={<Package size={24} />}
            trend={{ value: 12.5, direction: 'up' }}
            color="primary"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Completed"
            value={856}
            subtitle="Successfully delivered"
            icon={<Award size={24} />}
            trend={{ value: 8.2, direction: 'up' }}
            color="success"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Pending"
            value={378}
            subtitle="Awaiting approval"
            icon={<Clock size={24} />}
            trend={{ value: 3.1, direction: 'down' }}
            color="warning"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Total Value"
            value="$2.5M"
            subtitle="Completed exports"
            icon={<DollarSign size={24} />}
            trend={{ value: 15.3, direction: 'up' }}
            color="secondary"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
```

---

## 📚 Common Patterns

### Pattern 1: Dashboard with Stats and Charts
```tsx
import { Box, Card, CardContent, Typography, Stack } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { ModernStatCard, ModernSectionHeader } from '../components/ModernUIKit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
  const chartData = [
    { month: 'Jan', exports: 400 },
    { month: 'Feb', exports: 600 },
    { month: 'Mar', exports: 800 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <ModernSectionHeader title="Dashboard" />

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Total Exports"
            value={1234}
            icon={<Package size={24} />}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Chart */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Export Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="exports" stroke="#6A1B9A" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
```

### Pattern 2: List with Status Badges
```tsx
import { Box, Card, CardContent, Typography, Stack, Divider } from '@mui/material';
import { ModernStatusBadge, ModernSectionHeader } from '../components/ModernUIKit';

export const ExportList = ({ exports }) => {
  return (
    <Box sx={{ p: 3 }}>
      <ModernSectionHeader title="Recent Exports" />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {exports.map((exp, idx) => (
              <Box key={exp.id}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ py: 1 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Export {exp.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exp.coffeeType} • {exp.quantity} kg
                    </Typography>
                  </Box>
                  <ModernStatusBadge
                    status={exp.status === 'COMPLETED' ? 'success' : 'pending'}
                    label={exp.status}
                  />
                </Stack>
                {idx < exports.length - 1 && <Divider />}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
```

### Pattern 3: Form with Modern Styling
```tsx
import { Box, TextField, Button, Stack, Card, CardContent, Typography } from '@mui/material';
import { ModernSectionHeader } from '../components/ModernUIKit';

export const ExportForm = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <ModernSectionHeader title="Create Export" />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Coffee Type"
              fullWidth
              placeholder="e.g., Arabica, Robusta"
            />
            <TextField
              label="Quantity (kg)"
              type="number"
              fullWidth
              placeholder="0"
            />
            <TextField
              label="Estimated Value (USD)"
              type="number"
              fullWidth
              placeholder="0"
            />
            <TextField
              label="Description"
              multiline
              rows={4}
              fullWidth
              placeholder="Enter export details..."
            />
            <Button variant="contained" size="large" fullWidth>
              Create Export
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
```

### Pattern 4: Empty State
```tsx
import { Box } from '@mui/material';
import { ModernEmptyState } from '../components/ModernUIKit';
import { Package } from 'lucide-react';

export const EmptyExports = () => {
  return (
    <Box sx={{ p: 3 }}>
      <ModernEmptyState
        icon={<Package size={48} />}
        title="No exports yet"
        description="Create your first export to get started with the blockchain consortium"
        action={{
          label: "Create Export",
          onClick: () => navigate('/exports/new')
        }}
      />
    </Box>
  );
};
```

### Pattern 5: Progress Tracking
```tsx
import { Box, Stack, Card, CardContent, Typography } from '@mui/material';
import { ModernProgressCard, ModernSectionHeader } from '../components/ModernUIKit';

export const ExportProgress = ({ export: exp }) => {
  return (
    <Box sx={{ p: 3 }}>
      <ModernSectionHeader title="Export Progress" />

      <Stack spacing={2}>
        <ModernProgressCard
          title="ECX Verification"
          value={exp.ecxProgress || 0}
          max={100}
          color="info"
        />
        <ModernProgressCard
          title="ECTA Certification"
          value={exp.ectaProgress || 0}
          max={100}
          color="warning"
        />
        <ModernProgressCard
          title="Banking Approval"
          value={exp.bankingProgress || 0}
          max={100}
          color="primary"
        />
        <ModernProgressCard
          title="Customs Clearance"
          value={exp.customsProgress || 0}
          max={100}
          color="success"
        />
      </Stack>
    </Box>
  );
};
```

---

## 🎨 Styling Tips

### Use Theme Colors
```tsx
// Access theme colors
const theme = useTheme();

sx={{
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.background.paper,
}}
```

### Use Spacing Units
```tsx
// 8px base unit
sx={{
  p: 3,      // 24px padding
  mb: 2,     // 16px margin-bottom
  gap: 1.5,  // 12px gap
}}
```

### Use Transitions
```tsx
sx={{
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
  }
}}
```

### Use Shadows
```tsx
sx={{
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  }
}}
```

---

## 🔧 Customization

### Change Colors
```tsx
// In theme.config.enhanced.ts
export const orgPalettes = {
  'your-org': {
    primary: {
      main: '#YOUR_COLOR',
      light: '#LIGHTER_COLOR',
      dark: '#DARKER_COLOR',
    },
    // ...
  }
};
```

### Change Typography
```tsx
// In theme.config.enhanced.ts
export const baseTheme = {
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      // ...
    },
  }
};
```

### Change Spacing
```tsx
// In theme.config.enhanced.ts
export const baseTheme = {
  spacing: 8, // Base unit in pixels
};
```

---

## 📱 Responsive Examples

### Responsive Grid
```tsx
<Grid container spacing={3}>
  <Grid xs={12} sm={6} md={4} lg={3}>
    {/* Content */}
  </Grid>
</Grid>
```

### Responsive Typography
```tsx
<Typography
  variant="h4"
  sx={{
    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
  }}
>
  Responsive Title
</Typography>
```

### Responsive Padding
```tsx
<Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
  Responsive Padding
</Box>
```

---

## ⚡ Performance Tips

### 1. Use Memoization
```tsx
import { memo } from 'react';

export const StatCard = memo(({ title, value }) => (
  <ModernStatCard title={title} value={value} />
));
```

### 2. Lazy Load Components
```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));

<Suspense fallback={<LoadingSkeleton />}>
  <Dashboard />
</Suspense>
```

### 3. Use useCallback
```tsx
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

### 4. Optimize Re-renders
```tsx
const [data, setData] = useState(initialData);

// Only update when needed
useEffect(() => {
  if (shouldUpdate) {
    setData(newData);
  }
}, [shouldUpdate]);
```

---

## 🧪 Testing

### Test Component Rendering
```tsx
import { render, screen } from '@testing-library/react';
import { ModernStatCard } from '../components/ModernUIKit';

test('renders stat card', () => {
  render(
    <ModernStatCard
      title="Test"
      value={100}
      color="primary"
    />
  );
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Test Interactions
```tsx
import { render, screen, fireEvent } from '@testing-library/react';

test('handles click', () => {
  const handleClick = jest.fn();
  render(
    <ModernStatCard
      title="Test"
      value={100}
      onClick={handleClick}
    />
  );
  fireEvent.click(screen.getByText('Test'));
  expect(handleClick).toHaveBeenCalled();
});
```

---

## 🐛 Troubleshooting

### Issue: Styles not applying
**Solution**: Check if theme provider is wrapping your component
```tsx
<ThemeProvider theme={theme}>
  <YourComponent />
</ThemeProvider>
```

### Issue: Colors not matching
**Solution**: Verify organization ID matches palette key
```tsx
// Check in App.tsx
console.log('Organization:', org);
```

### Issue: Animations not smooth
**Solution**: Check if reduced motion is enabled
```tsx
// In global.css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

### Issue: Mobile layout broken
**Solution**: Use responsive Grid and breakpoints
```tsx
<Grid xs={12} sm={6} md={4}>
  {/* Will be full width on mobile, half on tablet, 1/3 on desktop */}
</Grid>
```

---

## 📚 Additional Resources

### Documentation
- [Material-UI Docs](https://mui.com)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)
- [Recharts Docs](https://recharts.org)

### Design Files
- `MODERN_UI_UX_GUIDE.md` - Complete design system
- `IMPLEMENTATION_CHECKLIST.md` - Implementation guide
- `theme.config.enhanced.ts` - Theme configuration
- `ModernUIKit.tsx` - Component library

### Examples
- Dashboard pages
- Form pages
- List pages
- Detail pages
- Empty states

---

## ✨ Best Practices

1. **Always use theme colors** - Don't hardcode colors
2. **Use spacing units** - Maintain consistent spacing
3. **Add transitions** - Make interactions smooth
4. **Test responsiveness** - Check on all screen sizes
5. **Ensure accessibility** - Use semantic HTML
6. **Optimize performance** - Lazy load and memoize
7. **Document components** - Add JSDoc comments
8. **Follow patterns** - Use established patterns
9. **Test thoroughly** - Unit and integration tests
10. **Get feedback** - Test with real users

---

**Ready to build modern UIs!** 🚀

For more details, see `MODERN_UI_UX_GUIDE.md`
