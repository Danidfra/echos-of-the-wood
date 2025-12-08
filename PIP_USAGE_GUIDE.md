# Picture-in-Picture (PiP) Usage Guide

## For Players

### How to Use PiP

1. **Start the Game**: Navigate to the game page in your browser
2. **Find the PiP Button**: Look for the PiP icon (📺) in the top-right corner of the game viewport
3. **Click to Enable**: Click the button to enter Picture-in-Picture mode
4. **Floating Window**: A small floating window will appear showing the game
5. **Multitask**: Switch to other tabs or applications while keeping an eye on spirits
6. **Click to Exit**: Click the PiP button again (or close the floating window) to exit

### What You'll See in PiP

- **Background**: Day/night themed background matching the main game
- **Spirits**: Glowing orbs representing active spirits
  - Position matches their location in the main game
  - Color matches their spirit type
  - Size reflects their actual size
- **Game Title**: "Echos of the Wood" watermark

### Browser Compatibility

✅ **Supported Browsers**:
- Google Chrome (desktop & Android)
- Microsoft Edge
- Brave Browser
- Opera
- Samsung Internet

❌ **Not Supported**:
- Firefox (no PiP API)
- Safari (limited support)

If PiP is not available, the button will be grayed out with a tooltip explaining why.

### Troubleshooting

**Button is grayed out**:
- Your browser doesn't support PiP
- Try using Chrome, Edge, or Brave

**PiP won't start**:
- Make sure you've interacted with the page first (clicked somewhere)
- Check browser permissions for PiP
- Try refreshing the page

**PiP window is blank**:
- The game needs to be running with at least one spirit
- Try spawning a spirit using the debug menu

**Performance issues**:
- Close other PiP windows
- Close unnecessary browser tabs
- The PiP stream runs at 30 FPS, which is optimized for performance

## For Developers

### API Reference

#### useGamePiP Hook

```typescript
import { useGamePiP } from '@/hooks/useGamePiP';

const {
  isSupported,    // boolean: PiP API available
  isActive,       // boolean: currently in PiP
  isRequesting,   // boolean: entering PiP
  error,          // string | null: error message
  attachStream,   // (stream: MediaStream | null) => void
  enterPiP,       // () => Promise<void>
  exitPiP,        // () => Promise<void>
} = useGamePiP();
```

#### useGameCanvasMirror Hook

```typescript
import { useGameCanvasMirror } from '@/hooks/useGameCanvasMirror';

const { canvasRef, stream } = useGameCanvasMirror({
  width: 1280,           // canvas width
  height: 720,           // canvas height
  bgColorDay: '#1a3a2e', // day background
  bgColorNight: '#0d1f1a', // night background
  isNight: false,        // current time of day
  spirits: [],           // array of spirit positions
  fps: 30,               // frames per second
});
```

#### GamePiPToggleButton Component

```typescript
import { GamePiPToggleButton } from '@/components/game/pip/GamePiPToggleButton';

<GamePiPToggleButton
  stream={pipStream}
  onPiPChange={(isActive) => {
    console.log('PiP state changed:', isActive);
  }}
/>
```

### Integration Example

```typescript
// 1. Create canvas mirror with spirit tracking
const [spiritPositions, setSpiritPositions] = useState<SpiritPosition[]>([]);

const { stream: pipStream } = useGameCanvasMirror({
  width: 1280,
  height: 720,
  isNight,
  spirits: spiritPositions,
  fps: 30,
});

// 2. Update spirit positions periodically
useEffect(() => {
  const interval = setInterval(() => {
    const spirits = spiritLayerRef.current?.getSpirits() || [];
    const positions = spirits.map(spirit => ({
      x: spirit.x,
      y: spirit.y,
      size: spirit.config.size,
      hue: spirit.config.hue,
      behavior: spirit.config.behavior,
    }));
    setSpiritPositions(positions);
  }, 100); // 10 Hz updates

  return () => clearInterval(interval);
}, []);

// 3. Render PiP button
<GamePiPToggleButton stream={pipStream} />
```

### Extending the Canvas Mirror

To add more visual elements to the PiP canvas:

1. **Modify `useGameCanvasMirror.ts`**:
```typescript
// In the draw() function, after drawing spirits:

// Example: Add a timer overlay
ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
ctx.font = '24px serif';
ctx.textAlign = 'right';
ctx.fillText(`Time: ${gameTime}`, canvas.width - 20, 40);
```

2. **Pass additional props**:
```typescript
export interface GameCanvasMirrorOptions {
  // ... existing options
  gameTime?: number;
  score?: number;
  // etc.
}
```

### Performance Optimization

**Reduce canvas updates**:
```typescript
// Lower FPS for less CPU usage
const { stream } = useGameCanvasMirror({ fps: 20 });
```

**Reduce spirit position polling**:
```typescript
// Update every 200ms instead of 100ms
const interval = setInterval(() => {
  // update spirits
}, 200);
```

**Lower canvas resolution**:
```typescript
// 480p instead of 720p
const { stream } = useGameCanvasMirror({
  width: 854,
  height: 480,
});
```

### Testing

```typescript
// Test if PiP is supported
if (useGamePiP().isSupported) {
  console.log('PiP is available!');
}

// Test entering PiP programmatically
const { enterPiP } = useGamePiP();
await enterPiP();

// Test exiting PiP
const { exitPiP } = useGamePiP();
await exitPiP();
```

## Advanced Usage

### Custom PiP Controls

You can create custom UI for PiP instead of using the provided button:

```typescript
const { isSupported, isActive, enterPiP, exitPiP, error } = useGamePiP();

return (
  <div>
    {isSupported ? (
      <button onClick={isActive ? exitPiP : enterPiP}>
        {isActive ? 'Exit PiP' : 'Enter PiP'}
      </button>
    ) : (
      <p>PiP not supported</p>
    )}
    {error && <p className="error">{error}</p>}
  </div>
);
```

### Listening to PiP Events

The PiP video element fires events you can listen to:

```typescript
useEffect(() => {
  const video = document.pictureInPictureElement;
  if (!video) return;

  const handleResize = () => {
    console.log('PiP window resized');
  };

  video.addEventListener('resize', handleResize);
  return () => video.removeEventListener('resize', handleResize);
}, [isActive]);
```

### Multiple PiP Instances

Browsers typically only allow one PiP window at a time. The implementation handles this automatically by checking `document.pictureInPictureElement`.

## Best Practices

1. **Always check `isSupported`** before showing PiP UI
2. **Provide fallback messaging** for unsupported browsers
3. **Handle errors gracefully** with user-friendly messages
4. **Clean up resources** on component unmount
5. **Optimize canvas rendering** for performance
6. **Test across browsers** (Chrome, Edge, Brave)

## Resources

- [MDN: Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API)
- [Chrome PiP Documentation](https://developer.chrome.com/docs/web-platform/picture-in-picture/)
- [Can I Use: Picture-in-Picture](https://caniuse.com/picture-in-picture)
