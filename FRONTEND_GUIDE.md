# Coffee Blockchain Consortium - Frontend Guide

## Overview

The Coffee Blockchain Consortium frontend is a modern, responsive web application built with React and Vite. It provides a unified portal for all organizations in the consortium with role-based access control.

## Color Scheme

The entire application uses a consistent three-color palette:

### Primary Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **GOLDEN** | `#FFD700` | Primary buttons, highlights, success states, main text |
| **PURPLE** | `#8B00FF` | Secondary elements, borders, interactive states |
| **BLACK** | `#000000` | Backgrounds, surfaces, containers |

### Color Variations

```css
/* Golden Shades */
--color-golden: #FFD700        /* Primary golden */
--color-golden-light: #FFE55C  /* Lighter golden for hover states */
--color-golden-dark: #DAA520   /* Darker golden for active states */

/* Purple Shades */
--color-purple: #8B00FF        /* Primary purple */
--color-purple-light: #A64DFF  /* Lighter purple for text */
--color-purple-dark: #6600CC   /* Darker purple for borders */

/* Black Shades */
--color-black: #000000         /* Pure black background */
--color-black-light: #1A1A1A   /* Slightly lighter for surfaces */
--color-black-lighter: #2D2D2D /* Even lighter for elevated surfaces */
```

## Design System

### Typography

