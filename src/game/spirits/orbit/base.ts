/**
 * Orbit Spirit Base Configuration
 *
 * Defines the base characteristics for the orbit spirit behavior.
 * Orbit spirits lock onto the mouse cursor and orbit around it in a circular path,
 * alternating between green light (glow) and red light (no glow) phases.
 * Players must move cursor only during green phases to stabilize the orbit.
 */

import { SpiritBaseConfig } from '../types';

export const ORBIT_BASE: SpiritBaseConfig = {
  key: 'orbit',
  displayName: 'Orbit Spirit Base',
  behavior: 'orbit',
  baseSpeed: 1.0,              // Moderate orbit speed
  baseLifetimeMs: 18000,       // 18 seconds base lifetime
  baseSize: 19,                // Medium size, similar to curious
  baseConnectionsRequired: 8,  // Higher connections due to skill requirement
  baseHue: 120,                // Green/yellow-green - orbital, mystical color
};
