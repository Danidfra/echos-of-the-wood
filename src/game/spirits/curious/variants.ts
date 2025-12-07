/**
 * Curious Spirit Variants
 * 
 * Defines all variants of the curious spirit behavior across different rarities.
 * Curious spirits are attracted by gentle, controlled cursor movement and scared by sudden movement.
 */

import { SpiritVariantConfig } from '../types';

export const CURIOUS_VARIANTS: SpiritVariantConfig[] = [
  // ============================================================================
  // COMMON VARIANTS - Forgiving, easier to awaken curiosity
  // ============================================================================
  {
    id: 'curious-common-01',
    baseKey: 'curious',
    displayName: 'Wandering Spark',
    rarity: 'common',
    hueOffset: -10,           // Lighter pink/magenta
    sizeMultiplier: 1.05,
    speedMultiplier: 0.9,
  },
  {
    id: 'curious-common-02',
    baseKey: 'curious',
    displayName: 'Gentle Glimmer',
    rarity: 'common',
    hueOffset: +5,
    sizeMultiplier: 1.0,
    speedMultiplier: 0.85,
  },

  // ============================================================================
  // UNCOMMON VARIANTS
  // ============================================================================
  {
    id: 'curious-uncommon-01',
    baseKey: 'curious',
    displayName: 'Inquisitive Mote',
    rarity: 'uncommon',
    hueOffset: +15,          // More purple
    sizeMultiplier: 0.95,
    speedMultiplier: 1.0,
  },
  {
    id: 'curious-uncommon-02',
    baseKey: 'curious',
    displayName: 'Seeking Wisp',
    rarity: 'uncommon',
    hueOffset: -20,          // More pink
    sizeMultiplier: 1.0,
    speedMultiplier: 0.95,
  },

  // ============================================================================
  // RARE VARIANTS
  // ============================================================================
  {
    id: 'curious-rare-01',
    baseKey: 'curious',
    displayName: 'Enigmatic Glow',
    rarity: 'rare',
    hueOffset: +30,          // Deep violet
    sizeMultiplier: 0.9,
    speedMultiplier: 1.15,
  },
  {
    id: 'curious-rare-02',
    baseKey: 'curious',
    displayName: 'Mystic Flicker',
    rarity: 'rare',
    hueOffset: +40,
    sizeMultiplier: 0.88,
    speedMultiplier: 1.2,
  },

  // ============================================================================
  // MYTHIC VARIANTS
  // ============================================================================
  {
    id: 'curious-mythic-01',
    baseKey: 'curious',
    displayName: 'Hypnotic Wonder',
    rarity: 'mythic',
    hueOffset: +50,          // Rich deep violet/indigo
    sizeMultiplier: 0.8,
    speedMultiplier: 1.25,
    lifetimeMultiplier: 1.3, // Longer session time for interaction
    connectionsOverride: 16,
  },
  {
    id: 'curious-mythic-02',
    baseKey: 'curious',
    displayName: 'Arcane Whisper',
    rarity: 'mythic',
    hueOffset: -30,          // Bright magenta/pink
    sizeMultiplier: 0.75,
    speedMultiplier: 1.3,
    lifetimeMultiplier: 1.2,
    connectionsOverride: 18,
  },
];
