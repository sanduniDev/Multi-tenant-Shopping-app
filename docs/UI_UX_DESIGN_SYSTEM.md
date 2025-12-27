# BazaarX - UI/UX Design System Documentation

## Brand Identity

### App Name
**BazaarX** - A modern multi-tenant marketplace

### Brand Personality
- **Modern**: Clean, contemporary design language
- **Trustworthy**: Professional blue color scheme inspires confidence
- **Approachable**: Illustrated elements add warmth and personality
- **Efficient**: Streamlined user flows for quick task completion

---

## Color System

### Primary Colors
```
Primary Blue:        #2563EB (rgb(37, 99, 235))
Primary Blue Dark:   #1D4ED8 (rgb(29, 78, 216))
Primary Blue Light:  #3B82F6 (rgb(59, 130, 246))
Primary Blue 50:     #EFF6FF (rgb(239, 246, 255))
Primary Blue 100:    #DBEAFE (rgb(219, 234, 254))
```

### Secondary Colors
```
Secondary Indigo:    #4F46E5 (rgb(79, 70, 229))
Secondary Purple:    #7C3AED (rgb(124, 58, 237))
```

### Neutral Colors
```
Gray 50:   #F9FAFB
Gray 100:  #F3F4F6
Gray 200:  #E5E7EB
Gray 300:  #D1D5DB
Gray 400:  #9CA3AF
Gray 500:  #6B7280
Gray 600:  #4B5563
Gray 700:  #374151
Gray 800:  #1F2937
Gray 900:  #111827
```

### Semantic Colors
```
Success:     #059669 (Green 600)
Success BG:  #ECFDF5 (Green 50)
Warning:     #D97706 (Amber 600)
Warning BG:  #FFFBEB (Amber 50)
Error:       #DC2626 (Red 600)
Error BG:    #FEF2F2 (Red 50)
Info:        #0284C7 (Sky 600)
Info BG:     #F0F9FF (Sky 50)
```

### Dark Mode Colors
```
Background:     #0F172A (Slate 900)
Surface:        #1E293B (Slate 800)
Surface Light:  #334155 (Slate 700)
Text Primary:   #F8FAFC (Slate 50)
Text Secondary: #94A3B8 (Slate 400)
Border:         #334155 (Slate 700)
```

---

## Typography

### Font Family
- **Primary**: System default (San Francisco on iOS, Roboto on Android)
- **Monospace**: System monospace for codes/OTPs

### Type Scale
```
Display Large:   36px / 44px line-height / Bold (700)
Display Medium:  32px / 40px line-height / Bold (700)
Heading 1:       28px / 36px line-height / Bold (700)
Heading 2:       24px / 32px line-height / SemiBold (600)
Heading 3:       20px / 28px line-height / SemiBold (600)
Heading 4:       18px / 26px line-height / SemiBold (600)
Body Large:      18px / 28px line-height / Regular (400)
Body:            16px / 24px line-height / Regular (400)
Body Small:      14px / 20px line-height / Regular (400)
Caption:         12px / 16px line-height / Regular (400)
Overline:        12px / 16px line-height / Medium (500) / UPPERCASE
```

---

## Spacing System

Based on 4px grid:
```
space-1:   4px
space-2:   8px
space-3:   12px
space-4:   16px
space-5:   20px
space-6:   24px
space-8:   32px
space-10:  40px
space-12:  48px
space-16:  64px
space-20:  80px
space-24:  96px
```

### Component Spacing Guidelines
- **Input field padding**: 16px horizontal, 14px vertical
- **Button padding**: 16px horizontal, 14px vertical (small), 24px/16px (large)
- **Card padding**: 16px (compact), 24px (standard)
- **Screen padding**: 16px (mobile), 24px (tablet)
- **Section spacing**: 24px - 32px between sections
- **List item spacing**: 12px between items

---

## Border Radius

```
radius-sm:    4px   (small buttons, badges)
radius-md:    8px   (inputs, small cards)
radius-lg:    12px  (cards, modals)
radius-xl:    16px  (large cards, bottom sheets)
radius-2xl:   24px  (floating elements)
radius-full:  9999px (avatars, pills)
```

---

## Shadows (Elevation)

```css
/* Light Mode */
shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)
shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
shadow-xl:   0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

/* Dark Mode */
shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3)
shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.4)
shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.5)
```

---

## Component Specifications

### Buttons

#### Primary Button
```
Background:     #2563EB (Primary Blue)
Text:           #FFFFFF
Border Radius:  12px
Padding:        16px horizontal, 14px vertical
Font:           16px / SemiBold
Shadow:         shadow-md
Active State:   #1D4ED8 (darker blue)
Disabled:       50% opacity
```

