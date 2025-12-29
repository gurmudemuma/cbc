# Visual Reference Guide - Modern UI/UX System

## 🎨 Color Palettes

### Commercial Bank
```
Primary:    #6A1B9A (Purple)
Light:      #8E24AA
Dark:       #4A148C
Secondary:  #D4AF37 (Gold)
Accent:     #FFD700 (Bright Gold)
```
**Use Case**: Banking operations, financial transactions

### National Bank
```
Primary:    #1565C0 (Blue)
Light:      #1976D2
Dark:       #0D47A1
Secondary:  #FFA000 (Orange)
Accent:     #FFB300 (Bright Orange)
```
**Use Case**: Regulatory oversight, FX management

### ECTA (Coffee Authority)
```
Primary:    #6D4C41 (Brown)
Light:      #8D6E63
Dark:       #4E342E
Secondary:  #D84315 (Deep Orange)
Accent:     #FF5722 (Bright Orange)
```
**Use Case**: Quality certification, licensing

### ECX (Commodity Exchange)
```
Primary:    #558B2F (Green)
Light:      #689F38
Dark:       #33691E
Secondary:  #795548 (Brown)
Accent:     #8D6E63 (Light Brown)
```
**Use Case**: Lot management, trading operations

### Shipping Line
```
Primary:    #0277BD (Cyan)
Light:      #0288D1
Dark:       #01579B
Secondary:  #00838F (Teal)
Accent:     #00ACC1 (Bright Cyan)
```
**Use Case**: Shipment tracking, logistics

### Custom Authorities
```
Primary:    #5E35B1 (Purple)
Light:      #7E57C2
Dark:       #4527A0
Secondary:  #F57C00 (Orange)
Accent:     #FF9800 (Bright Orange)
```
**Use Case**: Customs clearance, border control

### Exporter Portal
```
Primary:    #2E7D32 (Green)
Light:      #4CAF50
Dark:       #1B5E20
Secondary:  #F9A825 (Amber)
Accent:     #FBC02D (Bright Amber)
```
**Use Case**: Export management, pre-registration

### Semantic Colors
```
Success:    #10B981 (Green)    - Completed, approved
Warning:    #F59E0B (Amber)    - Pending, caution
Error:      #EF4444 (Red)      - Failed, error
Info:       #3B82F6 (Blue)     - Information, neutral
```

---

## 🔤 Typography Scale

### Headings
```
H1: 2.5rem, 800 weight, -0.8px spacing
   "Dashboard"

H2: 2rem, 800 weight, -0.5px spacing
   "Export Management"

H3: 1.75rem, 700 weight, -0.3px spacing
   "Recent Activity"

H4: 1.5rem, 700 weight, -0.2px spacing
   "Export Details"

H5: 1.25rem, 600 weight, -0.1px spacing
   "Section Title"

H6: 1.125rem, 600 weight
   "Subsection"
```

### Body Text
```
Body1: 1rem, 400 weight, 1.65 line height
       "This is regular body text used for main content."

Body2: 0.875rem, 400 weight, 1.6 line height
       "This is secondary body text for supporting content."

Caption: 0.8rem, 500 weight, 1.5 line height
         "This is caption text for helper information."

Button: 0.95rem, 600 weight
        "CLICK ME"
```

---

## 📐 Spacing System

### Base Unit: 8px

```
xs:  4px   (0.5 units)
sm:  8px   (1 unit)
md:  16px  (2 units)
lg:  24px  (3 units)
xl:  32px  (4 units)
2xl: 48px  (6 units)
```

### Common Spacing Values
```
Padding:
  - Card:     24px (3 units)
  - Section:  32px (4 units)
  - Page:     48px (6 units)
  - Mobile:   16px (2 units)

Margin:
  - Between sections: 32px
  - Between cards:    24px
  - Between items:    16px
  - Between lines:    8px

Gap:
  - Grid gap:        24px
  - Stack gap:       16px
  - Tight gap:       8px
```

---

## 🎛️ Component Specifications

### Button Styles

#### Contained Button
```
Background:  Primary color
Text:        White
Padding:     10px 20px (medium)
Border:      None
Radius:      12px
Shadow:      0 4px 12px rgba(0,0,0,0.08)
Hover:
  - Lift:    -2px
  - Shadow:  0 8px 20px rgba(0,0,0,0.12)
  - Shine:   Light sweep effect
Active:
  - Lift:    0px
  - Shadow:  0 4px 12px rgba(0,0,0,0.08)
```

#### Outlined Button
```
Background:  Transparent
Border:      1.5px solid primary
Text:        Primary color
Padding:     10px 20px (medium)
Radius:      12px
Hover:
  - Background: Primary at 4% opacity
  - Border:     Primary at 100%
```

#### Text Button
```
Background:  Transparent
Text:        Primary color
Padding:     8px 16px
Radius:      8px
Hover:
  - Background: Primary at 8% opacity
```

