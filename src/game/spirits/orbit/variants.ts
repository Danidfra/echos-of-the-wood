/**
 * Orbit Spirit Variants
 *
 * Defines all variants of the orbit spirit behavior across different rarities.
 * Orbit spirits lock onto cursor and alternate between green/red light phases.
 * Players must move cursor only during green phases to stabilize orbit.
 */

import { SpiritVariantConfig } from '../types';

export const ORBIT_VARIANTS: SpiritVariantConfig[] = [
  // ============================================================================
  // COMMON VARIANTS - Slower orbit, easy to stabilize
  // ============================================================================
  {
    id: 'orbit-common-01',
    baseKey: 'orbit',
    displayName: 'Stable Orbit',
    rarity: 'common',
    hueOffset: -10,           // More yellow-green
    sizeMultiplier: 1.05,
    speedMultiplier: 0.9,      // Slower orbit for beginners
  },
  {
    id: 'orbit-common-02',
    baseKey: 'orbit',
    displayName: 'Gentle Circle',
    rarity: 'common',
    hueOffset: +5,
    sizeMultiplier: 1.0,
    speedMultiplier: 0.85,
  },

  // ============================================================================
  // UNCOMMON VARIANTS - Moderate speed and stability requirements
  // ============================================================================
  {
    id: 'orbit-uncommon-01',
    baseKey: 'orbit',
    displayName: 'Wandering Ring',
    rarity: 'uncommon',
    hueOffset: +15,           // More pure green
    sizeMultiplier: 0.98,
    speedMultiplier: 0.95,
  },
  {
    id: 'orbit-uncommon-02',
    baseKey: 'orbit',
    displayName: 'Circular Dance',
    rarity: 'uncommon',
    hueOffset: +20,
    sizeMultiplier: 1.02,
    speedMultiplier: 1.0,
  },

  // ============================================================================
  // RARE VARIANTS - Faster orbit, tighter stability needed
  // ============================================================================
  {
    id: 'orbit-rare-01',
    baseKey: 'orbit',
    displayName: 'Swift Orbit',
    rarity: 'rare',
    hueOffset: +30,           // Green-cyan blend
    sizeMultiplier: 0.92,
    speedMultiplier: 1.1,
  },
  {
    id: 'orbit-rare-02',
    baseKey: 'orbit',
    displayName: 'Rapid Circle',
    rarity: 'rare',
    hueOffset: +35,
    sizeMultiplier: 0.95,
    speedMultiplier: 1.15,
  },

  // ============================================================================
  // MYTHIC VARIANTS - Fast orbit, challenging stability requirements
  // ============================================================================
  {
    id: 'orbit-mythic-01',
    baseKey: 'orbit',
    displayName: 'Cosmic Ring',
    rarity: 'mythic',
    hueOffset: +45,           // Green-cyan with mystical touch
    sizeMultiplier: 0.88,
    speedMultiplier: 1.2,
    lifetimeMultiplier: 0.9,
    connectionsOverride: 12,
  },
  {
    id: 'orbit-mythic-02',
    baseKey: 'orbit',
    displayName: 'Eternal Orbit',
    rarity: 'mythic',
    hueOffset: +50,
    sizeMultiplier: 0.85,
    speedMultiplier: 1.25,
    lifetimeMultiplier: 0.85,
    connectionsOverride: 11,
  },
];
