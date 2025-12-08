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
import { SHY_BASE } from './shy/base';
import { SHY_VARIANTS } from './shy/variants';
import { HUNTER_BASE } from './hunter/base';
import { HUNTER_VARIANTS } from './hunter/variants';
import { CURIOUS_BASE } from './curious/base';
import { CURIOUS_VARIANTS } from './curious/variants';
import { RHYTHM_BASE } from './rhythm/base';
import { RHYTHM_VARIANTS } from './rhythm/variants';
import { ECHO_BASE } from './echo/base';
import { ECHO_VARIANTS } from './echo/variants';

// ============================================================================
// BASE CONFIGS REGISTRY
// ============================================================================

const BASES: Record<string, SpiritBaseConfig> = {
  'simple-glow': SIMPLE_GLOW_BASE,
  'shy': SHY_BASE,
  'hunter': HUNTER_BASE,
  'curious': CURIOUS_BASE,
  'rhythm': RHYTHM_BASE,
  'echo': ECHO_BASE,
  // Future behaviors:
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

  // Special lifetime behavior for hunter and rhythm spirits:
  // Both have INVERTED lifetime scaling - higher rarity = longer lifetime
  let lifetimeMs: number;
  if (base.behavior === 'hunter') {
    // Hunter-specific lifetime multipliers per rarity (inverted from global pattern)
    const hunterLifetimeMultipliers: Record<string, number> = {
      'common': 0.7,      // shortest
      'uncommon': 1.1,    // a bit longer
      'rare': 1.5,        // clearly longer
      'mythic': 2.2,      // significantly longest
    };
    const hunterMultiplier = hunterLifetimeMultipliers[variant.rarity] ?? 1.0;
    lifetimeMs = base.baseLifetimeMs
      * hunterMultiplier
      * (variant.lifetimeMultiplier ?? 1);
  } else if (base.behavior === 'rhythm') {
    // Rhythm-specific lifetime multipliers per rarity (inverted - harder patterns need more time)
    const rhythmLifetimeMultipliers: Record<string, number> = {
      'common': 1.0,      // base time
      'uncommon': 1.2,    // 20% more time
      'rare': 1.45,       // 45% more time
      'mythic': 1.8,      // 80% more time - complex patterns need patience
    };
    const rhythmMultiplier = rhythmLifetimeMultipliers[variant.rarity] ?? 1.0;
    lifetimeMs = base.baseLifetimeMs
      * rhythmMultiplier
      * (variant.lifetimeMultiplier ?? 1);
  } else {
    // All other behaviors use standard rarity-based lifetime
    lifetimeMs = base.baseLifetimeMs
      * rarity.lifetimeMultiplier
      * (variant.lifetimeMultiplier ?? 1);
  }

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
  ...SHY_VARIANTS.map(resolveSpiritVariant),
  ...HUNTER_VARIANTS.map(resolveSpiritVariant),
  ...CURIOUS_VARIANTS.map(resolveSpiritVariant),
  ...RHYTHM_VARIANTS.map(resolveSpiritVariant),
  ...ECHO_VARIANTS.map(resolveSpiritVariant),
  // Future behaviors will be added here:
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
