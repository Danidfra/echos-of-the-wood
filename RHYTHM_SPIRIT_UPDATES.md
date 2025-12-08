# Rhythm Spirit Behavior Updates

## Summary of Changes

All requested behavior changes have been implemented for the Rhythm Spirit system. The changes are localized to rhythm-specific code and don't affect other spirit behaviors (curious, shy, hunter).

---

## 1. Tempo vs Difficulty (Rarity-Based)

**Problem**: Higher rarity rhythms were too fast (100-150ms intervals), making them unplayable with a mouse.

**Solution**: Difficulty now scales through pattern length and timing tolerance, not raw speed.

### Updated Pattern Design

**File**: `src/game/spirits/rhythm/variants.ts`

```typescript
export const RHYTHM_PATTERNS = {
  common: [
    // 3-4 beats, slower tempo (500-700ms intervals)
    [500, 500, 500, 900],
    [600, 600, 600],
    [700, 500, 500],
  ],
  
  uncommon: [
    // 7-8 beats, similar tempo (400-700ms intervals)
    [500, 500, 500, 700, 500, 500, 500, 700],
    [550, 400, 550, 550, 400, 550],
    [600, 500, 500, 600, 400, 600],
  ],
  
  rare: [
    // 10-11 beats, similar tempo (400-600ms intervals)
    [500, 450, 400, 500, 450, 400, 500, 450, 400],
    [450, 450, 600, 450, 450, 600, 450, 450, 600],
    [400, 400, 550, 400, 400, 550, 400, 400, 550],
  ],
  
  mythic: [
    // 13-14 beats, similar tempo (350-500ms intervals)
    [400, 400, 400, 400, 400, 400, 550, 400, 400, 400, 400, 400, 400],
    [350, 350, 500, 350, 350, 450, 350, 350, 500, 350, 350, 450],
    [350, 350, 350, 500, 350, 350, 350, 450, 350, 350, 350, 500, 350],
  ],
}
```

### Updated Timing Tolerances

```typescript
export const RHYTHM_TOLERANCES = {
  common: 250,      // ±250ms - very forgiving
  uncommon: 180,    // ±180ms - medium difficulty
  rare: 120,        // ±120ms - strict
  mythic: 80,       // ±80ms - very strict, requires precision
}
```

**Key Points**:
- All patterns now use 350-700ms intervals (human-playable)
- Common: 3-4 beats, very forgiving (±250ms)
- Uncommon: 7-8 beats, medium tolerance (±180ms)
- Rare: 10-11 beats, strict tolerance (±120ms)
- Mythic: 13-14 beats, very strict tolerance (±80ms)

---

## 2. Direct Click Prevention

**Problem**: Clicking directly on a rhythm spirit button triggered `onSpiritClick` even before pattern completion.

**Solution**: Added conditional logic to prevent clicks until rhythm is completed.

### Updated Button Click Handler

**File**: `src/components/game/layers/SpiritLayer.tsx`

```typescript
// Determine if this spirit can be clicked
const isRhythm = spirit.config.behavior === 'rhythm';
const rhythmCompleted = isRhythm && spirit.rhythmState?.hasCompleted;
const canClick = !isRhythm || rhythmCompleted;

return (
  <button
    key={spirit.instanceId}
    onClick={() => {
      // Only trigger onSpiritClick if:
      // - It's NOT a rhythm spirit, OR
      // - It's a rhythm spirit that has completed its pattern
      if (canClick) {
        onSpiritClick({
          instanceId: spirit.instanceId,
          configId: spirit.configId,
          config: spirit.config,
        });
      }
    }}
    // ... rest of button props
  >
```

**Behavior**:
- Non-rhythm spirits: Click works normally (immediate `onSpiritClick`)
- Rhythm spirits (incomplete): Click does nothing
- Rhythm spirits (completed): Click triggers `onSpiritClick` normally

---

## 3. Cursor Flee Behavior

**Problem**: Rhythm spirits didn't have any cursor interaction, allowing players to hover directly over them.