- **Headings**: Golden gradient with bold weight
- **Body Text**: Purple-light for readability
- **Monospace**: Used for IDs and codes (Golden)
- **Muted Text**: Gray (#999999) for secondary information

### Spacing Scale

```css
--spacing-xs: 0.25rem   /* 4px */
--spacing-sm: 0.5rem    /* 8px */
--spacing-md: 1rem      /* 16px */
--spacing-lg: 1.5rem    /* 24px */
--spacing-xl: 2rem      /* 32px */
--spacing-2xl: 3rem     /* 48px */
```

### Border Radius

```css
--radius-sm: 0.25rem    /* 4px - Small elements */
--radius-md: 0.5rem     /* 8px - Buttons, inputs */
--radius-lg: 0.75rem    /* 12px - Cards */
--radius-xl: 1rem       /* 16px - Large containers */
```

### Shadows

All shadows use purple tones for consistency:

```css
--shadow-sm: 0 1px 2px 0 rgba(139, 0, 255, 0.1)
--shadow-md: 0 4px 6px -1px rgba(139, 0, 255, 0.2)
--shadow-lg: 0 10px 15px -3px rgba(139, 0, 255, 0.3)
--shadow-xl: 0 20px 25px -5px rgba(139, 0, 255, 0.4)
```

## Components

### Button Component

**Variants:**
- `primary` - Golden gradient background
- `secondary` - Purple gradient background
- `outline` - Transparent with golden border
- `ghost` - Transparent with no border
- `danger` - Purple gradient for destructive actions

**Sizes:**
- `small` - Compact buttons
- `medium` - Default size
- `large` - Prominent actions

**Example:**
```jsx
<Button variant="primary" size="large" icon={<Plus />}>
  Create Export
</Button>
```

### Card Component

Cards are the primary container component with:
- Black gradient background
- Purple border
- Hover effects (lift and glow)
- Optional icon and actions

**Example:**
```jsx
<Card 
  title="Export Records" 
  icon={<Package />}
  actions={<Button>View All</Button>}
>
  {/* Card content */}
</Card>
```

### Layout Component

The main layout includes:
- **Header**: Logo, user info, logout button
- **Sidebar**: Navigation menu with icons
- **Main Content**: Page content area

Features:
- Sticky header
- Collapsible sidebar on mobile
- Role-based navigation filtering

## Pages

### 1. Login Page

**Route:** `/login`

**Features:**
- Organization selection dropdown
- Username and password fields
- Animated background pattern
- Info cards showcasing features

**Color Usage:**
- Background: Black with purple pattern
- Form: Black-light surface with purple borders
- Logo: Purple gradient circle with golden icon
- Buttons: Golden primary button

### 2. Dashboard

**Route:** `/dashboard`

**Features:**
- Statistics cards with icons
- Recent activity timeline
- Quick actions based on role
- Trend indicators

**Color Usage:**
- Stat icons: Alternating golden and purple gradients
- Activity dots: Color-coded by type
- Trends: Golden for positive, purple for negative

### 3. Export Management

**Route:** `/exports`

**Access:** Exporter Bank only

**Features:**
- Export records table
- Search and filter functionality
- Status badges
- Create new export button

**Color Usage:**
- Table headers: Golden text
- Status badges: Purple/golden based on state
- Action buttons: Golden primary

### 4. Quality Certification

**Route:** `/quality`

**Access:** NCAT only

**Features:**
- Certification records table
- Grade badges (AA, A, B)
- Quality score bars
- Approval status indicators

**Color Usage:**
- Grade badges: Golden gradient
- Score bars: Purple to golden gradient
- Status icons: Golden (approved), purple (pending)

### 5. FX Rates

**Route:** `/fx-rates`

**Access:** National Bank only

**Features:**
- Current rate display (large)
- Rate history table
- Trend indicators
- Change percentages

**Color Usage:**
- Current rate icon: Golden gradient with glow
- Rate value: Large golden text
- Trends: Golden (up), purple (down)

### 6. Shipment Tracking

**Route:** `/shipments`

**Access:** Shipping Line only

**Features:**
- Active shipments table
- Origin/destination with icons
- Status tracking
- ETA display

**Color Usage:**
- Location icons: Purple
- Status badges: Color-coded by state
- Track links: Purple-light

## Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 480px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (max-width: 1024px) { }
```

### Mobile Adaptations

- Sidebar becomes overlay menu
- Tables scroll horizontally
- Stat cards stack vertically
- Reduced font sizes
- Simplified navigation

## Animations

### Transitions

```css
--transition-fast: 150ms ease-in-out
--transition-base: 250ms ease-in-out
--transition-slow: 350ms ease-in-out
```

### Keyframe Animations

1. **fadeIn** - Page load animation
2. **spin** - Loading spinner
3. **shake** - Error messages
4. **patternMove** - Login background

## Accessibility

### Features

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus visible indicators (golden outline)
- Color contrast ratios meet WCAG AA standards

### Focus States

All interactive elements have a golden focus outline:

```css
:focus-visible {
  outline: 2px solid var(--color-golden);
  outline-offset: 2px;
}
```

## State Management

### Authentication

- Token stored in localStorage
- User data stored in localStorage
- Auto-login on page refresh
- Logout clears all stored data

### Role-Based Access

Navigation items filtered based on user organization:
- `exporter` → Export Management
- `nationalbank` → FX Rates
- `ncat` → Quality Certification
- `shipping` → Shipment Tracking
- `all` → Dashboard (everyone)

## API Integration

### Proxy Configuration

Vite dev server proxies API requests:

```javascript
'/api/exporter' → 'http://localhost:3001'
'/api/nationalbank' → 'http://localhost:3002'
'/api/ncat' → 'http://localhost:3003'
'/api/shipping' → 'http://localhost:3004'
```

### Request Format

```javascript
// Example API call
const response = await fetch('/api/exporter/exports', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## Development Workflow

### 1. Start Development Server

```bash
cd frontend
npm install
npm run dev
```

Access at: `http://localhost:3000`

### 2. Development Features

- Hot Module Replacement (HMR)
- Fast refresh for React components
- Instant error overlay
- Source maps for debugging

### 3. Building for Production

```bash
npm run build
```

Output: `dist/` directory

### 4. Preview Production Build

```bash
npm run preview
```

## Customization Guide

### Changing Colors

Edit `src/index.css`:

```css
:root {
  --color-golden: #YOUR_COLOR;
  --color-purple: #YOUR_COLOR;
  --color-black: #YOUR_COLOR;
}
```

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation item in `src/components/Layout.jsx`
4. Apply common styles from `CommonPages.css`

### Creating New Components

Follow the design system:
- Use CSS variables for colors
- Apply consistent spacing
- Add hover/focus states
- Include transitions
- Make responsive

## Performance Optimization

### Implemented Optimizations

1. **Code Splitting**: React.lazy for route-based splitting
2. **Asset Optimization**: Vite optimizes images and fonts
3. **CSS**: Single stylesheet with minimal specificity
4. **Animations**: GPU-accelerated transforms
5. **Bundle Size**: Tree-shaking removes unused code

### Best Practices

- Lazy load images
- Minimize re-renders
- Use React.memo for expensive components
- Debounce search inputs
- Virtualize long lists

## Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills

Vite automatically includes necessary polyfills for:
- ES6+ features
- CSS custom properties
- Fetch API

## Troubleshooting

### Common Issues

**1. Port 3000 already in use**
```bash
# Change port in vite.config.js
server: { port: 3001 }
```

**2. API requests failing**
- Check backend servers are running
- Verify proxy configuration
- Check CORS settings

**3. Styles not loading**
- Clear browser cache
- Check CSS import in main.jsx
- Verify CSS file paths

**4. Build errors**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Testing

### Manual Testing Checklist

- [ ] Login with all organization types
- [ ] Navigate all routes
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify role-based access control
- [ ] Check all interactive elements
- [ ] Test keyboard navigation
- [ ] Verify color contrast
- [ ] Test in all supported browsers

## Deployment

### Static Hosting

The built application can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static file server

### Environment Variables

Set production environment variables:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_EXPORTER_API=https://api.yourdomain.com/exporter
VITE_NATIONALBANK_API=https://api.yourdomain.com/nationalbank
VITE_NCAT_API=https://api.yourdomain.com/ncat
VITE_SHIPPING_API=https://api.yourdomain.com/shipping
```

### Build Command

```bash
npm run build
```

### Serve Command

```bash
npm run preview
```

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration
2. **Advanced Filtering**: Multi-criteria search
3. **Data Visualization**: Charts and graphs
4. **Export Functionality**: PDF/CSV downloads
5. **Notifications**: Toast messages for events
6. **Dark Mode Toggle**: User preference (already dark!)
7. **Multi-language**: i18n support
8. **Offline Mode**: PWA capabilities

## Support

For issues or questions:
- Check this guide
- Review component documentation
- Check browser console for errors
- Verify API connectivity

---

**Color Palette Summary:**
- 🟡 GOLDEN (#FFD700) - Primary, Success, Highlights
- 🟣 PURPLE (#8B00FF) - Secondary, Borders, Interactive
- ⚫ BLACK (#000000) - Background, Surfaces, Containers

**The entire application consistently uses only these three colors throughout all components, pages, and interactions.**
