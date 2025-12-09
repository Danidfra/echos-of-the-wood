# PiP Mirror Implementation

## Overview

The `useGameCanvasMirror` hook provides a **complete, self-contained mini-renderer** for Picture-in-Picture (PiP) functionality. It creates a standalone version of the game scene that runs independently from the main game viewport.

## Architecture

### Design Principles

1. **Complete Separation**: The mirror canvas does NOT reuse any DOM or rendering objects from the main game
2. **Self-Contained**: All rendering logic is contained within the hook
3. **Viewer-Only**: The mirror observes game state but never modifies it
4. **Lightweight**: Uses optimized rendering techniques suitable for streaming

### What Gets Rendered

The PiP mirror renders a complete mini-version of the game including:

#### Layer 1: Background
- Background images (day/night variants loaded from assets)
- Depth gradient overlay for atmospheric effect
- Floating firefly particles with sine-wave animation

#### Layer 2: Midground (Grass)
- Animated waving grass using cardinal spline curves
- Proper scaling based on canvas dimensions
- Day/night color variants (green for day, teal for night)
- Smooth easing animations for natural movement

#### Layer 3: Spirits
- All spirits with correct positions, sizes, and colors
- Outer glow effects using radial gradients
- Core rendering with multi-stop gradients
- Proper HSL hue mapping for each spirit

#### Layer 4: Overlay
- Game title text overlay

## API

### Hook Signature

```typescript
function useGameCanvasMirror(options: GameCanvasMirrorOptions): {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stream: MediaStream | null;
}
```

### Options

```typescript
interface GameCanvasMirrorOptions {
  /** Width of the canvas (default: 1280) */
  width?: number;
  
  /** Height of the canvas (default: 720) */
  height?: number;
  
  /** Whether it's currently night (default: false) */
  isNight?: boolean;
  
  /** Array of spirit positions to render (default: []) */
  spirits?: SpiritPosition[];
  
  /** Frames per second for canvas updates (default: 60) */
  fps?: number;
  
  /** Number of grass blades to render (default: 100) */
  grassCount?: number;
  
  /** Grass height factor 0-1 (default: 0.6) */
  grassHeightFactor?: number;
}
```

### Spirit Position Format

```typescript
interface SpiritPosition {
  x: number;        // percentage 0-100
  y: number;        // percentage 0-100
  size: number;     // pixels
  hue: number;      // HSL hue value
  behavior: string; // spirit behavior type
}
```

## Usage Example

```typescript
import { useGameCanvasMirror, SpiritPosition } from '@/hooks/useGameCanvasMirror';

function MyComponent() {
  const [spiritPositions, setSpiritPositions] = useState<SpiritPosition[]>([]);
  const [isNight, setIsNight] = useState(false);

  // Create the PiP mirror
  const { stream: pipStream } = useGameCanvasMirror({
    width: 1280,
    height: 720,
    isNight,
    spirits: spiritPositions,
    fps: 60,
    grassCount: 100,
    grassHeightFactor: 0.6,
  });

  // Update spirit positions periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const spirits = getSpiritPositions(); // Your logic here
      setSpiritPositions(spirits);
    }, 100);

    return () => clearInterval(updateInterval);
  }, []);

  // Use the stream with PiP
  return <GamePiPToggleButton stream={pipStream} />;
}
```

## Implementation Details

### Grass Rendering

The grass system uses a faithful port of Ken Fyrstenberg's waving grass algorithm:

1. **Initialization**: Creates grass blades with random positions and properties
2. **Animation**: Each blade has independent timing using easing functions
3. **Rendering**: Uses cardinal spline curves for smooth, natural-looking blades
4. **Scaling**: Grass width scales proportionally with canvas size (1% of width, minimum 8px)

#### Grass Blade Properties

