/**
 * Spirit System Types
 * 
 * Defines the core type system for spirits including behaviors, rarities,
 * and configuration structures.
 */

export type SpiritRarity = 'common' | 'uncommon' | 'rare' | 'mythic';

export type SpiritBehaviorType =
  | 'simple-glow'
  // Future behaviors:
  // | 'shy'
  // | 'hunter'
  // | 'curious'
  // | 'rhythm'
  // | 'echo'
  // | 'orbit'
  // | 'pattern'
  ;

/**
 * Base configuration for a spirit behavior type.
 * Defines the fundamental characteristics before rarity multipliers.
 */
export interface SpiritBaseConfig {
  key: string;                   // e.g. 'simple-glow'
  displayName: string;           // e.g. 'Simple Glow Base'
  behavior: SpiritBehaviorType;

  baseSpeed: number;             // base movement speed
  baseLifetimeMs: number;        // base on-screen lifetime
  baseSize: number;              // base visual/hitbox size in px
  baseConnectionsRequired: number;
  baseHue: number;               // base HSL hue for color
}

/**
 * Rarity definition with multipliers.
 * Higher rarities are harder to catch (faster, smaller, shorter lifetime, more connections).
 */
export interface RarityDefinition {
  id: SpiritRarity;
  label: string;                 // 'Common', 'Uncommon', etc.
  speedMultiplier: number;
  lifetimeMultiplier: number;
  hitboxMultiplier: number;
  connectionsMultiplier: number;
  spawnWeight: number;           // used for natural spawn probabilities
}

/**
 * Variant configuration for a specific spirit.
 * Combines a base config with rarity and optional fine-tuning.
 */
export interface SpiritVariantConfig {
  id: string;                    // unique, e.g. 'simple-common-01'
  baseKey: string;               // 'simple-glow'
  displayName: string;           // human name, e.g. 'Gentle Glow'
  rarity: SpiritRarity;

  // Optional fine-tuning on top of base + rarity multipliers:
  hueOffset?: number;            // e.g. +20 or -15 on HSL hue
  sizeMultiplier?: number;       // e.g. 0.9, 1.1
  speedMultiplier?: number;
  lifetimeMultiplier?: number;
  connectionsOverride?: number;  // if set, overrides the computed value
}

/**
 * Final resolved config for a variant, ready to use in the SpiritLayer.
 * All multipliers have been applied and values are final.
 */
export interface ResolvedSpiritConfig {
  id: string;
  displayName: string;
  baseKey: string;               // 'simple-glow'
  behavior: SpiritBehaviorType;
  rarity: SpiritRarity;

  size: number;                  // final px
  speed: number;                 // final speed scalar
  lifetimeMs: number;            // final lifetime
  connectionsRequired: number;   // final required connections

  hue: number;                   // final hue in HSL
}
