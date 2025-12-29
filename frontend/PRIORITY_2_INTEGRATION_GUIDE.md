# Priority 2 Integration Guide - Step by Step

**Status**: Ready for Integration
**Estimated Time**: 2.5 hours
**Complexity**: Medium

---

## 🎯 Integration Overview

This guide provides step-by-step instructions to integrate all Priority 2 components into your application.

---

## 📋 Step 1: Update App.tsx (30 minutes)

### 1.1 Add Imports

Add these imports at the top of `src/App.tsx`:

```typescript
// Priority 2 Hooks
import { useDashboardCustomization } from './hooks/useDashboardCustomization';
import { useAccessibilitySettings } from './components/AccessibilityEnhancements';
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from './hooks/useKeyboardShortcuts';

// Priority 2 Components
import DashboardCustomizer from './components/DashboardCustomizer';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { AccessibilitySettingsDialog, SkipToMainContent } from './components/AccessibilityEnhancements';
```

### 1.2 Add State Management

Inside the `App` function, add this state:

```typescript
function App(): JSX.Element {
  // ... existing state ...
  
  // Priority 2 State
  const { settings, updateSettings } = useAccessibilitySettings();
  const { layouts, activeLayout, ...dashboardMethods } = useDashboardCustomization(user?.id);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
```

### 1.3 Setup Keyboard Shortcuts

Add this after the state declarations:

```typescript
  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.CUSTOMIZE_DASHBOARD,
      callback: () => setShowCustomizer(true),
    },
    {
      ...COMMON_SHORTCUTS.HELP,
      callback: () => setShowShortcutsHelp(true),
    },
    {
      ...COMMON_SHORTCUTS.TOGGLE_THEME,
      callback: () => toggleColorMode(),
    },
  ]);
```

### 1.4 Add Dialogs to JSX

In the return statement, add these dialogs before `</NotificationProvider>`:

```typescript
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarProvider {...snackbarProps}>
          <NotificationProvider>
            <SkipToMainContent />
            
            {/* ... existing content ... */}
            
            {/* Priority 2 Dialogs */}
            <DashboardCustomizer
              open={showCustomizer}
              onClose={() => setShowCustomizer(false)}
              layout={activeLayout}
              onUpdateLayout={dashboardMethods.updateLayout}
              onAddWidget={dashboardMethods.addWidget}
              onRemoveWidget={dashboardMethods.removeWidget}
              onToggleVisibility={dashboardMethods.toggleWidgetVisibility}
            />
            
            <KeyboardShortcutsHelp
              open={showShortcutsHelp}
              onClose={() => setShowShortcutsHelp(false)}
            />
            
            <AccessibilitySettingsDialog
              open={showAccessibility}
              onClose={() => setShowAccessibility(false)}
              settings={settings}
              onSettingsChange={updateSettings}
            />
            
            <CssBaseline />
            {/* ... rest of JSX ... */}
          </NotificationProvider>
        </SnackbarProvider>
      </LocalizationProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
```

---

## 📋 Step 2: Update Layout.tsx (15 minutes)

### 2.1 Add Imports

Add these imports at the top of `src/components/Layout.tsx`:

```typescript
import { AccessibilityButton } from './AccessibilityEnhancements';
import { useAccessibilitySettings } from './AccessibilityEnhancements';
```

### 2.2 Add State

Inside the `Layout` function, add:

```typescript
const { settings, updateSettings } = useAccessibilitySettings();
const [showAccessibility, setShowAccessibility] = useState(false);
```

### 2.3 Add Accessibility Button to AppBar

Find the AppBar section and add the accessibility button:

```typescript
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  {/* ... existing buttons ... */}
  
  <AccessibilityButton
    settings={settings}
    onOpenSettings={() => setShowAccessibility(true)}
  />
  
  {/* ... rest of buttons ... */}
</Box>
```

### 2.4 Add Accessibility Dialog

Add this before the closing `</Box>` of the Layout component:

```typescript
<AccessibilitySettingsDialog
  open={showAccessibility}
  onClose={() => setShowAccessibility(false)}
  settings={settings}
  onSettingsChange={updateSettings}
/>
```

