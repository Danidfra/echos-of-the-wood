/**
 * Shy Spirit Base Configuration
 * 
 * Defines the base characteristics for the shy spirit behavior.
 * Shy spirits flee from the cursor when it gets close.
 */

import { SpiritBaseConfig } from '../types';

export const SHY_BASE: SpiritBaseConfig = {
  key: 'shy',
  displayName: 'Shy Spirit Base',
  behavior: 'shy',
  baseSpeed: 0.9,              // slightly slower wander by default
  baseLifetimeMs: 18000,       // a bit longer on screen
  baseSize: 18,                // slightly smaller than simple-glow base
  baseConnectionsRequired: 5,  // usually needs more "connections"
  baseHue: 190,                // teal / blue-ish
};
