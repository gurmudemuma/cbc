# Coffee Blockchain - Design System Guide

## Overview
A comprehensive, professional design system ensuring consistency across all components.

---

## 🎨 Design Principles

### 1. **Consistency**
- Unified color palette
- Standardized spacing
- Consistent typography
- Reusable components

### 2. **Accessibility**
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- Focus indicators

### 3. **Responsiveness**
- Mobile-first approach
- Fluid layouts
- Breakpoint system
- Touch-friendly targets

### 4. **Performance**
- CSS-only animations
- Hardware acceleration
- Minimal repaints
- Optimized assets

---

## 🎨 Color System

### Primary Colors (Purple Theme)
```css
--color-primary: #8E24AA        /* Main brand color */
--color-primary-light: #AB47BC  /* Hover states */
--color-primary-dark: #6A1B9A   /* Active states */
--color-primary-50: #F3E5F5     /* Backgrounds */
--color-primary-100: #E1BEE7    /* Borders */
```

### Semantic Colors
```css
--color-success: #4CAF50   /* Success states */
--color-warning: #FF9800   /* Warning states */
--color-error: #F44336     /* Error states */
--color-info: #2196F3      /* Info states */
```

### Neutral Colors
```css
--color-gray-50: #FAFAFA   /* Lightest */
--color-gray-900: #212121  /* Darkest */
```

### Usage Examples
```html
<!-- Primary Button -->
<button class="btn btn-primary">Submit</button>

<!-- Success Alert -->
<div class="alert alert-success">Success message</div>

<!-- Text Colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
```

---

## 📏 Spacing System

### Scale (8px base)
```css
--spacing-xs: 4px    /* 0.25rem */
--spacing-sm: 8px    /* 0.5rem */
--spacing-md: 16px   /* 1rem */
--spacing-lg: 24px   /* 1.5rem */
--spacing-xl: 32px   /* 2rem */
--spacing-2xl: 48px  /* 3rem */
--spacing-3xl: 64px  /* 4rem */
```

### Usage
```html
<!-- Margin utilities -->
<div class="mt-3 mb-4">Content</div>

<!-- Padding utilities -->
<div class="p-3">Content</div>

<!-- Gap utilities -->
<div class="flex gap-3">Items</div>
```

---

## 📝 Typography

### Font Sizes
```css
--font-size-xs: 0.75rem    /* 12px */
--font-size-sm: 0.875rem   /* 14px */
--font-size-base: 1rem     /* 16px */
--font-size-lg: 1.125rem   /* 18px */
--font-size-xl: 1.25rem    /* 20px */
--font-size-2xl: 1.5rem    /* 24px */
--font-size-3xl: 1.875rem  /* 30px */
--font-size-4xl: 2.25rem   /* 36px */
```

### Font Weights
```css
--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Typography Classes
```html
<h1 class="heading-1">Main Heading</h1>
<h2 class="heading-2">Section Heading</h2>
<h3 class="heading-3">Subsection</h3>
<p class="body-base">Body text</p>
<span class="caption">Caption text</span>
```

---

## 🔘 Button System

### Variants
```html
<!-- Primary (default action) -->
<button class="btn btn-primary">Primary</button>

<!-- Secondary (alternative action) -->
<button class="btn btn-secondary">Secondary</button>

<!-- Outline (tertiary action) -->
<button class="btn btn-outline">Outline</button>

<!-- Ghost (minimal emphasis) -->
<button class="btn btn-ghost">Ghost</button>

<!-- Semantic buttons -->
<button class="btn btn-success">Success</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-error">Error</button>
```

### Sizes
```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### States
```html
<!-- Disabled -->
<button class="btn btn-primary" disabled>Disabled</button>

<!-- With icon -->
<button class="btn btn-primary">
  <svg>...</svg>
  <span>With Icon</span>
</button>

<!-- Icon only -->
<button class="btn btn-primary btn-icon">
  <svg>...</svg>
</button>
```

---

## 📦 Card System

### Basic Card
```html
<div class="card">
  <div class="card-header">
    <h3 class="heading-4">Card Title</h3>
  </div>
  <div class="card-body">
    <p>Card content goes here</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Card Variants
```html
<!-- Hoverable card -->
<div class="card">
  <!-- Content -->
</div>

<!-- Elevated card -->
<div class="card shadow-lg">
  <!-- Content -->
</div>
```

---

## 📝 Form System

### Form Group
```html
<div class="form-group">
  <label class="form-label" for="email">Email</label>
  <input 
    type="email" 
    id="email" 
    class="form-input"
    placeholder="Enter email"
  />
  <span class="form-helper">We'll never share your email</span>
</div>
```

### Form States
```html
<!-- Error state -->
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-input error" />
  <span class="form-error">Email is required</span>
</div>

