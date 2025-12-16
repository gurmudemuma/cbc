# 🎨 UI/UX QUICK REFERENCE

**Quick guide for using new UI/UX components**

---

## 📦 NEW COMPONENTS

### EmptyState
```tsx
import EmptyState from '../components/EmptyState';

<EmptyState
  icon={<span><Package size={64} /></span>}
  title="No data"
  description="Optional description"
  action={<Button>Action</Button>}
/>
```

### LoadingButton
```tsx
import LoadingButton from '../components/LoadingButton';

<LoadingButton loading={isLoading} loadingText="Saving...">
  Save
</LoadingButton>
```

### FormField
```tsx
import FormField from '../components/FormField';

<FormField
  label="Name"
  error={errors.name}
  success={isValid}
  helperText="Helper text"
/>
```

### Toast
```tsx
import Toast from '../components/Toast';

<Toast
  open={open}
  onClose={handleClose}
  severity="success"
  title="Success"
  message="Action completed"
/>
```

### SkipLink
```tsx
import SkipLink from '../components/SkipLink';

<SkipLink />
<main id="main-content">{/* content */}</main>
```

---

## 🎨 ENHANCED THEME

```tsx
import createAccessibleTheme from './config/theme.enhanced';

const theme = createAccessibleTheme('light');
```

**Features:**
- WCAG AA contrast
- Focus indicators
- Smooth transitions
- Consistent spacing

---

## ✅ BEST PRACTICES

### Always Show Loading States
```tsx
{loading ? <LoadingSkeleton /> : <Content />}
```

### Always Show Empty States
```tsx
{data.length === 0 && !loading && <EmptyState />}
```

### Always Provide Feedback
```tsx
<Toast severity="success" message="Saved!" />
```

### Always Validate Forms
```tsx
<FormField error={error} success={isValid} />
```

---

## 🚀 QUICK START

1. Import component
2. Add to your page
3. Pass required props
4. Test accessibility

**That's it!** 🎉
