# Waving Grass Animation - Implementation Notes

## Overview

The waving grass animation has been faithfully ported from Ken Fyrstenberg Nilsen's original JavaScript implementation into the React + TypeScript `BackgroundLayer` component. The implementation preserves the exact geometry, motion algorithms, and visual appearance of the original while adapting it to modern React patterns.

## What Was Ported

### Core Algorithm Components (100% Faithful)

1. **Grass Blade Object (`createGrassObject`)**
   - Individual blade state management
   - Easing function: `easeInOut(t)` for smooth motion
   - Random angle goals with dynamic delta calculation
   - Gradient generation for realistic color variation
   - Update loop with counter-based animation

2. **Grass Generation (`makeGrass`)**
   - Random positioning across canvas width
   - Height variation (30% of base height)
   - Segment calculation for blade structure
   - Random max angle (15-65 degrees)
   - Blade width: 12px (configurable)

3. **Rendering (`renderGrass`)**
   - 7-point polygon for each blade shape
   - Smooth cardinal spline curves via `drawCurve`
   - Individual gradients (dark green at bottom, light at top)
   - Transparent canvas background (no image)

4. **Cardinal Spline Curves (`drawCurve`)**
   - Tension-based smooth curve interpolation
   - 16 segments per curve section (default)
   - Tension: 0.8 (from original)
   - Exact mathematical implementation preserved

### What Changed

1. **Removed:**
   - Background image loading
   - Animation meter/FPS counter
   - DOM slider controls
   - Document.getElementById references

2. **Added:**
   - React hooks (`useEffect`, `useRef`, `useState`)
   - TypeScript type safety
   - Configuration modal with sliders
   - FPS throttling (user-adjustable)
   - Responsive canvas sizing
   - Settings button UI

3. **Adapted:**
   - Canvas rendering in React component lifecycle
   - State management via React hooks
   - Animation loop with `requestAnimationFrame`
   - Window resize handling

## Configuration Parameters

### Default Values

```typescript
const [grassCount, setGrassCount] = useState(150);        // 20-400 blades
const [grassHeightFactor, setGrassHeightFactor] = useState(0.4);  // 0.1-0.7 (10-70%)
const [fps, setFps] = useState(30);                       // 10-60 FPS
```

### How to Modify Defaults

**In `BackgroundLayer` component:**

```typescript
// Change initial grass density
const [grassCount, setGrassCount] = useState(200); // More grass

// Change initial height
const [grassHeightFactor, setGrassHeightFactor] = useState(0.5); // Taller grass (50%)

// Change initial FPS
const [fps, setFps] = useState(60); // Smoother animation
```

### Slider Ranges

**Grass Density:**
- Min: 20 blades
- Max: 400 blades
- Default: 150 blades
- **Note:** Higher values may impact performance on slower devices

**Grass Height:**
- Min: 10% of canvas height
- Max: 70% of canvas height
- Default: 40% of canvas height
- **Note:** Height is relative to the canvas container (bottom 1/3 of viewport)

**Animation FPS:**
- Min: 10 FPS (choppy, retro feel)
- Max: 60 FPS (smooth, modern)
- Default: 30 FPS (balanced performance)
- **Note:** Lower FPS reduces CPU usage

## State Wiring

### Grass Count → Generation

```typescript
// In GrassLayer useEffect:
grassRef.current = makeGrass(ctx, grassCount, w, h * grassHeightFactor, 0.3, 12, h);
//                                 ^^^^^^^^^^
//                                 Used here
```

### Grass Height Factor → Generation

```typescript
// In GrassLayer useEffect:
grassRef.current = makeGrass(ctx, grassCount, w, h * grassHeightFactor, 0.3, 12, h);
//                                                   ^^^^^^^^^^^^^^^^^^
//                                                   Multiplied by canvas height
```

### FPS → Animation Loop

```typescript
// In animate function:
const frameInterval = 1000 / fps;
//                           ^^^
//                           Used to throttle frame rate

if (time - lastTimeRef.current < frameInterval) {
  animationIdRef.current = requestAnimationFrame(animate);
  return; // Skip this frame
}
```

## Component Structure

```
BackgroundLayer (main component)
├── State management (grassCount, grassHeightFactor, fps, isConfigOpen)
├── Background gradients & effects
├── GrassLayer (canvas rendering)
│   ├── Canvas ref & context
│   ├── Grass object array (grassRef)
│   ├── Animation loop (requestAnimationFrame)
│   └── Resize handler
├── Settings button (top-right)
└── ConfigModal (when isConfigOpen = true)
    ├── Grass density slider
    ├── Grass height slider
    └── FPS slider
```

## Performance Considerations

1. **Canvas Size:** Grass renders in bottom 1/3 of viewport (h-1/3)
2. **Blade Count:** 150 default balances visual density with performance
3. **FPS Throttling:** 30 FPS default reduces CPU usage vs 60 FPS
4. **Resize Handling:** Regenerates grass on window resize
5. **Cleanup:** Properly cancels animation frame on unmount

## Visual Appearance

- **Blade Shape:** Curved polygon with 7 control points
- **Motion:** Gentle swaying with easing (cubic ease-in-out)
- **Colors:** Dark green (#003200) to light green (#00AA00) gradients
- **Variation:** Each blade has random height, position, angle, and speed
- **Transparency:** Canvas background is transparent, allowing background layers to show through

## User Interface

**Settings Button:**
- Location: Top-right corner
- Style: Semi-transparent black background
- Icon: Gear/Settings icon (lucide-react)
- Text: "Scene"

**Configuration Modal:**
- Backdrop: Semi-transparent black (60% opacity)
- Panel: Forest-themed colors (--forest-modal)
- Controls: Range sliders with real-time value display
- Close: X button (top-right) or "Close" button (bottom-right)

## Technical Notes

1. **TypeScript Safety:** All functions properly typed with no `any` types
2. **Canvas Context:** Guaranteed non-null via type assertion after initial check
3. **Animation Loop:** Uses `requestAnimationFrame` with FPS throttling
4. **Memory Management:** Animation frame canceled in cleanup
5. **Responsive:** Canvas resizes with window, grass regenerates
6. **Layer Order:** Renders above gradients, below spirits/entities

## Future Enhancements

Potential improvements while maintaining the original algorithm:

- Wind strength parameter (affects angle range)
- Wind direction parameter (affects base angle)
- Grass color customization
- Multiple grass types (different heights/widths)
- Performance mode (reduce blade count on mobile)
- Preset configurations (dense forest, sparse meadow, etc.)

## Credits

Original waving grass simulation by Ken Fyrstenberg Nilsen (c) 2013, Abdias Software
Licensed under CC/Attribution
Ported to React + TypeScript for Echos of the Wood project
