/**
 * Hunter Spirit Base Configuration
 * 
 * Hunter spirits chase the cursor aggressively when it's in range.
 */

import { SpiritBaseConfig } from '../types';

export const HUNTER_BASE: SpiritBaseConfig = {
  key: 'hunter',
  displayName: 'Hunter Spirit Base',
  behavior: 'hunter',
  baseSpeed: 1.4,              // faster than simple-glow and shy
  baseLifetimeMs: 12000,       // shorter lifetime (they appear, hunt, vanish)
  baseSize: 16,                // smaller than simple-glow
  baseConnectionsRequired: 6,  // harder to fully "attune"
  baseHue: 25,                 // warm orange / ember-ish
};