- `x`, `y`: Position coordinates
- `seg1`, `seg2`: Segment heights for curve control
- `grassWidth`: Width of the blade (scales with canvas)
- `baseColor`, `tipColor`: Gradient colors (day/night variants)
- `currentAngle`: Current sway angle
- `angle`, `goal`: Animation state for smooth transitions

### Background Image Loading

- Images are cached in a Map to avoid redundant loads
- Supports day and night variants
- Falls back to solid colors while loading
- Handles load errors gracefully

### Performance Optimizations

1. **Fixed Timestep**: Renders at target FPS using requestAnimationFrame
2. **Efficient Updates**: Only updates grass animation state each frame
3. **Cached Images**: Background images loaded once and reused
4. **Lightweight Rendering**: Simplified compared to main game for streaming efficiency

### Canvas Management

The hook creates an **offscreen canvas** that:
- Is positioned off-screen (`top: -9999px`)
- Has `pointer-events: none` to avoid interaction
- Is automatically cleaned up on unmount
- Provides a MediaStream via `captureStream(fps)`

### Rendering Loop

```
requestAnimationFrame
  ↓
Check if enough time passed for target FPS
  ↓
Clear canvas
  ↓
Draw background image + depth gradient
  ↓
Draw floating particles
  ↓
Update grass animation state
  ↓
Render grass blades
  ↓
Render spirits with glows
  ↓
Draw overlay text
  ↓
Schedule next frame
```

## Differences from Main Game

The PiP mirror is intentionally simplified:

| Feature | Main Game | PiP Mirror |
|---------|-----------|------------|
| Rendering | Multi-layer React components | Single canvas |
| Grass Count | 200+ blades (configurable) | 100 blades (default) |
| FPS | 30-60 (configurable) | 60 (default) |
| Interactivity | Full click detection | None (viewer only) |
| Audio | Ambient sounds | None |
| Spirit Behaviors | Full behavior logic | Visual representation only |

## Grass Scaling Fix

**Problem**: Previously, grass size was constant regardless of canvas dimensions.

**Solution**: Grass now scales properly:
- Grass width: `Math.max(8, canvasWidth * 0.01)` (1% of canvas width, min 8px)
- Grass height: Calculated from `canvasHeight * grassHeightFactor`
- Blade segments: Scale proportionally with grass height

This ensures grass maintains proper proportions when rendered in different PiP sizes.

## Smooth Animation

**FPS Control**: The hook runs at 60 FPS by default for smooth animations.

**Frame Timing**:
```typescript
const targetFrameTime = 1000 / fps;
let lastFrameTime = 0;

if (currentTime - lastFrameTime >= targetFrameTime) {
  lastFrameTime = currentTime;
  render();
}
```

This ensures consistent frame pacing without throttling or lag.

## Integration with Main Game

The mirror observes the main game through:

1. **Spirit Positions**: Updated via `setSpiritPositions()` every 100ms
2. **Day/Night State**: Passed through `isNight` prop
3. **Grass Settings**: Synchronized with main game configuration

The main game remains completely unaware of the mirror's existence.

## Browser Compatibility

- **Canvas API**: Supported in all modern browsers
- **captureStream()**: Chrome, Edge, Firefox, Opera (Safari has limited support)
- **Background Images**: Standard image loading, universally supported

## Troubleshooting

### PiP shows blank screen
- Check that `spirits` array is being updated
- Verify background images are loading (check console for errors)
- Ensure canvas dimensions are valid (width > 0, height > 0)

### Grass not visible
- Check `grassCount > 0`
- Verify `grassHeightFactor` is between 0 and 1
- Ensure canvas height is sufficient

### Performance issues
- Reduce `grassCount` (default 100 is recommended)
- Lower `fps` if needed (30 FPS is acceptable)
- Check that spirit count is reasonable

## Future Enhancements

Potential improvements:
- Add more background particle types
- Implement weather effects (rain, snow)
- Add seasonal variations
- Support custom color schemes
- Optimize rendering for lower-end devices
