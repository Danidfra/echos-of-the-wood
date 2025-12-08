/**
 * Rhythm Spirit Variants
 *
 * Defines all variants of the rhythm spirit behavior across different rarities.
 * Rhythm spirits emit rhythmic pulses and require players to match beat patterns.
 *
 * Each rarity has 3 possible rhythm patterns inspired by classical / iconic rhythms.
 */

import { SpiritVariantConfig } from '../types';

/**
 * Rhythm patterns per rarity.
 * Each pattern is an array of intervals in milliseconds between beats.
 *
 * Difficulty is controlled by:
 * - Pattern length (number of beats): common=short, mythic=very long
 * - Timing tolerance: common=forgiving, mythic=strict
 * - Tempo stays roughly the same across rarities (human-playable with mouse)
 *
 * Example: [400, 400, 800] means:
 *   Beat 1 at t=0
 *   Beat 2 at t=400ms
 *   Beat 3 at t=800ms
 *   Beat 4 at t=1600ms
 */
export const RHYTHM_PATTERNS = {
  common: [
    // Pattern 1: Inspired by "Beethoven's 5th" - short-short-short-long (4 beats)
    [500, 500, 500, 900],

    // Pattern 2: Simple steady march - even beats (4 beats)
    [600, 600, 600],

    // Pattern 3: Slow waltz - ONE-two-three (3 beats)
    [700, 500, 500],
  ],

  uncommon: [
    // Pattern 1: Extended "Ode to Joy"-like phrase (9 clicks / 8 intervals)
    // ta ta ta taa | ta ta ta taa
    [520, 520, 520, 800, 520, 520, 520, 800],

    // Pattern 2: March with light syncopation (8 clicks / 7 intervals)
    // strong - weak - strong | strong - weak - strong - strong
    [650, 520, 650, 650, 520, 650, 650],

    // Pattern 3: Moderate waltz phrase (7 clicks / 6 intervals)
    // ONE-two-three | ONE-two-three
    [700, 700, 520, 700, 700, 520],
  ],

  rare: [
    // Pattern 1: Galloping rhythm (horse-trot style) extended (10 clicks / 9 intervals)
    // ta-ta-TAA | ta-ta-TAA | ta-ta-TAA
    [520, 520, 650, 520, 520, 650, 520, 520, 650],

    // Pattern 2: Syncopated 4/4 loop (11 clicks / 10 intervals)
    // strong - weak - strong - weak | strong - weak - strong - weak - strong
    [520, 650, 520, 520, 650, 520, 520, 650, 520, 520],

    // Pattern 3: Beethoven motif + march tail (10 clicks / 9 intervals)
    // short-short-short-long | march-march-march
    [520, 520, 520, 800, 650, 520, 650, 520, 650],
  ],

  mythic: [
    // Pattern 1: Two gallops + Beethoven motif (14 clicks / 13 intervals)
    // (gallop x2) + (short-short-short-long)
    [520, 520, 650, 520, 520, 650, 520, 520, 650, 520, 520, 520, 800],

    // Pattern 2: Long “journey” pattern with occasional long breath (14 clicks / 13 intervals)
    // short/medium alternation with a long accent in the middle
    [520, 650, 520, 650, 520, 650, 800, 520, 650, 520, 650, 520, 650],

    // Pattern 3: Waltz intro + triple gallop chain (16 clicks / 15 intervals)
    // waltz (3/4) then extended gallop sequence
    [700, 700, 520, 700, 700, 520, 520, 520, 650, 520, 520, 650, 520, 520, 650],
  ],
} as const;

/**
 * Timing tolerance windows per rarity (in milliseconds).
 * A click is considered correct if within ± this tolerance.
 */
export const RHYTHM_TOLERANCES = {
  common: 250,      // ±250ms - very forgiving
  uncommon: 180,    // ±180ms - medium difficulty
  rare: 120,        // ±120ms - strict
  mythic: 80,       // ±80ms - very strict, requires precision
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
  // RARE VARIANTS - Complex patterns, more beats (but similar tempo)
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
  // MYTHIC VARIANTS - Long sequences, strict timing, iconic-feeling rhythms
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