#### Secondary Button
```
Background:     #F3F4F6 (Gray 100)
Text:           #374151 (Gray 700)
Border Radius:  12px
Active State:   #E5E7EB (Gray 200)
```

#### Outline Button
```
Background:     Transparent
Border:         2px solid #2563EB
Text:           #2563EB
Active State:   #EFF6FF background
```

#### Ghost Button
```
Background:     Transparent
Text:           #2563EB
Active State:   #EFF6FF background
```

### Input Fields

```
Background:     #FFFFFF (light) / #1E293B (dark)
Border:         1px solid #D1D5DB (light) / #334155 (dark)
Border Radius:  12px
Padding:        16px horizontal, 14px vertical
Font:           16px
Placeholder:    #9CA3AF (Gray 400)
Focus Border:   2px solid #2563EB
Error Border:   2px solid #DC2626
```

### Cards

```
Background:     #FFFFFF (light) / #1E293B (dark)
Border Radius:  16px
Padding:        20px
Shadow:         shadow-md
Border:         1px solid #F3F4F6 (light) / #334155 (dark)
```

### Avatar

```
Sizes:          24px (xs), 32px (sm), 40px (md), 56px (lg), 80px (xl)
Border Radius:  Full circle
Border:         2px solid #FFFFFF
Fallback BG:    #DBEAFE with #2563EB text (initials)
```

---

## Authentication Screens Design

### Illustrated Auth Style

Each auth screen features:
1. **Top Illustration Area** (40% of screen height)
   - SVG/Lottie illustrations related to the action
   - Subtle gradient background from Primary Blue 50 to white
   - Illustration centered with breathing room

2. **Content Area** (60% of screen height)
   - App logo/name at top
   - Welcoming headline
   - Form fields with generous spacing
   - Primary CTA button
   - Secondary link/action

### Sign In Screen Layout
```
┌─────────────────────────────┐
│                             │
│      [ILLUSTRATION]         │  40%
│    Shopping/Marketplace     │
│                             │
├─────────────────────────────┤
│                             │
│        BazaarX Logo         │
│                             │
│      Welcome Back!          │
│   Sign in to continue       │
│                             │
│  ┌─────────────────────┐    │
│  │ Email               │    │  60%
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Password        👁  │    │
│  └─────────────────────┘    │
│                             │
│     Forgot Password?        │
│                             │
│  ┌─────────────────────┐    │
│  │      Sign In        │    │
│  └─────────────────────┘    │
│                             │
│  Don't have account? SignUp │
│                             │
└─────────────────────────────┘
```

### Sign Up Screen Layout
```
┌─────────────────────────────┐
│                             │
│      [ILLUSTRATION]         │  35%
│    Create Account Art       │
│                             │
├─────────────────────────────┤
│                             │
│     Create Account          │
│  Join BazaarX today         │
│                             │
│  ┌─────────────────────┐    │
│  │ Full Name           │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │  65%
│  │ Email               │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Password        👁  │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Confirm Password 👁 │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │     Create Account  │    │
│  └─────────────────────┘    │
│                             │
│  Already have account? Login│
│                             │
└─────────────────────────────┘
```

### Role Selection Screen
```
┌─────────────────────────────┐
│                             │
│    How will you use         │
│       BazaarX?              │
│                             │
│  ┌─────────────────────┐    │
│  │   🛒                │    │
│  │                     │    │
│  │   I want to Buy     │    │
│  │   Browse and shop   │    │
│  │   from sellers      │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │   🏪                │    │
│  │                     │    │
│  │   I want to Sell    │    │
│  │   List products and │    │
│  │   manage my store   │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │      Continue       │    │
│  └─────────────────────┘    │
│                             │
│   You can switch later      │
│                             │
└─────────────────────────────┘
```

---

## Iconography

### Icon Style
- **Type**: Outline icons (2px stroke)
- **Size Options**: 16px, 20px, 24px, 28px, 32px
- **Color**: Inherits from text color
- **Library**: SF Symbols (iOS) / Material Icons (Android)

### Common Icons
```
Home:           house.fill / home
Search:         magnifyingglass / search
Cart:           cart.fill / shopping_cart
Profile:        person.fill / person
Settings:       gearshape.fill / settings
Heart:          heart.fill / favorite
Star:           star.fill / star
Arrow Back:     chevron.left / arrow_back
Arrow Right:    chevron.right / arrow_forward
Close:          xmark / close
Check:          checkmark / check
Plus:           plus / add
Minus:          minus / remove
Eye:            eye.fill / visibility
Eye Off:        eye.slash.fill / visibility_off
Mail:           envelope.fill / email
Lock:           lock.fill / lock
Shop:           bag.fill / shopping_bag
Store:          storefront.fill / store
```

