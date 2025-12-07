/**
 * Spirit Rarity Definitions
 * 
 * Defines the rarity tiers and their multipliers.
 * Higher rarities are more challenging (faster, smaller, shorter lifetime, more connections needed).
 */

import { RarityDefinition } from './types';

export const RARITIES: Record<'common' | 'uncommon' | 'rare' | 'mythic', RarityDefinition> = {
  common: {
    id: 'common',
    label: 'Common',
    speedMultiplier: 0.8,        // Slower
    lifetimeMultiplier: 1.2,     // Longer lifetime
    hitboxMultiplier: 1.2,       // Bigger (easier to click)
    connectionsMultiplier: 0.5,  // Fewer connections needed
    spawnWeight: 60,             // Most common
  },
  uncommon: {
    id: 'uncommon',
    label: 'Uncommon',
    speedMultiplier: 1.0,        // Normal speed
    lifetimeMultiplier: 1.0,     // Normal lifetime
    hitboxMultiplier: 1.0,       // Normal size
    connectionsMultiplier: 1.0,  // Normal connections
    spawnWeight: 25,
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    speedMultiplier: 1.3,        // Faster
    lifetimeMultiplier: 0.8,     // Shorter lifetime
    hitboxMultiplier: 0.85,      // Smaller (harder to click)
    connectionsMultiplier: 2.0,  // More connections needed
    spawnWeight: 10,
  },
  mythic: {
    id: 'mythic',
    label: 'Mythic',
    speedMultiplier: 1.6,        // Much faster
    lifetimeMultiplier: 0.6,     // Much shorter lifetime
    hitboxMultiplier: 0.75,      // Much smaller (hardest to click)
    connectionsMultiplier: 3.0,  // Many more connections needed
    spawnWeight: 5,              // Rarest
  },
};
