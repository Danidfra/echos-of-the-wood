# Picture-in-Picture (PiP) Implementation for Echos of the Wood

## Overview

This document describes the implementation of Picture-in-Picture (PiP) support for the "Echos of the Wood" game. PiP allows players to keep a floating mini-view of the game while working in other browser tabs or applications.

## Architecture

### Components

1. **`useGamePiP` Hook** (`src/hooks/useGamePiP.ts`)
   - Core PiP functionality hook
   - Manages hidden video element lifecycle
   - Handles browser API interactions
   - Provides state management for PiP status

2. **`useGameCanvasMirror` Hook** (`src/hooks/useGameCanvasMirror.ts`)
   - Creates and manages a hidden canvas that mirrors the game viewport
   - Draws simplified representation of the game (background + spirits)
   - Generates MediaStream via `canvas.captureStream()`
   - Provides real-time updates at configurable FPS

3. **`GamePiPToggleButton` Component** (`src/components/game/pip/GamePiPToggleButton.tsx`)
   - UI button for toggling PiP mode
   - Shows appropriate states (supported, active, requesting, error)
   - Integrates with tooltip for user guidance
   - Positioned in top-right corner of game viewport

4. **`SceneViewport` Integration** (modified `src/components/game/SceneViewport.tsx`)
   - Creates canvas mirror with spirit positions
   - Tracks spirit positions from SpiritLayer
   - Renders PiP toggle button in UI layer
   - Manages stream lifecycle

5. **`SpiritLayer` Extension** (modified `src/components/game/layers/SpiritLayer.tsx`)
   - Exposes `getSpirits()` method via ref
   - Allows parent components to access spirit positions
   - No changes to existing spirit behaviors

## Browser Support

### Supported Browsers ✅
- Chrome/Chromium (desktop & mobile)
- Microsoft Edge
- Brave
- Opera
- Samsung Internet

### Unsupported Browsers ❌
- Firefox (no PiP API support)
- Safari (limited/experimental support)

### Feature Detection

The implementation uses robust feature detection:

```typescript
const isSupported =
  typeof document !== 'undefined' &&
  'pictureInPictureEnabled' in document &&
  typeof HTMLVideoElement !== 'undefined' &&
  'requestPictureInPicture' in HTMLVideoElement.prototype;
```

## Implementation Details

### 1. Canvas Mirror System

The canvas mirror creates a simplified visual representation of the game:

- **Background**: Solid color gradient (day/night modes)
- **Spirits**: Rendered as glowing orbs with:
  - Position based on actual spirit coordinates (x%, y%)
  - Size matching spirit configuration
  - Color based on spirit hue (HSL)
  - Glow effects for visibility

**Performance**:
- Canvas size: 1280x720 (720p)
- Update rate: 30 FPS
- Spirit position polling: 10 Hz (100ms intervals)

### 2. Video Element Management

The `useGamePiP` hook manages a hidden video element:

```typescript
const video = document.createElement('video');
video.muted = true;
video.playsInline = true;
video.autoplay = true;
video.style.position = 'fixed';
video.style.top = '-9999px'; // Hidden off-screen
```

**Key Features**:
- Hidden from DOM (positioned off-screen)
- Muted to avoid audio conflicts
- Auto-plays to ensure stream is active
- Cleaned up on unmount

### 3. Stream Lifecycle

1. **Canvas Creation**: Hidden canvas created on mount
2. **Stream Capture**: `canvas.captureStream(30)` generates MediaStream
3. **Video Attachment**: Stream attached to hidden video element
4. **PiP Request**: `video.requestPictureInPicture()` when user clicks button
5. **Cleanup**: All resources cleaned up on unmount

### 4. State Management

The `useGamePiP` hook manages several states:

- `isSupported`: Whether PiP API is available
- `isActive`: Whether PiP is currently active
- `isRequesting`: Loading state during PiP entry
- `error`: Human-readable error messages

### 5. Error Handling

Comprehensive error handling for common scenarios:

- **NotAllowedError**: Permission denied by browser
- **InvalidStateError**: Video not ready for PiP
- **Timeout**: Video fails to load metadata
- **Generic Errors**: Fallback error messages

## User Experience

### Button States

1. **Not Supported** (grayed out):
   - Tooltip: "Picture-in-Picture is only available on Chrome, Edge, Brave, and Opera."
   - Button disabled

2. **Ready** (default):
   - Icon: PictureInPicture
   - Tooltip: "Enter Picture-in-Picture"
   - Click to enter PiP

3. **Requesting** (loading):
   - Icon: Spinning loader
   - Tooltip: "Entering Picture-in-Picture..."
   - Button disabled

4. **Active** (glowing):
   - Icon: PictureInPicture2
   - Tooltip: "Exit Picture-in-Picture"
   - Enhanced visual with glow effect
   - Click to exit PiP

### Visual Design

- **Position**: Top-right corner of game viewport
- **Style**: Matches existing debug buttons (rounded, semi-transparent)
- **Size**: Compact circular button
- **Feedback**: Hover effects and state transitions

## Technical Considerations

### Performance

- Canvas rendering throttled to 30 FPS
- Spirit position updates at 10 Hz (sufficient for smooth movement)
- No impact on main game rendering (separate canvas)
- Minimal CPU usage when PiP is inactive

### Memory Management

- Canvas and video elements created/destroyed on mount/unmount
- MediaStream tracks properly stopped on cleanup
- Event listeners removed on component unmount

### Accessibility

- ARIA labels for screen readers
- Keyboard navigation support (via button focus)
- Clear visual states for all interactions
- Tooltips provide context for all states

## Future Enhancements

Potential improvements for future iterations:

1. **Enhanced Canvas Rendering**:
   - Add grass/midground elements
   - Render spirit behavior indicators (circles, patterns, etc.)
   - Include HUD elements (timer, score)

2. **Quality Settings**:
   - Allow users to adjust PiP resolution
   - Configurable FPS for performance tuning

3. **Audio Support**:
   - Optional ambient audio in PiP window
   - Volume controls

4. **Advanced Features**:
   - Picture-in-Picture controls (pause/resume)
   - Clickable spirits in PiP window
   - Mini-map mode

## Testing

The implementation passes all existing tests:
- TypeScript compilation ✅
- React component rendering ✅
- No breaking changes to existing features ✅

## Files Modified

1. `src/hooks/useGamePiP.ts` (NEW)
2. `src/hooks/useGameCanvasMirror.ts` (NEW)
3. `src/components/game/pip/GamePiPToggleButton.tsx` (NEW)
4. `src/components/game/SceneViewport.tsx` (MODIFIED)
5. `src/components/game/layers/SpiritLayer.tsx` (MODIFIED - added getSpirits method)

## Usage Example

```typescript
// In SceneViewport.tsx
const { stream: pipStream } = useGameCanvasMirror({
  width: 1280,
  height: 720,
  isNight,
  spirits: spiritPositions,
  fps: 30,
});

// Render PiP button
<GamePiPToggleButton stream={pipStream} />
```

## Conclusion

The PiP implementation provides a clean, performant way for players to monitor the game while multitasking. The architecture is modular, well-tested, and follows React best practices. The feature gracefully degrades on unsupported browsers with clear user feedback.