**Solution**: Implemented flee behavior when cursor gets too close.

### Flee Logic

**File**: `src/components/game/layers/SpiritLayer.tsx`

```typescript
// ===== Cursor Flee Behavior =====
// Rhythm spirits flee from cursor if it gets too close
const cursor = cursorRef.current;
if (cursor) {
  const dx = newX - cursor.xPct;
  const dy = newY - cursor.yPct;
  const distance = Math.hypot(dx, dy);

  // Safe radius: if cursor is closer than this, spirit flees
  const safeRadius = 20; // % of container (fixed for all rarities)

  if (distance > 0 && distance < safeRadius) {
    // Cursor is too close - flee away from it
    const normX = dx / distance;
    const normY = dy / distance;

    // Flee strength increases as cursor gets closer
    const fleeStrength = ((safeRadius - distance) / safeRadius) * 0.8;

    // Push velocity away from cursor
    newVx += normX * fleeStrength;
    newVy += normY * fleeStrength;

    // Recalculate position with flee velocity
    newX = spirit.x + newVx * speedMultiplier * deltaTime * 0.3;
    newY = spirit.y + newVy * speedMultiplier * deltaTime * 0.3;
  } else {
    // Cursor is outside safe radius - normal meditative wandering
    // Apply gentle damping to create smooth, flowing movement
    newVx *= 0.95;
    newVy *= 0.95;

    // Gentle random drift
    if (Math.random() < 0.01) {
      newVx += (Math.random() - 0.5) * 0.3;
      newVy += (Math.random() - 0.5) * 0.3;
    }
  }
}
```

**Behavior**:
- **Safe radius**: 20% of container (fixed for all rarities)
- **Inside radius**: Spirit flees away from cursor with strength proportional to proximity
- **Outside radius**: Spirit returns to normal slow, meditative wandering
- **No chasing**: Unlike shy spirits, rhythm spirits never approach the cursor

---

## 4. Rhythm Completion Feedback

**Problem**: Validation logic used absolute timestamps, making it impossible to succeed. No clear console feedback on success.

**Solution**: Switched to relative timing validation and added comprehensive logging.

### Updated Validation Logic

**File**: `src/components/game/layers/SpiritLayer.tsx`

```typescript
const handleContainerClick = useCallback(() => {
  const clickTime = performance.now();

  setSpirits(prevSpirits => {
    return prevSpirits.map(spirit => {
      if (
        spirit.config.behavior === 'rhythm' &&
        spirit.rhythmState?.isAttempting &&
        !spirit.rhythmState.hasCompleted
      ) {
        const rhythmState = spirit.rhythmState;
        const clickTimes = [...rhythmState.clickTimes, clickTime];
        const clickIndex = clickTimes.length - 1;

        // For first click, just record it as the start time
        if (clickIndex === 0) {
          return {
            ...spirit,
            rhythmState: {
              ...rhythmState,
              clickTimes: clickTimes,
            },
          };
        }

        // For subsequent clicks, validate against relative timing
        const expectedInterval = rhythmState.pattern[clickIndex - 1];
        const actualInterval = clickTime - clickTimes[clickIndex - 1];
        const timeDiff = Math.abs(actualInterval - expectedInterval);

        if (timeDiff <= rhythmState.toleranceMs) {
          // Correct click!
          const newClickTimes = clickTimes;

          // Check if this was the last beat
          if (newClickTimes.length === rhythmState.pattern.length + 1) {
            // Pattern completed successfully!
            console.log('[RhythmSpirit] Completed rhythm pattern:', {
              instanceId: spirit.instanceId,
              configId: spirit.configId,
              rarity: spirit.config.rarity,
              pattern: rhythmState.pattern,
              playerTimings: newClickTimes.slice(1).map((t, i) => t - newClickTimes[i]),
            });

            return {
              ...spirit,
              rhythmState: {
                ...rhythmState,
                clickTimes: newClickTimes,
                hasCompleted: true,
                isAttempting: false,
              },
            };
          }

          // Continue to next beat
          return { ...spirit, rhythmState: { ...rhythmState, clickTimes: newClickTimes } };
        } else {
          // Incorrect timing - reset attempt
          console.log('[RhythmSpirit] Incorrect timing - resetting:', {
            expectedInterval,
            actualInterval,
            timeDiff,
            toleranceMs: rhythmState.toleranceMs,
          });

          return {
            ...spirit,
            rhythmState: { ...rhythmState, clickTimes: [] },
          };
        }
      }

      return spirit;
    });
  });
}, []);
```

