# Rhythm Spirit Post-Success Behavior Update

## Overview

Updated the Rhythm Spirit behavior to create a clear two-phase interaction: **pre-success** (challenging) and **post-success** (rewarding). After successfully matching the rhythm pattern, the spirit stops fleeing and enters a calm, collectible state.

---

## Changes Implemented

### 1. Post-Success Behavior: Stop Fleeing

**Before**: Rhythm spirits would continue fleeing from the cursor even after successful pattern completion.

**After**: Once `rhythmState.hasCompleted === true`, the spirit:
- ✅ Stops all flee behavior
- ✅ Cursor can approach freely
- ✅ Enters calm idle state with minimal movement
- ✅ Becomes clickable to establish connection

### 2. Two-Phase Movement System

#### Phase 1: Pre-Success (Challenge Phase)

```typescript
// Before pattern completion
if (!rhythmState.hasCompleted) {
  // Flee from cursor if within 20% safe radius
  if (distance < safeRadius) {
    // Apply flee force away from cursor
    newVx += normX * fleeStrength;
    newVy += normY * fleeStrength;
  } else {
    // Normal meditative wandering
    newVx *= 0.95;
    newVy *= 0.95;
  }
}
```

**Characteristics**:
- Spirit plays rhythm pattern (visual pulses)
- Flees when cursor gets within 20% safe radius
- Meditative wandering when cursor is far
- Clicking does nothing (not yet collectible)

#### Phase 2: Post-Success (Reward Phase)

```typescript
// After pattern completion
if (rhythmState.hasCompleted) {
  // Calm idle state - no fleeing
  newVx *= 0.85; // Stronger damping (vs 0.95)
  newVy *= 0.85;

  // Minimal drift (half frequency and strength)
  if (Math.random() < 0.005) { // vs 0.01
    newVx += (Math.random() - 0.5) * 0.15; // vs 0.3
    newVy += (Math.random() - 0.5) * 0.15;
  }
}
```

**Characteristics**:
- Spirit stops fleeing completely
- Very gentle idle movement (almost stationary)
- Victory glow appears (bright pulsing halo)
- Clicking now triggers `onSpiritClick` (collectible)

### 3. Visual State Synchronization

The victory glow is directly tied to `hasCompleted`:

```typescript
{/* Completed state - victory glow */}
{isCompleted && (
  <div
    className="absolute rounded-full animate-pulse"
    style={{
      width: spirit.config.size * 4,
      height: spirit.config.size * 4,
      background: `radial-gradient(circle,
        hsl(${spirit.config.hue}, 90%, 75%, 0.4) 0%,
        hsl(${spirit.config.hue}, 85%, 70%, 0.2) 50%,
        transparent 100%)`,
      boxShadow: `
        0 0 40px hsl(${spirit.config.hue}, 90%, 75%, 0.8),
        0 0 60px hsl(${spirit.config.hue}, 85%, 70%, 0.6),
        inset 0 0 30px hsl(${spirit.config.hue}, 90%, 75%, 0.4)
      `,
    }}
  />
)}
```

**Visual indicators**:
- **Before completion**: Rhythmic pulses during pattern playback, dashed ring during attempt
- **After completion**: Bright victory glow (4x spirit size), pulsing animation
- **Click state**: Glow indicates the spirit is now clickable

### 4. Click Validation (Unchanged, but verified)

The existing click validation already works correctly:

```typescript
const isRhythm = spirit.config.behavior === 'rhythm';
const rhythmCompleted = isRhythm && spirit.rhythmState?.hasCompleted;
const canClick = !isRhythm || rhythmCompleted;

onClick={() => {
  if (canClick) {
    onSpiritClick({ instanceId, configId, config });
  }
}}
```

**Click behavior**:
- ❌ Before completion: Click does nothing
- ✅ After completion: Click triggers `onSpiritClick` and establishes connection

---

## Player Experience Flow

### Step-by-Step Interaction

1. **Encounter** 🎵
   - Rhythm spirit appears on screen
   - Starts playing its pattern (visual pulses)
   - Spirit moves slowly with meditative wandering

