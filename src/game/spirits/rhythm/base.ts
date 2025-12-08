/**
 * Rhythm Spirit Base Configuration
 *
 * Defines the base characteristics for the rhythm spirit behavior.
 * Rhythm spirits emit rhythmic pulses and require the player to match
 * their beat patterns by clicking in sync with the rhythm.
 */

import { SpiritBaseConfig } from '../types';

export const RHYTHM_BASE: SpiritBaseConfig = {
  key: 'rhythm',
  displayName: 'Rhythm Spirit Base',
  behavior: 'rhythm',
  baseSpeed: 0.6,              // Slow, meditative movement - spirit is focused on rhythm
  baseLifetimeMs: 20000,       // Base 20 seconds - will be scaled UP by rarity (inverted)
  baseSize: 20,                // Medium-large size for visibility during rhythm matching
  baseConnectionsRequired: 7,  // Higher than most - rhythm matching is skill-based
  baseHue: 180,                // Cyan/turquoise - musical, rhythmic color
};