**Key Changes**:
- **Relative timing**: Player clicks are validated against intervals between beats, not absolute timestamps
- **First click**: Always accepted as the reference point
- **Subsequent clicks**: Validated against expected interval from previous click
- **Success logging**: Detailed console output on pattern completion with player timings
- **Failure logging**: Console output on incorrect timing with diagnostic info

**Console Output Examples**:

Success:
```
[RhythmSpirit] Completed rhythm pattern: {
  instanceId: "spirit-instance-42",
  configId: "rhythm-rare-01",
  rarity: "rare",
  pattern: [500, 450, 400, 500, 450, 400, 500, 450, 400],
  playerTimings: [510, 455, 395, 505, 448, 402, 495, 453, 398]
}
```

Failure:
```
[RhythmSpirit] Incorrect timing - resetting: {
  expectedInterval: 500,
  actualInterval: 680,
  timeDiff: 180,
  toleranceMs: 120
}
```

---

## 5. Localized Changes

All changes are isolated to rhythm-specific code:

### Files Modified

1. **`src/game/spirits/rhythm/variants.ts`**
   - Updated `RHYTHM_PATTERNS` (tempo and length)
   - Updated `RHYTHM_TOLERANCES` (timing windows)

2. **`src/components/game/layers/SpiritLayer.tsx`**
   - Added cursor flee behavior in rhythm section
   - Updated `handleContainerClick` for relative timing validation
   - Added conditional click logic in button handler

### Files NOT Modified

- `src/game/spirits/rhythm/base.ts` - No changes needed
- `src/game/spirits/curious/*` - Unchanged
- `src/game/spirits/shy/*` - Unchanged
- `src/game/spirits/hunter/*` - Unchanged
- `src/game/spirits/types.ts` - No type changes needed

---

## Testing

All tests pass successfully:

```
✓ src/lib/genUserName.test.ts (3 tests)
✓ src/test/ErrorBoundary.test.tsx (3 tests)
✓ src/components/NoteContent.test.tsx (5 tests)
✓ src/App.test.tsx (1 test)

Test Files  4 passed (4)
     Tests  12 passed (12)
```

TypeScript compilation: ✅ No errors
ESLint: ✅ No errors
Build: ✅ Successful

---

## Behavior Summary

### Common Rhythm Spirits
- **Pattern**: 3-4 beats
- **Tempo**: 500-700ms intervals (slow, easy to follow)
- **Tolerance**: ±250ms (very forgiving)
- **Difficulty**: Very easy - short pattern, lots of time to react

### Uncommon Rhythm Spirits
- **Pattern**: 7-8 beats
- **Tempo**: 400-700ms intervals (similar to common)
- **Tolerance**: ±180ms (medium)
- **Difficulty**: Medium - longer pattern, tighter timing

### Rare Rhythm Spirits
- **Pattern**: 10-11 beats
- **Tempo**: 400-600ms intervals (similar to common)
- **Tolerance**: ±120ms (strict)
- **Difficulty**: Hard - long pattern, strict timing

### Mythic Rhythm Spirits
- **Pattern**: 13-14 beats
- **Tempo**: 350-500ms intervals (slightly faster but still playable)
- **Tolerance**: ±80ms (very strict)
- **Difficulty**: Very hard - very long pattern, very strict timing

### Universal Rhythm Behaviors
- **Flee radius**: 20% of container (all rarities)
- **Movement**: Slow, meditative wandering when cursor is far
- **Click prevention**: Cannot click until pattern is completed
- **Validation**: Relative timing (player sets the tempo with first click)