2. **Learn** 👀
   - Watch the rhythmic pulses to learn the pattern
   - Pattern repeats automatically (based on `expectedBeats`)
   - Different rarities have different pattern lengths

3. **Attempt** 🖱️
   - Click anywhere in the container to match the rhythm
   - Spirit flees if cursor gets too close (can't hover over it)
   - Dashed ring appears during attempt
   - Incorrect timing resets the attempt (with console feedback)

4. **Success** ✨
   - Match all beats correctly within tolerance
   - Victory glow appears (bright pulsing halo)
   - Spirit stops fleeing and enters calm state
   - Spirit becomes almost stationary (peaceful)

5. **Collect** 🎯
   - Cursor can now freely approach the glowing spirit
   - Click the spirit to establish connection
   - `onSpiritClick` is triggered
   - Connection is counted for badges/progress

---

## Movement Comparison

### Pre-Success Movement
```typescript
// Normal meditative wandering
newVx *= 0.95;  // Gentle damping
newVy *= 0.95;

// Gentle random drift
if (Math.random() < 0.01) {  // 1% chance per frame
  newVx += (Math.random() - 0.5) * 0.3;  // ±0.15 velocity change
  newVy += (Math.random() - 0.5) * 0.3;
}

// Plus flee behavior when cursor is close
```

### Post-Success Movement
```typescript
// Calm idle state
newVx *= 0.85;  // Stronger damping (calmer)
newVy *= 0.85;

// Minimal random drift
if (Math.random() < 0.005) {  // 0.5% chance (half as frequent)
  newVx += (Math.random() - 0.5) * 0.15;  // ±0.075 velocity (half as strong)
  newVy += (Math.random() - 0.5) * 0.15;
}

// No flee behavior - cursor can approach freely
```

**Result**: Post-success spirit moves ~50% less and is much calmer, making it easy to click.

---

## Design Rationale

### Why Two-Phase Behavior?

1. **Clear Challenge-Reward Cycle**
   - Challenge: Match the rhythm while spirit evades cursor
   - Reward: Spirit becomes calm and collectible

2. **Visual Feedback**
   - Flee behavior → Spirit is not ready
   - Victory glow + calm movement → Spirit is ready to collect

3. **Player Agency**
   - Player must complete the rhythm challenge first
   - Only then can they collect the spirit
   - Clear cause-and-effect relationship

4. **Difficulty Scaling**
   - Rarity affects pattern length and timing tolerance
   - But all spirits become equally collectible after success
   - Fair reward for skill-based challenge

### Why Stop Fleeing?

1. **Frustration Prevention**: Chasing a fleeing spirit after already completing a difficult rhythm would be frustrating
2. **Clear State Transition**: Visual and behavioral change signals success
3. **Accessibility**: Players with motor difficulties can take their time to click after success
4. **Consistent with Theme**: Spirit is "at peace" after the rhythm is honored

---

## Technical Details

### File Modified
- `src/components/game/layers/SpiritLayer.tsx`

### Code Section
- Rhythm spirit behavior in animation loop (lines ~585-640)

### Changes
- Added `if (rhythmState.hasCompleted)` check before flee logic
- Implemented post-success calm idle movement
- Adjusted damping and drift parameters for post-success state

### Type Safety
- ✅ No `any` types used
- ✅ All TypeScript checks pass
- ✅ Proper null/undefined handling with optional chaining

### Testing
```
✓ src/lib/genUserName.test.ts (3 tests)
✓ src/test/ErrorBoundary.test.tsx (3 tests)
✓ src/components/NoteContent.test.tsx (5 tests)
✓ src/App.test.tsx (1 test)

Test Files  4 passed (4)
     Tests  12 passed (12)
```

---

## Summary

The Rhythm Spirit now has a clear two-phase interaction model:

**Phase 1 - Challenge**: Match the rhythm pattern while the spirit evades your cursor
**Phase 2 - Reward**: Collect the calm, glowing spirit after successful completion

This creates a satisfying gameplay loop with clear visual and behavioral feedback for each state, making the rhythm mechanic feel polished and intentional.
