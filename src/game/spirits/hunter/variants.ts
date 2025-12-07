/**
 * Hunter Spirit Variants
 *
 * Defines all variants of the hunter spirit behavior across different rarities.
 * Hunters are attracted to the cursor and will chase it.
 */

import { SpiritVariantConfig } from '../types';

export const HUNTER_VARIANTS: SpiritVariantConfig[] = [
  // ============================================================================
  // COMMON VARIANTS - approachable, slower hunters
  // ============================================================================
  {
    id: 'hunter-common-01',
    baseKey: 'hunter',
    displayName: 'Ember Stalker',
    rarity: 'common',
    hueOffset: -5,            // slightly more red/orange
    sizeMultiplier: 1.05,
    speedMultiplier: 0.9,
  },
  {
    id: 'hunter-common-02',
    baseKey: 'hunter',
    displayName: 'Curious Flame',
    rarity: 'common',
    hueOffset: +10,
    sizeMultiplier: 1.0,
    speedMultiplier: 0.85,
  },

  // ============================================================================
  // UNCOMMON VARIANTS
  // ============================================================================
  {
    id: 'hunter-uncommon-01',
    baseKey: 'hunter',
    displayName: 'Swift Ember',
    rarity: 'uncommon',
    hueOffset: +20,
    sizeMultiplier: 0.95,
    speedMultiplier: 1.0,
  },

  // ============================================================================
  // RARE VARIANTS
  // ============================================================================
  {
    id: 'hunter-rare-01',
    baseKey: 'hunter',
    displayName: 'Blazing Pursuer',
    rarity: 'rare',
    hueOffset: +35,
    sizeMultiplier: 0.9,
    speedMultiplier: 1.2,
  },

  // ============================================================================
  // MYTHIC VARIANTS
  // ============================================================================
  {
    id: 'hunter-mythic-01',
    baseKey: 'hunter',
    displayName: 'Relentless Flame',
    rarity: 'mythic',
    hueOffset: +60,
    sizeMultiplier: 0.8,
    speedMultiplier: 1.35,
    connectionsOverride: 18,
  },
];
