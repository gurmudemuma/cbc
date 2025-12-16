# Organization Color Branding Guide

## Professional Color Mixing Strategy

Each organization uses a **3-color system**:
1. **Primary Color** - Headers, buttons, navigation
2. **Secondary Color** - Accents, highlights, badges
3. **Text Color** - Main content (usually black for readability)

---

## Commercial Bank
**Theme:** Luxury & Trust (Purple + Golden + Black)

### Colors
- **Headers/Buttons:** Deep Purple `#6A1B9A`
- **Accents/Highlights:** Golden `#D4AF37`
- **Main Text:** Black `#1A1A1A`
- **Secondary Text:** Purple `#6A1B9A`
- **Background:** Clean White `#FAFAFA`

### Usage
- AppBar/Header: Purple background with golden text
- Buttons: Purple with golden text
- Cards: White with golden borders/accents
- Links: Purple
- Badges: Golden background with black text

---

## Exporter Portal
**Theme:** Agriculture & Growth (Green + Gold + Black)

### Colors
- **Headers/Buttons:** Forest Green `#2E7D32`
- **Accents/Highlights:** Amber Gold `#F9A825`
- **Main Text:** Black `#1A1A1A`
- **Secondary Text:** Green `#2E7D32`
- **Background:** Clean White `#FAFAFA`

### Usage
- AppBar/Header: Green background with white text
- Buttons: Green with white text
- Cards: White with gold accents
- Links: Green
- Badges: Gold background with black text

---

## National Bank
**Theme:** Authority & Stability (Navy + Gold + Black)

### Colors
- **Headers/Buttons:** Navy Blue `#1565C0`
- **Accents/Highlights:** Amber Gold `#FFA000`
- **Main Text:** Black `#1A1A1A`
- **Secondary Text:** Navy Blue `#1565C0`
- **Background:** Clean White `#FAFAFA`

### Usage
- AppBar/Header: Navy background with white text
- Buttons: Navy with white text
- Cards: White with gold accents
- Links: Navy blue
- Badges: Gold background with black text

---

## ECTA (Coffee & Tea Authority)
**Theme:** Coffee Heritage (Brown + Orange + Black)

### Colors
- **Headers/Buttons:** Coffee Brown `#6D4C41`
- **Accents/Highlights:** Deep Orange `#D84315`
- **Main Text:** Black `#1A1A1A`
- **Secondary Text:** Brown `#6D4C41`
- **Background:** Clean White `#FAFAFA`

### Usage
- AppBar/Header: Brown background with white text
- Buttons: Brown with white text
- Cards: White with orange accents
- Links: Brown
- Badges: Orange background with white text

---

## ECX (Ethiopian Commodity Exchange)
**Theme:** Nature & Earth (Green + Brown + Black)

### Colors
- **Headers/Buttons:** Olive Green `#558B2F`
- **Accents/Highlights:** Earth Brown `#795548`
- **Main Text:** Black `#1A1A1A`
- **Secondary Text:** Green `#558B2F`
- **Background:** Clean White `#FAFAFA`

### Usage
- AppBar/Header: Green background with white text
- Buttons: Green with white text
- Cards: White with brown accents
- Links: Green
- Badges: Brown background with white text

---

## Shipping Line
**Theme:** Ocean & Maritime (Blue + Teal + Black)

### Colors
- **Headers/Buttons:** Ocean Blue `#0277BD`
- **Accents/Highlights:** Teal `#00838F`
- **Main Text:** Black `#1A1A1A`
- **Secondary Text:** Ocean Blue `#0277BD`
- **Background:** Clean White `#FAFAFA`

### Usage
- AppBar/Header: Blue background with white text
- Buttons: Blue with white text
- Cards: White with teal accents
- Links: Ocean blue
- Badges: Teal background with white text

---

## Custom Authorities
**Theme:** Authority & Regulation (Purple + Orange + Black)

### Colors
- **Headers/Buttons:** Deep Purple `#5E35B1`
- **Accents/Highlights:** Orange Gold `#F57C00`
- **Main Text:** Black `#1A1A1A`
- **Secondary Text:** Purple `#5E35B1`
- **Background:** Clean White `#FAFAFA`

### Usage
- AppBar/Header: Purple background with white text
- Buttons: Purple with white text
- Cards: White with orange accents
- Links: Purple
- Badges: Orange background with white text

---

## Color Application Examples

### Commercial Bank Example
```jsx
// Header/AppBar
<AppBar sx={{ bgcolor: 'primary.main' }}> // Purple #6A1B9A
  <Typography sx={{ color: 'primary.contrastText' }}> // Golden #FFD700
    Commercial Bank Portal
  </Typography>
</AppBar>

// Button
<Button variant="contained" color="primary"> // Purple bg, golden text
  Create Export
</Button>

// Accent Badge
<Chip 
  label="Pending" 
  sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }} 
/> // Golden bg, black text

// Main Content Text
<Typography color="text.primary"> // Black #1A1A1A
  Export Details
</Typography>

// Secondary Text/Links
<Typography color="text.secondary"> // Purple #6A1B9A
  View more
</Typography>
```

---

## Design Principles

### 1. **Contrast for Readability**
- Always use black (`#1A1A1A`) for main body text
- White backgrounds for maximum readability
- High contrast between headers and text

### 2. **Consistent Hierarchy**
- **Primary color** = Most important elements (headers, CTAs)
- **Secondary color** = Supporting elements (badges, accents)
- **Black** = Content text
- **Gray** = Disabled/secondary text

### 3. **Professional Balance**
- 60% White/Neutral (backgrounds, cards)
- 30% Primary Color (headers, buttons, navigation)
- 10% Secondary Color (accents, highlights, badges)

### 4. **Accessibility**
- All text meets WCAG AA contrast requirements
- Color is not the only indicator of meaning
- Focus states clearly visible

---

## Implementation

### Theme Structure
```javascript
{
  primary: {
    main: '#6A1B9A',        // Headers, buttons
    contrastText: '#FFD700'  // Text on primary
  },
  secondary: {
    main: '#D4AF37',         // Accents
    contrastText: '#1A1A1A'  // Text on secondary
  },
  text: {
    primary: '#1A1A1A',      // Main text
    secondary: '#6A1B9A'     // Links, secondary text
  },
  background: {
    default: '#FAFAFA',      // Page background
    paper: '#FFFFFF'         // Card background
  }
}
```

### Component Usage
- **AppBar:** `primary.main` background
- **Buttons:** `primary` or `secondary` color
- **Typography:** `text.primary` or `text.secondary`
- **Cards:** `background.paper`
- **Chips/Badges:** `secondary` color
- **Links:** `text.secondary`

---

## Summary

✅ **Each organization has distinct, professional branding**  
✅ **3-color system for visual hierarchy**  
✅ **Black text for maximum readability**  
✅ **Consistent application across all UI elements**  
✅ **Accessible and WCAG compliant**  

**The color scheme automatically applies based on the logged-in user's organization!**