### Card Styles
```
Border Radius:  16px
Background:     White (#FFFFFF)
Border:         1px solid rgba(0,0,0,0.05)
Shadow:         0 2px 8px rgba(0,0,0,0.06)
Padding:        24px
Hover:
  - Shadow:     0 12px 24px rgba(0,0,0,0.1)
  - Transform:  translateY(-4px)
  - Duration:   250ms
```

### Input Field Styles
```
Border Radius:  12px
Border:         1.5px solid rgba(0,0,0,0.1)
Padding:        12px 16px
Font Size:      1rem
Background:     White
Focus:
  - Border:     Primary color
  - Width:      2px
  - Shadow:     0 0 0 3px rgba(primary, 0.1)
Hover:
  - Border:     Primary at 30% opacity
```

### Chip Styles
```
Border Radius:  12px
Padding:        8px 12px
Font Weight:    600
Font Size:      0.85rem
Background:     Primary at 10% opacity
Text:           Primary color
Hover:
  - Scale:      1.05
  - Duration:   200ms
```

### Alert Styles
```
Border Radius:  12px
Border Left:    4px solid (semantic color)
Padding:        16px
Shadow:         0 2px 8px rgba(0,0,0,0.06)

Success:
  - Background: rgba(16, 185, 129, 0.08)
  - Border:     #10B981
  - Text:       #047857

Warning:
  - Background: rgba(245, 158, 11, 0.08)
  - Border:     #F59E0B
  - Text:       #B45309

Error:
  - Background: rgba(239, 68, 68, 0.08)
  - Border:     #EF4444
  - Text:       #991B1B

Info:
  - Background: rgba(59, 130, 246, 0.08)
  - Border:     #3B82F6
  - Text:       #1E40AF
```

---

## 🎬 Animation Specifications

### Timing
```
100ms:  Shortest interactions (micro-interactions)
150ms:  Quick feedback (button clicks)
200ms:  Standard transitions (hover effects)
250ms:  Complex animations (card lifts)
300ms:  Page transitions (route changes)
```

### Easing Functions
```
easeInOut:  cubic-bezier(0.4, 0, 0.2, 1)
            Standard, balanced feel

easeOut:    cubic-bezier(0.0, 0, 0.2, 1)
            Entering, quick start

easeIn:     cubic-bezier(0.4, 0, 1, 1)
            Leaving, slow end

smooth:     cubic-bezier(0.25, 0.46, 0.45, 0.94)
            Modern, natural feel
```

### Common Animations
```
Hover Lift:
  - Transform: translateY(-2px)
  - Duration:  200ms
  - Easing:    easeOut

Card Hover:
  - Transform: translateY(-4px)
  - Shadow:    Enhanced
  - Duration:  250ms
  - Easing:    smooth

Fade In:
  - Opacity:   0 → 1
  - Duration:  300ms
  - Easing:    easeOut

Slide Up:
  - Transform: translateY(20px) → translateY(0)
  - Opacity:   0 → 1
  - Duration:  300ms
  - Easing:    easeOut

Spin:
  - Rotation:  0deg → 360deg
  - Duration:  1s
  - Repeat:    Infinite
  - Easing:    linear

Pulse:
  - Opacity:   1 → 0.5 → 1
  - Duration:  2s
  - Repeat:    Infinite
  - Easing:    cubic-bezier(0.4, 0, 0.6, 1)
```

---

## 📱 Responsive Breakpoints

### Screen Sizes
```
Mobile:         0px - 599px
Tablet:         600px - 959px
Small Desktop:  960px - 1279px
Desktop:        1280px - 1919px
Large Desktop:  1920px+
```

### Layout Adjustments
```
Mobile (xs):
  - Single column
  - Full width cards
  - Padding: 16px
  - Font: Smaller
  - Touch targets: 44px+

Tablet (sm):
  - Two columns
  - Adjusted padding
  - Padding: 20px
  - Font: Medium
  - Touch targets: 44px+

Desktop (md):
  - Three columns
  - Optimal spacing
  - Padding: 24px
  - Font: Standard
  - Hover effects

Large Desktop (lg):
  - Four columns
  - Maximum width
  - Padding: 32px
  - Font: Standard
  - Full features
```

---

## 🎨 Shadow System

### Elevation Levels
```
Elevation 0:  none
              No shadow, flat

Elevation 1:  0 2px 8px rgba(0,0,0,0.06)
              Subtle, minimal depth

Elevation 2:  0 4px 12px rgba(0,0,0,0.08)
              Light, slight depth

Elevation 3:  0 8px 16px rgba(0,0,0,0.1)
              Medium, noticeable depth

Elevation 4:  0 12px 24px rgba(0,0,0,0.12)
              Strong, significant depth

Elevation 5:  0 20px 25px rgba(0,0,0,0.1)
              Very strong, prominent

Elevation 6:  0 25px 50px rgba(0,0,0,0.12)
              Maximum, floating effect
```

---

## 🎯 Layout Patterns