<!-- Disabled state -->
<input type="text" class="form-input" disabled />
```

---

## 📊 Table System

### Basic Table
```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td><span class="badge badge-success">Active</span></td>
        <td>
          <button class="btn btn-sm btn-outline">Edit</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🏷️ Badge System

### Badge Variants
```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
<span class="badge badge-neutral">Neutral</span>
```

### Usage in Tables
```html
<td>
  <span class="badge badge-success">Approved</span>
</td>
<td>
  <span class="badge badge-warning">Pending</span>
</td>
<td>
  <span class="badge badge-error">Rejected</span>
</td>
```

---

## 🚨 Alert System

### Alert Variants
```html
<!-- Success -->
<div class="alert alert-success">
  <svg>...</svg>
  <div>
    <strong>Success!</strong>
    <p>Your changes have been saved.</p>
  </div>
</div>

<!-- Warning -->
<div class="alert alert-warning">
  <svg>...</svg>
  <div>
    <strong>Warning!</strong>
    <p>Please review your information.</p>
  </div>
</div>

<!-- Error -->
<div class="alert alert-error">
  <svg>...</svg>
  <div>
    <strong>Error!</strong>
    <p>Something went wrong.</p>
  </div>
</div>

<!-- Info -->
<div class="alert alert-info">
  <svg>...</svg>
  <div>
    <strong>Info</strong>
    <p>New features available.</p>
  </div>
</div>
```

---

## 🎭 Shadow System

### Shadow Levels
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.12)
--shadow-2xl: 0 20px 40px rgba(0, 0, 0, 0.15)
```

### Usage
```html
<div class="card shadow">Default shadow</div>
<div class="card shadow-lg">Large shadow</div>
```

---

## 🔄 Animation System

### Transitions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Best Practices
- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Keep animations under 300ms
- Use `cubic-bezier` for natural motion

---

## 📱 Responsive Breakpoints

### Breakpoints
```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Usage
```css
.component {
  /* Mobile styles (default) */
  padding: var(--spacing-sm);
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: var(--spacing-md);
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: var(--spacing-lg);
  }
}
```

---

## 🛠️ Utility Classes

### Flexbox
```html
<div class="flex items-center justify-between gap-3">
  <span>Left</span>
  <span>Right</span>
</div>
```

### Spacing
```html
<div class="mt-3 mb-4 p-3">Content</div>
```

### Text
```html
<p class="text-center text-primary">Centered primary text</p>
```

### Display
```html
<div class="hidden">Hidden on all screens</div>
<div class="block">Block display</div>
```

---

## ✅ Component Checklist

When creating a new component, ensure:

- [ ] Uses design system variables
- [ ] Responsive on all screen sizes
- [ ] Accessible (keyboard, screen reader)
- [ ] Has focus states
- [ ] Has hover states
- [ ] Has disabled states
- [ ] Follows naming conventions
- [ ] Documented with examples
- [ ] Tested in all browsers
- [ ] Performance optimized

---

## 📚 Best Practices

### CSS
1. **Use CSS variables** for all colors, spacing, typography
2. **Mobile-first** responsive design
3. **BEM naming** for custom components
4. **Utility classes** for common patterns
5. **Avoid !important** unless absolutely necessary

### Accessibility
1. **Semantic HTML** (button, nav, main, etc.)
2. **ARIA labels** for icons and actions
3. **Focus indicators** always visible
4. **Color contrast** meets WCAG AA
5. **Keyboard navigation** fully supported

### Performance
1. **CSS-only animations** when possible
2. **Hardware-accelerated** properties (transform, opacity)
3. **Minimize repaints** and reflows
4. **Lazy load** images and heavy components
5. **Code splitting** for large bundles

---

## 🎯 Migration Guide

### Converting Existing Components

**Before:**
```jsx
<button style={{ 
  backgroundColor: '#8E24AA',
  padding: '8px 16px',
  borderRadius: '8px'
}}>
  Submit
</button>
```

**After:**
```jsx
<button className="btn btn-primary">
  Submit
</button>
```

### Steps
1. Replace inline styles with utility classes
2. Use design system variables in CSS
3. Apply semantic class names
4. Test responsiveness
5. Verify accessibility

---

## 📖 Resources

- **Design System File**: `/frontend/src/styles/design-system.css`
- **Component Examples**: See individual component files
- **Color Palette**: Purple theme with semantic colors
- **Typography**: System font stack
- **Icons**: Lucide React

---

## 🚀 Summary

✅ **Comprehensive design system** with 500+ lines of CSS
✅ **Consistent styling** across all components
✅ **Professional appearance** with modern design
✅ **Accessible** and keyboard-friendly
✅ **Responsive** on all devices
✅ **Performance optimized** with CSS-only animations
✅ **Easy to maintain** with CSS variables
✅ **Well documented** with examples

**Your system now has a professional, consistent design foundation!** 🎨
