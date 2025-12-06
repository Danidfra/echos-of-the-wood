# Echos of the Wood - Game Structure Documentation

## Overview

**Echos of the Wood** is a calming exploration game where players observe, encounter, and interact with small luminous spirits in an enchanted forest. The game emphasizes patience, observation, and gradual connection-building with the forest's mystical inhabitants.

### Game Philosophy

The experience is designed to be meditative and unhurried. Players don't "win" in a traditional sense—instead, they form relationships with spirits over time, unlocking achievements and discovering the secrets of the enchanted forest through careful observation and repeated visits.

---

## Routes

The application uses React Router v6+ with the following route structure:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Welcome screen with game introduction |
| `/play` | `GamePage` | Main game interface with viewport and HUD |
| `/:nip19` | `NIP19Page` | Nostr identifier routing (inherited from template) |
| `*` | `NotFound` | 404 fallback page |

---

## Component Architecture

### Pages

#### `LandingPage` (`src/pages/LandingPage.tsx`)

The entry point for new visitors. Features:
- Animated title with enchanted forest aesthetic
- Game description text
- "Enter the Grove" button that navigates to `/play`
- Floating particle effects for atmosphere
- Soft gradient background evoking twilight forest

#### `GamePage` (`src/pages/GamePage.tsx`)

The main game container. Manages:
- Game state and modal visibility
- Spirit click handling (login check)
- Integration of HUD, viewport, and modals
- Portrait orientation detection overlay

---

### Game Components

#### `SceneViewport` (`src/components/game/SceneViewport.tsx`)

The main game rendering area. Features:
- **16:9 aspect ratio** maintained via CSS padding technique
- **Responsive sizing** - fills available width while preserving ratio
- **Three-layer architecture** for visual depth
- Rounded corners and subtle glow border

```
┌─────────────────────────────────────┐
│         SceneViewport (16:9)        │
│  ┌───────────────────────────────┐  │
│  │      BackgroundLayer (z-0)    │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   MidgroundLayer (z-10) │  │  │
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │ SpiritLayer (z-20)│  │  │  │
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### Layers

#### `BackgroundLayer` (`src/components/game/layers/BackgroundLayer.tsx`)

The deepest visual layer. Current implementation:
- Multi-gradient forest atmosphere (sky → canopy → floor)
- SVG tree silhouettes at varying depths
- Subtle ambient particles
- Radial vignette effect

**Future enhancements planned:**
- Day/night cycle with dynamic gradients
- Animated starfield during night scenes
- Weather effects (mist, rain particles)
- Parallax scrolling for depth perception

#### `MidgroundLayer` (`src/components/game/layers/MidgroundLayer.tsx`)

Interactive environmental elements. Current implementation:
- Foreground tree silhouettes (left and right clusters)
- Ground vegetation gradient
- Placeholder glowing spots (future mushrooms)

**Future enhancements planned:**
- Animated trees that sway gently in wind
- Interactive bushes that rustle when spirits pass
- Glowing mushrooms and flowers
- Ancient lanterns with flickering light
- Fallen logs and moss-covered stones
- Water features (streams, reflective puddles)
- Seasonal variations (falling leaves, snow)

#### `SpiritLayer` (`src/components/game/layers/SpiritLayer.tsx`)

The spirit entities that players interact with. Current implementation:
- Two debug spirits with different speeds (fast/medium)
- Smooth movement using `requestAnimationFrame`
- Boundary collision with bounce behavior
- Random direction changes for organic movement
- Glowing orb visuals with radial gradients and box-shadows
- Click handlers for interaction

**Spirit rendering:**
- Absolutely positioned `<button>` elements
- Multi-layer glow effect (outer glow + inner core)
- HSL-based coloring for easy theming
- Hover scale animation
- Accessible focus states

---

### UI Components

#### `GameHUD` (`src/components/game/ui/GameHUD.tsx`)

Top navigation bar. Features:
- Back button (returns to landing page)
- Centered game title
- **Logged out:** Login button via `LoginArea` component
- **Logged in:** Account and Achievements buttons
- Responsive design (icons only on mobile)

#### `Modals` (`src/components/game/ui/Modals.tsx`)

Three modal dialogs using shadcn/ui Dialog component:

1. **LoginRequiredModal**
   - Triggered when non-logged user clicks a spirit
   - Explains the need for Nostr login
   - Two actions: "Login with Nostr" / "Continue exploring"

2. **AccountModal**
   - Shows user's shortened pubkey
   - Placeholder stats: Spirits seen today, Spirits registered
   - Badges section (placeholder)

3. **AchievementsModal**
   - List of achievements with locked/unlocked states
   - Current placeholders:
     - First Spirit Seen
     - First Spirit Registered
     - Friend of the Fae
     - Night Watcher

#### `RotateDeviceOverlay` (`src/components/game/ui/RotateDeviceOverlay.tsx`)

Mobile orientation handler:
- Detects portrait orientation via CSS `@media (orientation: portrait)`
- Displays full-screen overlay with rotation prompt
- Animated rotation icon
- Visual diagram showing portrait → landscape

---

## Nostr Integration

### Current Implementation

The game uses Nostr for user identity via NIP-07 (browser extension signers):

1. **Login Flow:**
   - User clicks "Login with Nostr" button
   - `useLoginActions().loginWithExtension()` is called
   - Browser extension (Alby, nos2x, etc.) provides pubkey
   - User state is managed by `NostrLoginProvider`

2. **State Access:**
   - `useCurrentUser()` hook provides current user info
   - `user.pubkey` contains the logged-in user's public key

3. **Interaction Gating:**
   - Spirit clicks check `user` existence
   - Non-logged users see `LoginRequiredModal`
   - Logged users get `console.log("Spirit clicked", id)`

### Future Nostr Features

- **Spirit Registration:** Publish spirit encounters as Nostr events
- **Achievement Events:** Store achievements on Nostr relays
- **Social Features:** Share spirit discoveries with friends
- **Leaderboards:** Query relay for community statistics

---

## Visual Design

### Color Palette

The game uses a custom forest-themed color palette:

| Token | Hex | Usage |
|-------|-----|-------|
| `forest-dark` | `#0a1410` | Deepest backgrounds |
| `forest-mid` | `#0d1f18` | Mid-tone backgrounds |
| `forest-deep` | `#071210` | Forest floor |
| `forest-sky` | `#0f2922` | Night sky through canopy |
| `spirit-glow` | `#7dd3a8` | Spirit glow, accents |
| `spirit-light` | `#e8f5ee` | Primary text |
| `spirit-muted` | `#5a7d6a` | Secondary/disabled text |

