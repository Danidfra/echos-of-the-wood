/**
 * Rhythm Spirit Variants
 * 
 * Defines all variants of the rhythm spirit behavior across different rarities.
 * Rhythm spirits emit rhythmic pulses and require players to match beat patterns.
 * 
 * Each rarity has 3 possible rhythm patterns inspired by classical music rhythms.
 */

import { SpiritVariantConfig } from '../types';

/**
 * Rhythm patterns per rarity.
 * Each pattern is an array of intervals in milliseconds between beats.
 * 
 * Example: [400, 400, 800] means:
 *   Beat 1 at t=0
 *   Beat 2 at t=400ms
 *   Beat 3 at t=800ms
 *   Beat 4 at t=1600ms
 */
export const RHYTHM_PATTERNS = {
  common: [
    // Pattern 1: Inspired by "Beethoven's 5th" - short-short-short-long
    [300, 300, 300, 900],
    
    // Pattern 2: Simple steady march - even beats
    [500, 500, 500, 500],
    
    // Pattern 3: Slow waltz - ONE-two-three, ONE-two-three
    [600, 400, 400, 600, 400, 400],
  ],
  
  uncommon: [
    // Pattern 1: Inspired by "Ode to Joy" opening - da-da-da-DAH, da-da-da-DAH
    [300, 300, 300, 600, 300, 300, 300, 600],
    
    // Pattern 2: March with syncopation
    [400, 200, 400, 400, 200, 400],
    
    // Pattern 3: Moderate waltz with variation
    [450, 350, 350, 450, 250, 450],
  ],
  
  rare: [
    // Pattern 1: Complex waltz with tempo changes
    [350, 300, 250, 350, 300, 250, 350, 300, 250],
    
    // Pattern 2: Syncopated classical rhythm
    [250, 250, 500, 250, 250, 500, 250, 250],
    
    // Pattern 3: Galloping rhythm (horse trot)
    [200, 200, 400, 200, 200, 400, 200, 200, 400],
  ],
  
  mythic: [
    // Pattern 1: Inspired by "Flight of the Bumblebee" - rapid succession
    [150, 150, 150, 150, 150, 150, 300, 150, 150, 150, 150, 150, 150],
    
    // Pattern 2: Complex syncopation with speed changes
    [120, 120, 240, 120, 120, 180, 120, 120, 240, 120, 120],
    
    // Pattern 3: Virtuoso pattern - very fast with irregular spacing
    [100, 100, 100, 200, 100, 100, 100, 150, 100, 100, 100, 200],
  ],
} as const;

/**
 * Timing tolerance windows per rarity (in milliseconds).
 * A click is considered correct if within ± this tolerance.
 */
export const RHYTHM_TOLERANCES = {
  common: 220,      // ±220ms - very forgiving
  uncommon: 160,    // ±160ms - medium difficulty
  rare: 110,        // ±110ms - strict
  mythic: 70,       // ±70ms - very strict, requires precision
} as const;

export const RHYTHM_VARIANTS: SpiritVariantConfig[] = [
  // ============================================================================
  // COMMON VARIANTS - Easy patterns, slow tempo, forgiving timing
  // ============================================================================
  {
    id: 'rhythm-common-01',
    baseKey: 'rhythm',
    displayName: 'Gentle Pulse',
    rarity: 'common',
    hueOffset: -15,           // More blue-green
    sizeMultiplier: 1.1,
    speedMultiplier: 0.9,
  },
  {
    id: 'rhythm-common-02',
    baseKey: 'rhythm',
    displayName: 'Steady Beat',
    rarity: 'common',
    hueOffset: +10,
    sizeMultiplier: 1.05,
    speedMultiplier: 0.85,
  },

  // ============================================================================
  // UNCOMMON VARIANTS - Medium difficulty
  // ============================================================================
  {
    id: 'rhythm-uncommon-01',
    baseKey: 'rhythm',
    displayName: 'Flowing Cadence',
    rarity: 'uncommon',
    hueOffset: +20,          // More cyan
    sizeMultiplier: 1.0,
    speedMultiplier: 0.95,
  },
  {
    id: 'rhythm-uncommon-02',
    baseKey: 'rhythm',
    displayName: 'Harmonic Wave',
    rarity: 'uncommon',
    hueOffset: -25,          // More teal
    sizeMultiplier: 0.98,
    speedMultiplier: 1.0,
  },

  // ============================================================================
  // RARE VARIANTS - Complex patterns, faster tempo
  // ============================================================================
  {
    id: 'rhythm-rare-01',
    baseKey: 'rhythm',
    displayName: 'Syncopated Echo',
    rarity: 'rare',
    hueOffset: +35,          // Bright cyan
    sizeMultiplier: 0.92,
    speedMultiplier: 1.1,
  },
  {
    id: 'rhythm-rare-02',
    baseKey: 'rhythm',
    displayName: 'Tempo Shifter',
    rarity: 'rare',
    hueOffset: +45,
    sizeMultiplier: 0.9,
    speedMultiplier: 1.15,
  },

  // ============================================================================
  // MYTHIC VARIANTS - Very fast, long sequences, strict timing
  // ============================================================================
  {
    id: 'rhythm-mythic-01',
    baseKey: 'rhythm',
    displayName: 'Virtuoso Spark',
    rarity: 'mythic',
    hueOffset: +55,          // Electric cyan
    sizeMultiplier: 0.85,
    speedMultiplier: 1.25,
    connectionsOverride: 20,
  },
  {
    id: 'rhythm-mythic-02',
    baseKey: 'rhythm',
    displayName: 'Maestro\'s Whisper',
    rarity: 'mythic',
    hueOffset: -40,          // Deep teal
    sizeMultiplier: 0.8,
    speedMultiplier: 1.3,
    connectionsOverride: 22,
  },
];
