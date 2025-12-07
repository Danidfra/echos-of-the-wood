# Spirit System Documentation

## Overview

The spirit system is a scalable, data-driven architecture for managing different spirit behaviors, rarities, and variants in Echoes of the Wood. This document describes the complete system architecture and how to extend it.

## Folder Structure

```
src/game/spirits/
├── types.ts                    # Core type definitions
├── rarities.ts                 # Rarity definitions with multipliers
├── registry.ts                 # Central registry and resolver
└── simpleGlow/
    ├── base.ts                 # Base config for simple-glow behavior
    └── variants.ts             # All simple-glow variants
```

## Core Types

### SpiritBehaviorType

```typescript
type SpiritBehaviorType =
  | 'simple-glow'
  // Future: 'shy', 'hunter', 'curious', 'rhythm', 'echo', 'orbit', 'pattern'
  ;
```

### SpiritRarity

```typescript
type SpiritRarity = 'common' | 'uncommon' | 'rare' | 'mythic';
```

### SpiritBaseConfig

Defines the fundamental characteristics of a behavior type before multipliers:

```typescript
interface SpiritBaseConfig {
  key: string;                   // e.g. 'simple-glow'
  displayName: string;           // e.g. 'Simple Glow Base'
  behavior: SpiritBehaviorType;
  baseSpeed: number;             // base movement speed
  baseLifetimeMs: number;        // base on-screen lifetime
  baseSize: number;              // base visual/hitbox size in px
  baseConnectionsRequired: number;
  baseHue: number;               // base HSL hue for color
}
```

### RarityDefinition

Defines multipliers for each rarity tier:

```typescript
interface RarityDefinition {
  id: SpiritRarity;
  label: string;                 // 'Common', 'Uncommon', etc.
  speedMultiplier: number;
  lifetimeMultiplier: number;
  hitboxMultiplier: number;
  connectionsMultiplier: number;
  spawnWeight: number;           // for natural spawn probabilities
}
```

### SpiritVariantConfig

Defines a specific spirit variant with optional fine-tuning:

```typescript
interface SpiritVariantConfig {
  id: string;                    // unique, e.g. 'simple-common-01'
  baseKey: string;               // 'simple-glow'
  displayName: string;           // human name, e.g. 'Gentle Glow'
  rarity: SpiritRarity;
  
  // Optional fine-tuning on top of base + rarity multipliers:
  hueOffset?: number;            // e.g. +20 or -15 on HSL hue
  sizeMultiplier?: number;       // e.g. 0.9, 1.1
  speedMultiplier?: number;
  lifetimeMultiplier?: number;
  connectionsOverride?: number;  // if set, overrides computed value
}
```

### ResolvedSpiritConfig

Final runtime config with all multipliers applied:

```typescript
interface ResolvedSpiritConfig {
  id: string;
  displayName: string;
  baseKey: string;
  behavior: SpiritBehaviorType;
  rarity: SpiritRarity;
  size: number;                  // final px
  speed: number;                 // final speed scalar
  lifetimeMs: number;            // final lifetime
  connectionsRequired: number;   // final required connections
  hue: number;                   // final hue in HSL
}
```

## Rarity System

The rarity system uses multipliers to make higher rarities more challenging:

| Rarity | Speed | Lifetime | Hitbox | Connections | Spawn Weight |
|--------|-------|----------|--------|-------------|--------------|
| Common | 0.8x | 1.2x | 1.2x | 0.5x | 60 |
| Uncommon | 1.0x | 1.0x | 1.0x | 1.0x | 25 |
| Rare | 1.3x | 0.8x | 0.85x | 2.0x | 10 |
| Mythic | 1.6x | 0.6x | 0.75x | 3.0x | 5 |

**Design Philosophy:**
- **Common**: Slow, long lifetime, big hitbox, few connections → Easy to catch
- **Mythic**: Fast, short lifetime, small hitbox, many connections → Very challenging

## Simple-Glow Behavior

### Base Configuration