### Typography

- **Cinzel Variable:** Display font for titles and headings
- **Cormorant Garamond:** Body text and descriptions

### Animations

Custom CSS animations defined in `index.css`:
- `animate-float`: Floating particle movement
- `animate-float-slow`: Slower ambient particles
- `animate-spin-slow`: Rotation prompt icon
- `animate-pulse`: Spirit glow pulsing (Tailwind built-in)

---

## File Structure

```
src/
├── pages/
│   ├── LandingPage.tsx      # Welcome/intro page
│   └── GamePage.tsx         # Main game page
├── components/
│   └── game/
│       ├── SceneViewport.tsx
│       ├── layers/
│       │   ├── BackgroundLayer.tsx
│       │   ├── MidgroundLayer.tsx
│       │   └── SpiritLayer.tsx
│       └── ui/
│           ├── GameHUD.tsx
│           ├── Modals.tsx
│           └── RotateDeviceOverlay.tsx
├── AppRouter.tsx            # Route configuration
├── index.css                # Custom styles & animations
└── main.tsx                 # App entry with font imports

docs/
└── echos-of-the-wood-structure.md  # This file

tailwind.config.ts           # Custom colors & fonts
```

---

## Future Steps

### Phase 2: Spirit System

- [ ] Define spirit types with unique behaviors
- [ ] Implement spirit spawning logic (time-based, location-based)
- [ ] Create spirit data model (species, rarity, personality)
- [ ] Add spirit animation states (idle, curious, fleeing)
- [ ] Implement "registration" mechanic (capturing spirit data)

### Phase 3: Environment

- [ ] Animated tree components with wind sway
- [ ] Interactive bushes and vegetation
- [ ] Glowing mushroom clusters
- [ ] Ancient lanterns with particle effects
- [ ] Water features with reflections
- [ ] Ambient sound integration

### Phase 4: Day/Night Cycle

- [ ] Time-based gradient transitions
- [ ] Different spirit behaviors by time
- [ ] Nighttime-exclusive spirits
- [ ] Moon phases affecting spirit activity
- [ ] Seasonal variations

### Phase 5: Nostr Integration

- [ ] Spirit encounter events (custom Nostr kind)
- [ ] Achievement events stored on relays
- [ ] Spirit journal/collection view
- [ ] Social sharing of discoveries
- [ ] Community leaderboards

### Phase 6: Achievements & Progression

- [ ] Real achievement tracking
- [ ] Badge system with visual rewards
- [ ] Spirit affinity levels
- [ ] Unlockable areas/scenarios
- [ ] Daily/weekly challenges

### Phase 7: Polish

- [ ] Sound design and ambient audio
- [ ] Particle system improvements
- [ ] Loading states and transitions
- [ ] Tutorial/onboarding flow
- [ ] Accessibility improvements
- [ ] Performance optimization

---

## Technical Notes

### 16:9 Aspect Ratio

The viewport uses the CSS padding-bottom technique:
```css
.viewport {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 9/16 = 0.5625 */
}
.content {
  position: absolute;
  inset: 0;
}
```

### Spirit Movement

Spirits use `requestAnimationFrame` for smooth animation:
- Delta time normalization for consistent speed across frame rates
- Velocity-based movement with boundary collision
- Random direction perturbations for organic feel
- State managed in React with `useState` and `useEffect`

### Mobile Orientation

Portrait detection uses CSS media queries:
```css
.overlay {
  display: none;
}
@media (orientation: portrait) {
  .overlay {
    display: flex;
  }
}
```
This approach is purely CSS-based and doesn't require JavaScript orientation APIs.

---

## Contributing

When adding new features:

1. Follow the established layer architecture
2. Use the custom color tokens from `tailwind.config.ts`
3. Maintain the calm, meditative aesthetic
4. Document new components in this file
5. Consider mobile/responsive behavior
6. Test with and without Nostr login

---

*Last updated: December 2024*