---

## 📋 Step 3: Update Dashboard.tsx (30 minutes)

### 3.1 Add Imports

Add these imports at the top of `src/pages/Dashboard.tsx`:

```typescript
import ResponsiveGrid from '../components/ResponsiveGrid';
import DashboardCustomizer from '../components/DashboardCustomizer';
import { useDashboardCustomization } from '../hooks/useDashboardCustomization';
import { AnimatedPage, AnimatedContainer, AnimatedItem } from '../components/AdvancedAnimations';
```

### 3.2 Add State

Inside the `Dashboard` function, add:

```typescript
const { activeLayout, reorderWidgets, ...dashboardMethods } = useDashboardCustomization(user?.id);
const [showCustomizer, setShowCustomizer] = useState(false);
```

### 3.3 Add Customizer Button

In the header section, add a button to open the customizer:

```typescript
<Stack direction="row" alignItems="center" spacing={1}>
  <Button
    variant="outlined"
    startIcon={<Settings size={20} />}
    onClick={() => setShowCustomizer(true)}
  >
    Customize Dashboard
  </Button>
  <Activity size={20} />
  <Typography variant="body1">{user.organization}</Typography>
</Stack>
```

### 3.4 Replace Stat Cards with ResponsiveGrid

Replace the existing stat cards grid with:

```typescript
<ResponsiveGrid
  widgets={activeLayout?.widgets || []}
  onReorder={reorderWidgets}
  renderWidget={(widget) => {
    switch (widget.type) {
      case 'stats':
        // Find matching stat card
        const statCard = statCards.find(s => s.title.includes(widget.title));
        return statCard ? (
          <ModernStatCard
            title={statCard.title}
            value={statCard.value}
            subtitle={statCard.subtitle}
            icon={statCard.icon}
            trend={statCard.trend}
            color={statCard.color}
          />
        ) : null;
      case 'chart':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6">{widget.title}</Typography>
              {/* Your chart component */}
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent>
              <Typography>{widget.title}</Typography>
            </CardContent>
          </Card>
        );
    }
  }}
/>
```

### 3.5 Add Customizer Dialog

Add this at the end of the component:

```typescript
<DashboardCustomizer
  open={showCustomizer}
  onClose={() => setShowCustomizer(false)}
  layout={activeLayout}
  onUpdateLayout={dashboardMethods.updateLayout}
  onAddWidget={dashboardMethods.addWidget}
  onRemoveWidget={dashboardMethods.removeWidget}
  onToggleVisibility={dashboardMethods.toggleWidgetVisibility}
/>
```

### 3.6 Wrap Content with Animations

Wrap the main content with animated components:

```typescript
return (
  <AnimatedPage>
    <DashboardContainer>
      {/* ... header ... */}
      
      <AnimatedContainer>
        {/* ... stat cards or ResponsiveGrid ... */}
        
        <AnimatedItem>
          {/* ... workflow chart ... */}
        </AnimatedItem>
        
        <AnimatedItem>
          {/* ... activity section ... */}
        </AnimatedItem>
      </AnimatedContainer>
    </DashboardContainer>
  </AnimatedPage>
);
```

---

## 📋 Step 4: Update Mobile Pages (45 minutes)

### 4.1 Update ExportManagement.tsx

Add imports:

```typescript
import {
  MobileButton,
  MobileCard,
  MobileFab,
  MobileListItem,
  MobileBottomSheet,
} from '../components/MobileOptimizedComponents';
import { AnimatedPage, AnimatedContainer, AnimatedItem } from '../components/AdvancedAnimations';
```

Replace components:

```typescript
// Before:
<Button onClick={handleCreate}>Create Export</Button>

// After:
<MobileButton onClick={handleCreate}>Create Export</MobileButton>

// Before:
<Card>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// After:
<MobileCard
  title={export.name}
  subtitle={export.status}
  onSwipeLeft={() => handleDelete(export.id)}
  onSwipeRight={() => handleEdit(export.id)}
>
  {/* content */}
</MobileCard>
```

Add FAB button:

```typescript
<MobileFab
  icon={<Plus />}
  label="New Export"
  onClick={handleCreate}
  position="bottom-right"
/>
```

