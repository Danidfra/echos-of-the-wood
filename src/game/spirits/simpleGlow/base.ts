/**
 * Simple Glow Base Configuration
 * 
 * Defines the base characteristics for the simple-glow spirit behavior.
 * This is the foundation before rarity multipliers and variant offsets are applied.
 */

import { SpiritBaseConfig } from '../types';

export const SIMPLE_GLOW_BASE: SpiritBaseConfig = {
  key: 'simple-glow',
  displayName: 'Simple Glow Base',
  behavior: 'simple-glow',
  baseSpeed: 1.0,
  baseLifetimeMs: 15000,           // 15 seconds base
  baseSize: 20,
  baseConnectionsRequired: 3,
  baseHue: 150,                    // green-ish
};
