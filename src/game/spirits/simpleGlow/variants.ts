/**
 * Simple Glow Variants
 * 
 * Defines all variants of the simple-glow spirit behavior across different rarities.
 * Each variant combines the base config with rarity multipliers and optional fine-tuning.
 */

import { SpiritVariantConfig } from '../types';

export const SIMPLE_GLOW_VARIANTS: SpiritVariantConfig[] = [
  // ============================================================================
  // COMMON VARIANTS - Easy to catch, slow, big, long lifetime
  // ============================================================================
  {
    id: 'simple-common-01',
    baseKey: 'simple-glow',
    displayName: 'Gentle Glow',
    rarity: 'common',
    hueOffset: -10,              // Slightly more green
    sizeMultiplier: 1.1,         // Slightly bigger
    speedMultiplier: 0.9,        // Even slower
  },
  {
    id: 'simple-common-02',
    baseKey: 'simple-glow',
    displayName: 'Soft Mote',
    rarity: 'common',
    hueOffset: +5,               // Slightly more teal
    sizeMultiplier: 1.0,
    speedMultiplier: 0.8,        // Slowest
  },
  {
    id: 'simple-common-03',
    baseKey: 'simple-glow',
    displayName: 'Peaceful Wisp',
    rarity: 'common',
    hueOffset: -5,
    sizeMultiplier: 1.05,
    speedMultiplier: 0.85,
  },

  // ============================================================================
  // UNCOMMON VARIANTS - Balanced, medium difficulty
  // ============================================================================
  {
    id: 'simple-uncommon-01',
    baseKey: 'simple-glow',
    displayName: 'Teal Wanderer',
    rarity: 'uncommon',
    hueOffset: +15,              // Teal
    sizeMultiplier: 1.0,
    speedMultiplier: 1.0,
  },
  {
    id: 'simple-uncommon-02',
    baseKey: 'simple-glow',
    displayName: 'Dusklight',
    rarity: 'uncommon',
    hueOffset: +25,              // Cyan
    sizeMultiplier: 0.95,
    speedMultiplier: 1.1,
  },

  // ============================================================================
  // RARE VARIANTS - Challenging, fast, small, shorter lifetime
  // ============================================================================
  {
    id: 'simple-rare-01',
    baseKey: 'simple-glow',
    displayName: 'Azure Wisp',
    rarity: 'rare',
    hueOffset: +60,              // Blue
    sizeMultiplier: 0.9,
    speedMultiplier: 1.2,
  },
  {
    id: 'simple-rare-02',
    baseKey: 'simple-glow',
    displayName: 'Violet Flicker',
    rarity: 'rare',
    hueOffset: +90,              // Purple
    sizeMultiplier: 0.85,
    speedMultiplier: 1.3,
  },

  // ============================================================================
  // MYTHIC VARIANTS - Very challenging, fastest, smallest, very short lifetime
  // ============================================================================
  {
    id: 'simple-mythic-01',
    baseKey: 'simple-glow',
    displayName: 'Mythic Echo',
    rarity: 'mythic',
    hueOffset: +140,             // Ethereal pink/magenta
    sizeMultiplier: 0.8,
    speedMultiplier: 1.4,
    lifetimeMultiplier: 0.7,
    connectionsOverride: 25,     // Needs many connections later
  },
  {
    id: 'simple-mythic-02',
    baseKey: 'simple-glow',
    displayName: 'Celestial Spark',
    rarity: 'mythic',
    hueOffset: +200,             // Gold/yellow
    sizeMultiplier: 0.75,
    speedMultiplier: 1.5,
    lifetimeMultiplier: 0.8,
    connectionsOverride: 20,
  },
];
