/**
 * Curious Spirit Base Configuration
 *
 * Defines the base characteristics for the curious spirit behavior.
 * Curious spirits are attracted by gentle, controlled cursor movement.
 * They are scared away by sudden/jittery movement but can be awakened
 * through patient interaction.
 */

import { SpiritBaseConfig } from '../types';

export const CURIOUS_BASE: SpiritBaseConfig = {
  key: 'curious',
  displayName: 'Curious Spirit Base',
  behavior: 'curious',
  baseSpeed: 0.85,             // Slightly slower than shy, needs time for gentle interaction
  baseLifetimeMs: 26000,       // Longer lifetime to allow for awakening + guiding to circle
  baseSize: 18,                // Medium size, same as shy
  baseConnectionsRequired: 5,  // Moderate connections (between simple-glow and hunter)
  baseHue: 290,                // Soft magenta/purple-ish (curious, mystical color)
};
