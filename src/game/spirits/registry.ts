/**
 * Spirit Registry
 * 
 * Central registry for all spirit configurations.
 * Resolves variant configs into final runtime configs by applying base + rarity + variant multipliers.
 */

import { SpiritBaseConfig, SpiritVariantConfig, ResolvedSpiritConfig, SpiritBehaviorType, SpiritRarity } from './types';
import { RARITIES } from './rarities';
import { SIMPLE_GLOW_BASE } from './simpleGlow/base';
import { SIMPLE_GLOW_VARIANTS } from './simpleGlow/variants';

// ============================================================================
// BASE CONFIGS REGISTRY
// ============================================================================

const BASES: Record<string, SpiritBaseConfig> = {
  'simple-glow': SIMPLE_GLOW_BASE,
  // Future behaviors:
  // 'shy': SHY_BASE,
  // 'hunter': HUNTER_BASE,
  // 'curious': CURIOUS_BASE,
  // etc.
};

// ============================================================================
// VARIANT RESOLUTION
// ============================================================================

/**
 * Resolves a variant config into a final runtime config.
 * Applies base values + rarity multipliers + variant-specific multipliers.
 */
function resolveSpiritVariant(variant: SpiritVariantConfig): ResolvedSpiritConfig {
  const base = BASES[variant.baseKey];
  if (!base) {
    throw new Error(`Unknown base key: ${variant.baseKey}`);
  }

  const rarity = RARITIES[variant.rarity];
  if (!rarity) {
    throw new Error(`Unknown rarity: ${variant.rarity}`);
  }

  // Calculate final values by applying multipliers in order:
  // base * rarity * variant
  const size = base.baseSize
    * rarity.hitboxMultiplier
    * (variant.sizeMultiplier ?? 1);

  const speed = base.baseSpeed
    * rarity.speedMultiplier
    * (variant.speedMultiplier ?? 1);

  const lifetimeMs = base.baseLifetimeMs
    * rarity.lifetimeMultiplier
    * (variant.lifetimeMultiplier ?? 1);

  const connectionsBase = base.baseConnectionsRequired
    * rarity.connectionsMultiplier;

  const connectionsRequired = variant.connectionsOverride
    ?? Math.round(connectionsBase);

  const hue = base.baseHue + (variant.hueOffset ?? 0);

  return {
    id: variant.id,
    displayName: variant.displayName,
    baseKey: variant.baseKey,
    behavior: base.behavior,
    rarity: variant.rarity,
    size,
    speed,
    lifetimeMs,
    connectionsRequired,
    hue,
  };
}

// ============================================================================
// RESOLVED SPIRITS REGISTRY
// ============================================================================

/**
 * All resolved spirit configs, ready to use at runtime.
 */
export const ALL_RESOLVED_SPIRITS: ResolvedSpiritConfig[] = [
  ...SIMPLE_GLOW_VARIANTS.map(resolveSpiritVariant),
  // Future behaviors will be added here:
  // ...SHY_VARIANTS.map(resolveSpiritVariant),
  // ...HUNTER_VARIANTS.map(resolveSpiritVariant),
  // etc.
];

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get a resolved spirit config by its unique ID.
 */
export function getSpiritById(id: string): ResolvedSpiritConfig | undefined {
  return ALL_RESOLVED_SPIRITS.find(s => s.id === id);
}

/**
 * Get all spirits matching a behavior type and optionally a rarity.
 */
export function getSpiritsByBehaviorAndRarity(
  behavior: SpiritBehaviorType,
  rarity?: SpiritRarity | 'all'
): ResolvedSpiritConfig[] {
  return ALL_RESOLVED_SPIRITS.filter(s => {
    if (s.behavior !== behavior) return false;
    if (!rarity || rarity === 'all') return true;
    return s.rarity === rarity;
  });
}

/**
 * Get a random spirit from a list using rarity weights.
 */
export function getRandomSpirit(spirits: ResolvedSpiritConfig[]): ResolvedSpiritConfig | undefined {
  if (spirits.length === 0) return undefined;

  // Calculate total weight
  const totalWeight = spirits.reduce((sum, spirit) => {
    const rarityDef = RARITIES[spirit.rarity];
    return sum + rarityDef.spawnWeight;
  }, 0);

  // Pick a random value
  let random = Math.random() * totalWeight;

  // Find the spirit
  for (const spirit of spirits) {
    const rarityDef = RARITIES[spirit.rarity];
    random -= rarityDef.spawnWeight;
    if (random <= 0) {
      return spirit;
    }
  }

  // Fallback to first spirit (shouldn't happen)
  return spirits[0];
}

/**
 * Get random spirits for initial spawn.
 * Uses weighted random based on rarity spawn weights.
 */
export function getRandomSpiritsForInitialSpawn(
  behavior: SpiritBehaviorType,
  count: number
): ResolvedSpiritConfig[] {
  const availableSpirits = getSpiritsByBehaviorAndRarity(behavior);
  const result: ResolvedSpiritConfig[] = [];

  for (let i = 0; i < count; i++) {
    const spirit = getRandomSpirit(availableSpirits);
    if (spirit) {
      result.push(spirit);
    }
  }

  return result;
}