Wrap with animations:

```typescript
return (
  <AnimatedPage>
    <AnimatedContainer>
      {exports.map(exp => (
        <AnimatedItem key={exp.id}>
          <MobileCard
            title={exp.name}
            subtitle={exp.status}
          >
            {/* content */}
          </MobileCard>
        </AnimatedItem>
      ))}
    </AnimatedContainer>
  </AnimatedPage>
);
```

### 4.2 Update Other Pages

Repeat the same pattern for:
- `QualityCertification.tsx`
- `FXRates.tsx`
- `ShipmentTracking.tsx`
- `CustomsClearance.tsx`
- `UserManagement.tsx`

---

## 📋 Step 5: Add Animations to All Pages (30 minutes)

### 5.1 Page Transitions

Wrap all page content:

```typescript
import { AnimatedPage } from '../components/AdvancedAnimations';

export default function MyPage() {
  return (
    <AnimatedPage>
      {/* page content */}
    </AnimatedPage>
  );
}
```

### 5.2 List Animations

Wrap lists with stagger:

```typescript
import { AnimatedContainer, AnimatedItem } from '../components/AdvancedAnimations';

{items.length > 0 ? (
  <AnimatedContainer>
    {items.map(item => (
      <AnimatedItem key={item.id}>
        <ItemComponent item={item} />
      </AnimatedItem>
    ))}
  </AnimatedContainer>
) : (
  <EmptyState />
)}
```

### 5.3 Success/Error Feedback

Use animated feedback:

```typescript
import { AnimatedCheckmark, AnimatedErrorMark } from '../components/AdvancedAnimations';

{status === 'success' && <AnimatedCheckmark />}
{status === 'error' && <AnimatedErrorMark />}
```

---

## ✅ Verification Checklist

### After Each Step

- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Components render correctly
- [ ] Features work as expected
- [ ] Mobile responsive
- [ ] Animations smooth

### Final Verification

- [ ] Dashboard customization works
- [ ] Mobile components work
- [ ] Keyboard shortcuts work
- [ ] Accessibility settings work
- [ ] Animations smooth (60fps)
- [ ] All pages integrated
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance optimized

---

## 🚀 Testing Checklist

### Functionality Testing
- [ ] Create/edit/delete dashboard layouts
- [ ] Drag-and-drop widgets
- [ ] Toggle widget visibility
- [ ] Swipe gestures on mobile
- [ ] Keyboard shortcuts work
- [ ] Accessibility settings apply

### Performance Testing
- [ ] Load time <150ms
- [ ] Animations 60fps
- [ ] No memory leaks
- [ ] Bundle size acceptable

### Accessibility Testing
- [ ] Screen reader support
- [ ] Keyboard navigation
- [ ] Color contrast
- [ ] Focus management
- [ ] High contrast mode works
- [ ] Font size adjustment works

### Mobile Testing
- [ ] Touch targets 48px+
- [ ] Responsive design
- [ ] Swipe gestures work
- [ ] FAB buttons work
- [ ] Bottom sheets work

---

## 📞 Troubleshooting

### Issue: Components not rendering
**Solution**: Check imports and ensure all dependencies are installed

### Issue: TypeScript errors
**Solution**: Check types and ensure all props are passed correctly

### Issue: Animations stuttering
**Solution**: Check performance and reduce animation complexity

### Issue: Mobile not responsive
**Solution**: Check breakpoints and ensure responsive design

### Issue: Keyboard shortcuts not working
**Solution**: Check if typing in input field (shortcuts disabled in inputs)

---

## 🎯 Success Criteria

- ✅ All components integrated
- ✅ All features working
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Animations smooth
- ✅ Accessibility compliant
- ✅ Performance optimized
- ✅ Ready for production

---

## 📝 Notes

- Integration can be done incrementally
- No breaking changes to existing code
- All components are backward compatible
- No additional dependencies needed
- All TypeScript types included
- Full documentation provided

---

**Next Step**: Begin integration with Step 1 (App.tsx)

**Estimated Total Time**: 2.5 hours
**Complexity**: Medium
**Risk**: Low
