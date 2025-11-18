# Organization Color Branding

Each organization in the Coffee Blockchain Consortium has its own distinct color branding that is applied throughout the application.

## Organization Color Schemes

### 1. commercialbank (Green Theme)
- **Primary Color**: `#219653` (Forest Green)
- **Secondary Color**: `#F1C40F` (Golden Yellow)
- **Background**: `#F0FFF0` (Honeydew)
- **Text**: `#2C3E50` (Dark Blue Gray)
- **Theme**: Natural, Growth, Agriculture

### 2. National Bank (Blue Theme)
- **Primary Color**: `#2980B9` (Ocean Blue)
- **Secondary Color**: `#BDC3C7` (Silver)
- **Background**: `#F8F9F9` (Light Gray)
- **Text**: `#34495E` (Slate Gray)
- **Theme**: Trust, Stability, Financial

### 3. ECTA - Quality Assurance (Red Theme)
- **Primary Color**: `#C0392B` (Crimson Red)
- **Secondary Color**: `#E67E22` (Carrot Orange)
- **Background**: `#FFF5F5` (Snow)
- **Text**: `#2C3E50` (Dark Blue Gray)
- **Theme**: Quality, Certification, Authority

### 4. Shipping Line (Teal Theme)
- **Primary Color**: `#16A085` (Persian Green)
- **Secondary Color**: `#34495E` (Wet Asphalt)
- **Background**: `#F0F8FF` (Alice Blue)
- **Text**: `#2C3E50` (Dark Blue Gray)
- **Theme**: Maritime, Logistics, Movement

### 5. Custom Authorities (Purple Theme)
- **Primary Color**: `#8E24AA` (Purple)
- **Secondary Color**: `#4B0082` (Indigo)
- **Background**: `#F3E5F5` (Lavender Blush)
- **Text**: `#212121` (Almost Black)
- **Theme**: Authority, Regulation, Government

## How It Works

### 1. CSS Variables
Each organization has CSS custom properties defined in `/src/index.css`:

```css
.organization-exporter {
  --color-primary: #219653;
  --color-primary-hover: #1B7A43;
  --color-secondary: #F1C40F;
  --color-background: #F0FFF0;
  /* ... more variables */
}
```

### 2. Dynamic Class Application
The `App.jsx` component applies the organization-specific class to the root element:

```jsx
<div className={`organization-${getOrgClass(org)}`}>
  {/* App content */}
</div>
```

### 3. Component Usage
All components use CSS variables that automatically adapt to the organization:

```css
.btn-primary {
  background: var(--color-primary);
  color: white;
}

.nav-item.active {
  background: var(--color-primary);
  color: white;
}
```

## Branded Components

### Buttons
- **Primary Button**: Uses organization's primary color
- **Secondary Button**: Uses organization's secondary color
- **Outline Button**: Border and text in primary color
- **Ghost Button**: Transparent with primary color text

### Navigation
- **Active Nav Item**: Highlighted with organization's primary color
- **Sidebar Header**: Organization name displayed
- **Logout Button**: Uses organization's primary color

### Cards & Containers
- **Borders**: Use organization-specific border colors
- **Backgrounds**: Light tints of organization colors
- **Headers**: Primary color accents

### Forms & Inputs
- **Focus States**: Primary color highlights
- **Validation**: Organization-themed success/error states

## Adding a New Organization

To add a new organization with custom branding:

1. **Define Colors** in `/src/index.css`:
```css
:root {
  --new-org-primary: #YOUR_COLOR;
  --new-org-secondary: #YOUR_COLOR;
  --new-org-background: #YOUR_COLOR;
  --new-org-text: #YOUR_COLOR;
}
```

2. **Create Organization Class**:
```css
.organization-new-org {
  --color-primary: var(--new-org-primary);
  --color-primary-hover: /* darker shade */;
  --color-secondary: var(--new-org-secondary);
  --color-background: var(--new-org-background);
  --color-text-primary: var(--new-org-text);
  --color-border: /* complementary color */;
}
```

3. **Update Mapping** in `/src/App.jsx`:
```jsx
const getOrgClass = (org) => {
  // ... existing mappings
  if (orgLower.includes('new-org')) return 'new-org';
  // ...
};
```

4. **Add to Config** in `/src/config/api.config.js`:
```javascript
{
  id: 'new-org',
  value: 'new-org',
  label: 'New Organization',
  apiUrl: 'http://localhost:3006',
  // ...
}
```

## Color Accessibility

All organization color schemes have been designed with accessibility in mind:

- **Contrast Ratios**: All text meets WCAG AA standards (4.5:1 minimum)
- **Color Blindness**: Colors are distinguishable for common types of color blindness
- **Focus Indicators**: Clear focus states for keyboard navigation

## Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Test with all organizations** when adding new UI components
3. **Maintain consistent hover states** (opacity: 0.9)
4. **Avoid organization-specific logic** in JavaScript when possible
5. **Use semantic color names** (primary, secondary) not specific colors

## Visual Identity

Each organization's color scheme reflects its role:

- **Green (Exporter)**: Agriculture, growth, natural products
- **Blue (National Bank)**: Trust, stability, financial security
- **Red (ECTA)**: Quality control, certification authority
- **Teal (Shipping)**: Ocean, logistics, international trade
- **Purple (Customs)**: Government authority, regulation

---

**Last Updated**: 2024-01-XX
**Maintained By**: Frontend Team
