/**
 * Shy Spirit Variants
 * 
 * Defines all variants of the shy spirit behavior across different rarities.
 * Shy spirits flee from the cursor when it gets close.
 */

import { SpiritVariantConfig } from '../types';

export const SHY_VARIANTS: SpiritVariantConfig[] = [
  // ============================================================================
  // COMMON VARIANTS - Easy, flees a bit but still catchable
  // ============================================================================
  {
    id: 'shy-common-01',
    baseKey: 'shy',
    displayName: 'Timid Glow',
    rarity: 'common',
    hueOffset: -10,           // slightly greener teal
    sizeMultiplier: 1.05,
    speedMultiplier: 0.9,
  },
  {
    id: 'shy-common-02',
    baseKey: 'shy',
    displayName: 'Faint Mote',
    rarity: 'common',
    hueOffset: +0,
    sizeMultiplier: 1.0,
    speedMultiplier: 0.85,
  },

  // ============================================================================
  // UNCOMMON VARIANTS
  // ============================================================================
  {
    id: 'shy-uncommon-01',
    baseKey: 'shy',
    displayName: 'Hesitant Wisp',
    rarity: 'uncommon',
    hueOffset: +15,          // more cyan
    sizeMultiplier: 0.95,
    speedMultiplier: 1.0,
  },

  // ============================================================================
  // RARE VARIANTS
  // ============================================================================
  {
    id: 'shy-rare-01',
    baseKey: 'shy',
    displayName: 'Retreating Echo',
    rarity: 'rare',
    hueOffset: +40,          // more blue
    sizeMultiplier: 0.9,
    speedMultiplier: 1.15,
  },

  // ============================================================================
  // MYTHIC VARIANTS
  // ============================================================================
  {
    id: 'shy-mythic-01',
    baseKey: 'shy',
    displayName: 'Vanishing Spark',
    rarity: 'mythic',
    hueOffset: +80,          // violet / indigo
    sizeMultiplier: 0.8,
    speedMultiplier: 1.3,
    lifetimeMultiplier: 0.7,
    connectionsOverride: 18,
  },
];