```typescript
{
  key: 'simple-glow',
  displayName: 'Simple Glow Base',
  behavior: 'simple-glow',
  baseSpeed: 1.0,
  baseLifetimeMs: 15000,           // 15 seconds
  baseSize: 20,
  baseConnectionsRequired: 3,
  baseHue: 150,                    // green-ish
}
```

### Variants

#### Common (3 variants)
- **Gentle Glow**: Slightly more green, bigger, even slower
- **Soft Mote**: Slightly teal, slowest
- **Peaceful Wisp**: Balanced common variant

#### Uncommon (2 variants)
- **Teal Wanderer**: Teal color, balanced stats
- **Dusklight**: Cyan color, slightly faster

#### Rare (2 variants)
- **Azure Wisp**: Blue, fast, smaller
- **Violet Flicker**: Purple, fastest rare, smallest

#### Mythic (2 variants)
- **Mythic Echo**: Ethereal pink/magenta, very challenging, 25 connections
- **Celestial Spark**: Gold/yellow, extremely fast, 20 connections

## Resolution Process

The registry resolves variants through this calculation:

```typescript
size = base.baseSize 
  * rarity.hitboxMultiplier 
  * (variant.sizeMultiplier ?? 1)

speed = base.baseSpeed 
  * rarity.speedMultiplier 
  * (variant.speedMultiplier ?? 1)

lifetimeMs = base.baseLifetimeMs 
  * rarity.lifetimeMultiplier 
  * (variant.lifetimeMultiplier ?? 1)

connectionsRequired = variant.connectionsOverride 
  ?? Math.round(base.baseConnectionsRequired * rarity.connectionsMultiplier)

hue = base.baseHue + (variant.hueOffset ?? 0)
```

## Registry API

### ALL_RESOLVED_SPIRITS

Array of all resolved spirit configs, ready for runtime use.

### getSpiritById(id: string)

Get a specific spirit config by its unique ID.

```typescript
const spirit = getSpiritById('simple-common-01');
```

### getSpiritsByBehaviorAndRarity(behavior, rarity?)

Filter spirits by behavior type and optionally by rarity.

```typescript
// All simple-glow spirits
const all = getSpiritsByBehaviorAndRarity('simple-glow');

// Only rare simple-glow spirits
const rareSpirits = getSpiritsByBehaviorAndRarity('simple-glow', 'rare');

// All simple-glow spirits (explicit)
const allExplicit = getSpiritsByBehaviorAndRarity('simple-glow', 'all');
```

### getRandomSpirit(spirits)

Get a random spirit from a list using rarity weights.

```typescript
const spirits = getSpiritsByBehaviorAndRarity('simple-glow');
const randomSpirit = getRandomSpirit(spirits);
```

### getRandomSpiritsForInitialSpawn(behavior, count)

Get multiple random spirits for initial spawn using weighted random.

```typescript
const initialSpirits = getRandomSpiritsForInitialSpawn('simple-glow', 3);
```

## SpiritLayer Integration

### ActiveSpirit Interface

Runtime spirit instance:

```typescript
interface ActiveSpirit {
  instanceId: string;         // unique per instance
  configId: string;           // ResolvedSpiritConfig.id
  config: ResolvedSpiritConfig;
  x: number;                  // in %
  y: number;                  // in %
  vx: number;
  vy: number;
  expiresAt: number;          // timestamp (performance.now + lifetimeMs)
}
```

### SpiritLayerHandle

Exposed API for debug spawning:

```typescript
interface SpiritLayerHandle {
  spawnById: (spiritId: string) => void;
}
```

### Usage

```typescript
const spiritLayerRef = useRef<SpiritLayerHandle>(null);

// Spawn a specific spirit
spiritLayerRef.current?.spawnById('simple-mythic-01');
```

## Spirits Debug UI

### Location

Click the **Sparkles** button in the top-right corner of the scene (next to Scene button).

### Features

1. **Behavior Filter**: Select spirit behavior type (currently only simple-glow)
2. **Rarity Filter**: Filter by rarity or show all
3. **Spirit List**: Scrollable list showing:
   - Display name
   - Rarity badge (color-coded by hue)
   - Spirit ID
   - Speed multiplier
   - Size in pixels
   - Lifetime in seconds
   - Connections required
