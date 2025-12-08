/**
 * Echo Spirit Variants
 *
 * Defines all variants of the echo spirit behavior across different rarities.
 * Echo spirits spawn with multiple fake copies - only one is real.
 * Higher rarity = more echoes to confuse the player.
 */

import { SpiritVariantConfig } from '../types';

export const ECHO_VARIANTS: SpiritVariantConfig[] = [
  // ============================================================================
  // COMMON VARIANTS - 3 total echoes (including real one)
  // ============================================================================
  {
    id: 'echo-common-01',
    baseKey: 'echo',
    displayName: 'Faint Echo',
    rarity: 'common',
    hueOffset: -15,           // More blue-purple
    sizeMultiplier: 1.05,
    speedMultiplier: 0.95,
  },
  {
    id: 'echo-common-02',
    baseKey: 'echo',
    displayName: 'Whisper Twin',
    rarity: 'common',
    hueOffset: +0,
    sizeMultiplier: 1.0,
    speedMultiplier: 0.9,
  },

  // ============================================================================
  // UNCOMMON VARIANTS - 4 total echoes
  // ============================================================================
  {
    id: 'echo-uncommon-01',
    baseKey: 'echo',
    displayName: 'Mirror Shade',
    rarity: 'uncommon',
    hueOffset: +10,           // Slightly more magenta
    sizeMultiplier: 0.98,
    speedMultiplier: 1.0,
  },
  {
    id: 'echo-uncommon-02',
    baseKey: 'echo',
    displayName: 'Phantom Double',
    rarity: 'uncommon',
    hueOffset: -5,
    sizeMultiplier: 1.02,
    speedMultiplier: 1.05,
  },

  // ============================================================================
  // RARE VARIANTS - 6 total echoes
  // ============================================================================
  {
    id: 'echo-rare-01',
    baseKey: 'echo',
    displayName: 'Illusory Chorus',
    rarity: 'rare',
    hueOffset: +25,           // More vibrant magenta
    sizeMultiplier: 0.92,
    speedMultiplier: 0.86,     // Reduced by ~25% from 1.15
  },
  {
    id: 'echo-rare-02',
    baseKey: 'echo',
    displayName: 'Refracted Spirit',
    rarity: 'rare',
    hueOffset: +35,
    sizeMultiplier: 0.95,
    speedMultiplier: 0.83,     // Reduced by ~25% from 1.1
  },

  // ============================================================================
  // MYTHIC VARIANTS - 8 total echoes
  // ============================================================================
  {
    id: 'echo-mythic-01',
    baseKey: 'echo',
    displayName: 'Prismatic Mirage',
    rarity: 'mythic',
    hueOffset: +60,           // Bright pink/magenta
    sizeMultiplier: 0.85,
    speedMultiplier: 0.85,     // Reduced by ~35% from 1.3
    lifetimeMultiplier: 0.8,
    connectionsOverride: 15,
  },
  {
    id: 'echo-mythic-02',
    baseKey: 'echo',
    displayName: 'Kaleidoscope Phantom',
    rarity: 'mythic',
    hueOffset: +70,
    sizeMultiplier: 0.88,
    speedMultiplier: 0.81,     // Reduced by ~35% from 1.25
    lifetimeMultiplier: 0.85,
    connectionsOverride: 14,
  },
];