---

## Animation & Motion

### Timing Functions
```
ease-out:       cubic-bezier(0.0, 0.0, 0.2, 1)   - Entries
ease-in:        cubic-bezier(0.4, 0.0, 1, 1)     - Exits
ease-in-out:    cubic-bezier(0.4, 0.0, 0.2, 1)   - State changes
spring:         damping: 15, stiffness: 150       - Bouncy interactions
```

### Duration Guidelines
```
Micro:      100ms - 150ms   (button press, toggles)
Short:      200ms - 250ms   (fades, small movements)
Medium:     300ms - 350ms   (page transitions, modals)
Long:       400ms - 500ms   (complex animations)
```

### Common Animations
1. **Button Press**: Scale to 0.97, duration 100ms
2. **Page Transition**: Slide from right, 300ms
3. **Modal Entry**: Slide from bottom + fade, 300ms
4. **Toast Entry**: Slide from top, 250ms
5. **Loading Spinner**: Continuous rotation
6. **Skeleton Pulse**: Opacity 0.4 to 1.0, 1.5s loop

---

## Illustration Guidelines

### Style
- **Art Style**: Modern flat illustrations with subtle gradients
- **Color Palette**: Uses brand blues with complementary pastels
- **Characters**: Diverse, friendly, approachable figures
- **Context**: Always relevant to the screen's purpose

### Illustration Themes by Screen
1. **Sign In**: Person unlocking door / entering marketplace
2. **Sign Up**: Person joining community / receiving welcome
3. **Forgot Password**: Person with key / mailbox
4. **Role Selection**: Split scene - shopper vs store owner
5. **Profile Setup**: Person customizing their space
6. **Empty States**: Relevant scenario-based illustrations

### Technical Specs
- **Format**: SVG preferred (scalable, small file size)
- **Max Height**: 200-250px on mobile
- **Aspect Ratio**: 4:3 or 16:9 landscape
- **Optimization**: SVGO compressed

---

## Accessibility Guidelines

### Color Contrast
- **Text on Background**: Minimum 4.5:1 ratio (WCAG AA)
- **Large Text**: Minimum 3:1 ratio
- **Interactive Elements**: Clear focus indicators

### Touch Targets
- **Minimum Size**: 44x44 points
- **Spacing**: 8px minimum between touch targets

### Screen Reader Support
- All interactive elements have accessibility labels
- Images have alt text
- Loading states announced
- Error messages read aloud

### Reduced Motion
- Respect user's motion preferences
- Provide static alternatives for animations

---

## Responsive Design

### Breakpoints
```
Mobile:         0 - 428px     (iPhone Pro Max width)
Large Mobile:   429px - 768px (Tablets portrait)
Tablet:         769px - 1024px (Tablets landscape)
Desktop:        1025px+       (Web)
```

### Layout Adjustments
- **Mobile**: Single column, full-width elements
- **Tablet**: 2-column grids, wider margins
- **Desktop**: Max content width 1200px, centered

---

## Component Library Reference

### Form Components
- Input (text, email, password, number)
- TextArea
- Select/Dropdown
- Checkbox
- Radio Button
- Switch/Toggle
- Date Picker
- OTP Input

### Feedback Components
- Toast Notification
- Alert/Banner
- Progress Bar
- Skeleton Loader
- Spinner
- Empty State

### Navigation Components
- Tab Bar
- Header
- Back Button
- Breadcrumbs
- Drawer Menu

### Content Components
- Card
- List Item
- Avatar
- Badge
- Chip/Tag
- Divider
- Image

### Overlay Components
- Modal
- Bottom Sheet
- Popover
- Tooltip
- Action Sheet

---

## File Naming Conventions

### Components
```
PascalCase for component files:
Button.tsx
InputField.tsx
ProductCard.tsx
```

### Assets
```
kebab-case for assets:
icon-home.svg
illustration-welcome.svg
logo-primary.png
```

### Styles/Constants
```
camelCase for style files:
colors.ts
typography.ts
spacing.ts
```

---

## Version History

| Version | Date       | Changes                    |
|---------|------------|----------------------------|
| 1.0.0   | 2024-12-07 | Initial design system      |

---

*This design system is a living document and will be updated as the app evolves.*