4. **Spawn Button**: Click to spawn that specific variant

### Data-Driven Design

The debug UI is fully data-driven. When you add new variants to `SIMPLE_GLOW_VARIANTS`, they automatically appear in the debug modal with no additional code changes.

## Adding New Variants

To add a new simple-glow variant:

1. Open `src/game/spirits/simpleGlow/variants.ts`
2. Add a new entry to the `SIMPLE_GLOW_VARIANTS` array:

```typescript
{
  id: 'simple-rare-03',
  baseKey: 'simple-glow',
  displayName: 'Crimson Spark',
  rarity: 'rare',
  hueOffset: +30,              // Reddish
  sizeMultiplier: 0.9,
  speedMultiplier: 1.25,
}
```

3. The variant will automatically:
   - Be resolved into a `ResolvedSpiritConfig`
   - Appear in `ALL_RESOLVED_SPIRITS`
   - Show up in the debug UI
   - Be available for spawning

## Adding New Behaviors

To add a new behavior type (e.g., 'shy'):

1. **Update types** (`src/game/spirits/types.ts`):
   ```typescript
   export type SpiritBehaviorType =
     | 'simple-glow'
     | 'shy'  // NEW
     ;
   ```

2. **Create base config** (`src/game/spirits/shy/base.ts`):
   ```typescript
   export const SHY_BASE: SpiritBaseConfig = {
     key: 'shy',
     displayName: 'Shy Spirit Base',
     behavior: 'shy',
     baseSpeed: 0.8,
     baseLifetimeMs: 20000,
     baseSize: 18,
     baseConnectionsRequired: 5,
     baseHue: 280,  // purple
   };
   ```

3. **Create variants** (`src/game/spirits/shy/variants.ts`):
   ```typescript
   export const SHY_VARIANTS: SpiritVariantConfig[] = [
     {
       id: 'shy-common-01',
       baseKey: 'shy',
       displayName: 'Timid Glow',
       rarity: 'common',
       // ...
     },
     // ... more variants
   ];
   ```

4. **Register in registry** (`src/game/spirits/registry.ts`):
   ```typescript
   import { SHY_BASE } from './shy/base';
   import { SHY_VARIANTS } from './shy/variants';
   
   const BASES: Record<string, SpiritBaseConfig> = {
     'simple-glow': SIMPLE_GLOW_BASE,
     'shy': SHY_BASE,  // NEW
   };
   
   export const ALL_RESOLVED_SPIRITS: ResolvedSpiritConfig[] = [
     ...SIMPLE_GLOW_VARIANTS.map(resolveSpiritVariant),
     ...SHY_VARIANTS.map(resolveSpiritVariant),  // NEW
   ];
   ```

5. **Update debug UI** (`src/components/game/SceneViewport.tsx`):
   ```typescript
   <select value={selectedBehavior} onChange={...}>
     <option value="simple-glow">Simple Glow</option>
     <option value="shy">Shy</option>  {/* NEW */}
   </select>
   ```

6. **Implement behavior logic** (optional):
   - Create `src/game/spirits/shy/behavior.ts` if the behavior needs custom movement logic
   - Update `SpiritLayer` animation loop to handle different behaviors

## Best Practices

1. **Rarity Progression**: Ensure variants follow the rarity difficulty curve
2. **Hue Consistency**: Keep hue offsets logical for visual variety
3. **Naming Convention**: Use descriptive, thematic names for variants
4. **ID Format**: Use `{behavior}-{rarity}-{number}` format for IDs
5. **Multiplier Balance**: Test multipliers to ensure variants feel distinct but fair
6. **Documentation**: Update this doc when adding new behaviors

## Future Enhancements

- Natural spawning system using spawn weights
- Behavior-specific movement patterns (shy runs away, hunter chases, etc.)
- Seasonal variants (autumn colors, winter frost, etc.)
- Achievement tracking for catching rare spirits
- Collection/Pokédex system
- Spirit evolution/transformation mechanics
