# Design Guidelines: World Cup Fan Transformation App

## Design Approach
**Reference-Based**: Draw inspiration from sports betting apps (DraftKings, ESPN Fantasy) and photo transformation apps (FaceApp, Lensa) - combining athletic energy with intuitive photo workflows.

## Core Design Principles
1. **Mobile-First Excellence**: Vertical stacking priority, thumb-friendly interactions
2. **Sports Energy**: Bold, dynamic, celebration-worthy aesthetic
3. **Clear Progressive Flow**: Unmistakable visual journey through each step
4. **Identity Preservation**: User's face is sacred - UI reinforces this trust

## Typography
- **Primary Font**: Montserrat (Google Fonts) - Bold for headers (700), SemiBold for buttons (600), Regular for body (400)
- **Hierarchy**: Hero headlines 2xl-4xl, Section headers xl-2xl, Body text base-lg, Buttons lg
- **Spanish Language**: Ensure proper character support for accents

## Layout System
**Spacing Units**: Tailwind 4, 6, 8, 12, 16 for consistency
- Mobile: Single column, full-width cards with p-6
- Desktop: Max-width container (max-w-4xl), centered cards with generous padding (p-8 to p-12)

## Screen-by-Screen Design

### 1. Welcome Screen (Hero)
**Hero Image**: Use `Captura de pantalla 2026-01-05 171649.jpg` as full-screen immersive background
- Apply subtle dark overlay (bg-black/40) for text readability
- **Primary Elements** (vertically centered):
  - Trophy image (`ChatGPT-Image-6-ene-2026-15_32_44.jpg`) at top - h-32 to h-48
  - Milenium logo (`logo-milenium.jpg`) below trophy - h-20 to h-24
  - Headline text below logos
  - "Comenzar" button with blurred background (backdrop-blur-md bg-white/20)
- Mobile: Stack tightly with spacing-6, Desktop: More breathing room with spacing-8

### 2. Team Selection Screen
**Layout**: Visual grid of team flags/jerseys
- Mobile: 2 columns (grid-cols-2 gap-4)
- Desktop: 4 columns (md:grid-cols-4 gap-6)
- **Teams**: México, EU, Canadá, España, Inglaterra, Brasil, Argentina, Portugal
- Each card: Team flag/crest icon, team name, subtle border on hover
- Clear visual feedback on selection (thick border, slight scale)

### 3. Camera/Upload Screen
**Split Interface**:
- Camera preview area (aspect-square or aspect-video)
- Clear capture button at bottom (large, circular, sports app style)
- Alternative "Upload Photo" button below
- Desktop: Center camera preview with max-width, don't stretch edge-to-edge

### 4. Processing Screen
**Centered Loading State**:
- Animated spinner (sports-themed: rotating soccer ball or trophy)
- "Transformando tu pasión..." text below
- Selected team colors incorporated into loader
- No distractions - full focus on loading experience

### 5. Results Screen
**Showcase Layout**:
- Transformed image full-width at top (aspect-square on mobile, aspect-video on desktop)
- Action buttons below in vertical stack (mobile) or horizontal row (desktop):
  - "Descargar" (primary, filled)
  - "Volver a intentar" (secondary, outline)
- Subtle celebration micro-animation on load (optional confetti or fade-in)

### 6. Admin Gallery (`/admin-secreto`)
**Grid Gallery**:
- Mobile: 2 columns, Desktop: 3-4 columns
- Each thumbnail: Hover overlay with download icon
- Discrete footer link: Small text "Admin" in footer corner

## Component Library

### Buttons
- **Primary**: Solid background, bold text, rounded-lg, px-8 py-4 (touch-friendly)
- **With Blur** (on images): backdrop-blur-md with semi-transparent white/black background
- **States**: Scale on press, no complex hover effects

### Cards
- Rounded corners (rounded-xl)
- Subtle shadow (shadow-md to shadow-lg)
- White background with clean borders

### Camera Preview
- Border with team color accent when team selected
- Corner controls (flip camera, flash) as icon buttons

### Loading Indicators
- Spinning animation (animate-spin)
- Pulsing text for status updates

## Images Strategy
1. **Hero Background**: `Captura de pantalla 2026-01-05 171649.jpg` - Full viewport on welcome
2. **Logo Assets**: Trophy and Milenium logo prominently displayed on welcome screen
3. **Team Icons**: Source flag/crest icons for 8 teams via CDN (Heroicons flags or similar)
4. **User Photos**: Aspect-square containers to prevent distortion
5. **Results Display**: Full-width showcase with download watermark option

## Accessibility
- High contrast text on image overlays
- Clear focus states for camera controls
- "Comenzar" and action buttons minimum 44px touch target
- Spanish language labels throughout

## Mobile-First Breakpoints
- Base (mobile): Single column, full-width elements
- md (768px): 2-column grids, larger buttons side-by-side
- lg (1024px): 4-column team grid, horizontal button layouts, max-w containers

## Visual Enhancements
- Smooth transitions between screens (fade/slide)
- Team color accents throughout flow after selection
- Minimal distractions during processing
- Celebration moment on successful transformation