### Dashboard Grid
```
┌─────────────────────────────────────────┐
│         App Bar (64px)                  │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │   Main Content               │
│ 220px    │   ┌──────┬──────┬──────┬──┐  │
│          │   │ Stat │ Stat │ Stat │St│  │
│          │   ├──────┴──────┴──────┴──┤  │
│          │   │      Chart (2 cols)    │  │
│          │   ├──────────────────────┤  │
│          │   │   Table (Full Width) │  │
│          │   └───────────────���──────┘  │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Card Grid
```
Desktop (4 columns):
┌──────┬──────┬──────┬──────┐
│ 25%  │ 25%  │ 25%  │ 25%  │
└──────┴──────┴──────┴──────┘

Tablet (2 columns):
┌──────────┬──────────┐
│   50%    │   50%    │
├──────────┼──────────┤
│   50%    │   50%    │
└──────────┴──────────┘

Mobile (1 column):
┌──────────────┐
│    100%      │
├──────────────┤
│    100%      │
├──────────────┤
│    100%      │
└──────────────┘
```

### Form Layout
```
┌─────────────────────────┐
│ Form Title              │
├─────────────────────────┤
│ Label                   │
│ [Input Field]           ���
│ Helper text             │
│                         │
│ Label                   │
│ [Input Field]           │
│ Helper text             │
│                         │
│ [Submit Button]         │
└─────────────────────────┘
```

---

## 🎨 Component Examples

### Stat Card
```
┌─────────────────────────────┐
│ Total Exports        [Icon] │
│                             │
│ 1,234                       │
│ On-chain records            │
│                             │
│ ↑ +12.5%                    │
└─────────────────────────────┘
```

### Progress Card
```
┌─────────────────────────────┐
│ Export Completion    75%    │
│ ████████████░░░░░░░░░░░░░░ │
│ 75 of 100 exports completed │
└─────────────────────────────┘
```

### Status Badge
```
Success:  ✓ Completed
Warning:  ⏳ Pending
Error:    ✗ Failed
Info:     ℹ Information
```

### Empty State
```
┌─────────────────────────────┐
│                             │
│          📦                 │
│                             │
│    No exports yet           │
│                             │
│  Create your first export   │
│  to get started             │
│                             │
│    [Create Export]          │
│                             │
└─────────────────────────────┘
```

---

## 🌙 Dark Mode Colors

### Dark Mode Palette
```
Background:     #121212
Surface:        #1E1E1E
Text Primary:   #FFFFFF
Text Secondary: #B0B0B0
Divider:        #424242
Border:         #333333
```

### Dark Mode Adjustments
```
Shadows:        Darker, more subtle
Borders:        Lighter, more visible
Text:           Brighter for contrast
Backgrounds:    Darker for reduced eye strain
Hover Effects:  Adjusted for visibility
```

---

## ✨ Visual Hierarchy

### Text Hierarchy
```
H1 (2.5rem, 800) - Page title
  ↓
H2 (2rem, 800) - Section title
  ↓
H3 (1.75rem, 700) - Subsection
  ↓
H4 (1.5rem, 700) - Card title
  ↓
Body1 (1rem, 400) - Main content
  ↓
Body2 (0.875rem, 400) - Secondary content
  ↓
Caption (0.8rem, 500) - Helper text
```

### Color Hierarchy
```
Primary Color - Main actions, primary content
Secondary Color - Secondary actions, accents
Success Color - Positive states, confirmations
Warning Color - Caution states, pending
Error Color - Error states, failures
Info Color - Information, neutral states
Text Primary - Main text
Text Secondary - Supporting text
Divider - Separators
```

### Depth Hierarchy
```
Elevation 0 - Background, flat elements
Elevation 1 - Base cards, subtle depth
Elevation 2 - Hovered cards, slight lift
Elevation 3 - Modals, dialogs
Elevation 4 - Floating elements
Elevation 5+ - Tooltips, popovers
```

---

## 🎓 Design Tokens

### Token System
```
Color Tokens:
  - primary.main, primary.light, primary.dark
  - secondary.main, secondary.light, secondary.dark
  - success, warning, error, info
  - text.primary, text.secondary, text.disabled
  - background.default, background.paper
  - divider

Spacing Tokens:
  - 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12

Typography Tokens:
  - h1, h2, h3, h4, h5, h6
  - body1, body2
  - button, caption

Shadow Tokens:
  - shadows[0] through shadows[24]

Transition Tokens:
  - duration.shortest (100ms)
  - duration.shorter (150ms)
  - duration.short (200ms)
  - duration.standard (250ms)
  - duration.complex (300ms)
```

---

## 📋 Quick Reference

### Most Used Values
```
Primary Color:      theme.palette.primary.main
Secondary Color:    theme.palette.secondary.main
Success Color:      #10B981
Warning Color:      #F59E0B
Error Color:        #EF4444

Standard Padding:   24px (p: 3)
Standard Gap:       24px (gap: 3)
Standard Radius:    16px
Standard Shadow:    theme.shadows[2]
Standard Duration:  250ms
Standard Easing:    cubic-bezier(0.25, 0.46, 0.45, 0.94)

Mobile Padding:     16px (p: 2)
Mobile Radius:      12px
Mobile Font:        Smaller scale
```

---

**This visual reference guide provides quick access to all design specifications and can be used as a checklist when implementing components.**

For detailed information, see MODERN_UI_UX_GUIDE.md
