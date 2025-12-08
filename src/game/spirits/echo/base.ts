/**
 * Echo Spirit Base Configuration
 *
 * Defines the base characteristics for the echo spirit behavior.
 * Echo spirits spawn with multiple fake copies - only one is real.
 * Clicking a fake echo removes it; clicking the real one completes the connection.
 */

import { SpiritBaseConfig } from '../types';

export const ECHO_BASE: SpiritBaseConfig = {
  key: 'echo',
  displayName: 'Echo Spirit Base',
  behavior: 'echo',
  baseSpeed: 1.0,              // Normal wandering speed
  baseLifetimeMs: 16000,       // 16 seconds base lifetime
  baseSize: 17,                // Medium size, between shy and hunter
  baseConnectionsRequired: 6,  // Moderate connections (similar to hunter)
  baseHue: 250,                // Purple/violet - mysterious, illusory color
};
