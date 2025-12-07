import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ResolvedSpiritConfig } from '@/game/spirits/types';
import { getSpiritById, getRandomSpiritsForInitialSpawn } from '@/game/spirits/registry';

/**
 * Active spirit instance at runtime.
 * Combines config with current position, velocity, and expiration.
 */
interface ActiveSpirit {
  instanceId: string;         // unique per instance
  configId: string;           // ResolvedSpiritConfig.id
  config: ResolvedSpiritConfig;

  x: number;                  // in %
  y: number;                  // in %
  vx: number;
  vy: number;
  expiresAt: number;          // timestamp (performance.now + lifetimeMs)
}

/**
 * Payload sent when a spirit is clicked.
 * Contains full spirit information for future badges/synchronization.
 */
export interface SpiritClickPayload {
  instanceId: string;
  configId: string;
  config: ResolvedSpiritConfig;
}

interface SpiritLayerProps {
  onSpiritClick: (payload: SpiritClickPayload) => void;
}

/**
 * Exposed API for debug spawning.
 */
export interface SpiritLayerHandle {
  spawnById: (spiritId: string) => void;
}

let instanceCounter = 0;

export const SpiritLayer = forwardRef<SpiritLayerHandle, SpiritLayerProps>(
  ({ onSpiritClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const [spirits, setSpirits] = useState<ActiveSpirit[]>([]);
    const cursorRef = useRef<{ xPct: number; yPct: number } | null>(null);
    const lastCursorMoveTimeRef = useRef<number>(performance.now());

    /**
     * Create a new active spirit from a resolved config.
     */
    const createActiveSpirit = useCallback((config: ResolvedSpiritConfig): ActiveSpirit => {
      return {
        instanceId: `spirit-instance-${++instanceCounter}`,
        configId: config.id,
        config,
        x: 20 + Math.random() * 60, // percentage
        y: 20 + Math.random() * 60, // percentage
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        expiresAt: performance.now() + config.lifetimeMs,
      };
    }, []);

    /**
     * Spawn a spirit by its config ID (for debug UI).
     */
    const spawnById = useCallback((spiritId: string) => {
      const config = getSpiritById(spiritId);
      if (!config) {
        console.warn(`Spirit config not found: ${spiritId}`);
        return;
      }

      const newSpirit = createActiveSpirit(config);
      setSpirits(prev => [...prev, newSpirit]);
    }, [createActiveSpirit]);

    // Expose spawnById to parent via ref
    useImperativeHandle(ref, () => ({
      spawnById,
    }), [spawnById]);

    // Initialize with random spirits on mount
    useEffect(() => {
      const initialConfigs = getRandomSpiritsForInitialSpawn('simple-glow', 3);
      const initialSpirits = initialConfigs.map(createActiveSpirit);
      setSpirits(initialSpirits);
    }, [createActiveSpirit]);

    // Track cursor position in percentage coordinates and stillness
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const prevCursor = cursorRef.current;

        // Only update lastCursorMoveTime if cursor actually moved (ignore tiny noise)
        if (!prevCursor || Math.abs(prevCursor.xPct - x) > 0.1 || Math.abs(prevCursor.yPct - y) > 0.1) {
          lastCursorMoveTimeRef.current = performance.now();
        }

        cursorRef.current = { xPct: x, yPct: y };
      };

      container.addEventListener('mousemove', handleMouseMove);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }, []);

    // Animation loop
    useEffect(() => {
      let lastTime = performance.now();

      const animate = (currentTime: number) => {
        const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to ~60fps
        lastTime = currentTime;

        setSpirits((prevSpirits) => {
          // Remove expired spirits
          const activeSpirits = prevSpirits.filter(spirit => spirit.expiresAt > currentTime);

          // Update positions
          return activeSpirits.map((spirit) => {
            const speedMultiplier = spirit.config.speed;
            let newVx = spirit.vx;
            let newVy = spirit.vy;

            // 1) Base wandering (common to both behaviors)
            let newX = spirit.x + newVx * speedMultiplier * deltaTime * 0.3;
            let newY = spirit.y + newVy * speedMultiplier * deltaTime * 0.3;

            // Track if shy is in approach mode (needed for later logic)
            let isApproachMode = false;

            // 2) Behavior-specific adjustments
            if (spirit.config.behavior === 'shy') {
              const cursor = cursorRef.current;
              if (cursor) {
                const dx = newX - cursor.xPct;
                const dy = newY - cursor.yPct;
                const distance = Math.hypot(dx, dy);

                // Calculate how long cursor has been still
                const cursorStillForMs = currentTime - lastCursorMoveTimeRef.current;

                // Calculate patience time based on spirit's rarity/stats
                const lifetimeSec = spirit.config.lifetimeMs / 1000;
                const patienceSeconds = Math.max(0.7, Math.min(3.0, (lifetimeSec * 0.15) / spirit.config.speed));
                const patienceMs = patienceSeconds * 1000;

                // Determine mode: APPROACH or FLEE
                const approachRadius = 40; // percent of container
                isApproachMode = cursorStillForMs >= patienceMs && distance < approachRadius;

                if (distance > 0) {
                  const normX = dx / distance;
                  const normY = dy / distance;

                  if (isApproachMode) {
                    // APPROACH MODE: fast, decisive movement toward cursor
                    // Use distance-based strength: far = strong pull, close = gentle
                    const baseApproachStrength = 1.2;
                    const distanceFactor = Math.min(distance / 50, 1); // 0..1, normalized to 50% container
                    const approachStrength = baseApproachStrength * (0.4 + distanceFactor * 0.6);

                    // Override velocity to move directly toward cursor (lock-on effect)
                    newVx = -normX * approachStrength * spirit.config.speed;
                    newVy = -normY * approachStrength * spirit.config.speed;

                    // Recalculate position with new approach velocity
                    newX = spirit.x + newVx * speedMultiplier * deltaTime * 0.3;
                    newY = spirit.y + newVy * speedMultiplier * deltaTime * 0.3;

                    // Soft stabilization when very close (reduces orbiting)
                    const softLockRadius = 3.0; // in % of container
                    if (distance < softLockRadius) {
                      // Dampen velocity as we get close to prevent orbiting
                      const dampingFactor = distance / softLockRadius; // 0..1
                      newVx *= dampingFactor * 0.3;
                      newVy *= dampingFactor * 0.3;

                      // Snap to cursor when extremely close
                      if (distance < 0.8) {
                        newX = cursor.xPct;
                        newY = cursor.yPct;
                        newVx = 0;
                        newVy = 0;
                      }
                    }
                  } else {
                    // FLEE MODE: repel from cursor when it's close
                    const repelRadius = 25; // percent of container
                    if (distance < repelRadius) {
                      const repelStrength = (repelRadius - distance) / repelRadius; // 0..1
                      // push velocity away from cursor
                      newVx += normX * repelStrength * 0.8;
                      newVy += normY * repelStrength * 0.8;
                    }
                  }
                }
              }
            }

            // 3) Boundary checking with bounce
            const margin = 5; // percentage margin from edges
            const maxX = 95;
            const maxY = 95;

            if (newX < margin) {
              newX = margin;
              newVx = Math.abs(newVx) * (0.8 + Math.random() * 0.4);
              // Add slight randomness to direction
              newVy += (Math.random() - 0.5) * 0.5;
            } else if (newX > maxX) {
              newX = maxX;
              newVx = -Math.abs(newVx) * (0.8 + Math.random() * 0.4);
              newVy += (Math.random() - 0.5) * 0.5;
            }

            if (newY < margin) {
              newY = margin;
              newVy = Math.abs(newVy) * (0.8 + Math.random() * 0.4);
              newVx += (Math.random() - 0.5) * 0.5;
            } else if (newY > maxY) {
              newY = maxY;
              newVy = -Math.abs(newVy) * (0.8 + Math.random() * 0.4);
              newVx += (Math.random() - 0.5) * 0.5;
            }

            // 4) Occasional random direction changes (skip if shy in approach mode)
            const isShy = spirit.config.behavior === 'shy';
            if (!(isShy && isApproachMode) && Math.random() < 0.005) {
              newVx += (Math.random() - 0.5) * 1;
              newVy += (Math.random() - 0.5) * 1;
            }

            // 5) Clamp velocity
            const maxVel = 2;
            newVx = Math.max(-maxVel, Math.min(maxVel, newVx));
            newVy = Math.max(-maxVel, Math.min(maxVel, newVy));

            return {
              ...spirit,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
            };
          });
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, []);

    return (
      <div ref={containerRef} className="absolute inset-0 z-20">
        {spirits.map((spirit) => (
          <button
            key={spirit.instanceId}
            onClick={() =>
              onSpiritClick({
                instanceId: spirit.instanceId,
                configId: spirit.configId,
                config: spirit.config,
              })
            }
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-spirit-glow/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-full"
            style={{
              left: `${spirit.x}%`,
              top: `${spirit.y}%`,
              width: spirit.config.size,
              height: spirit.config.size,
            }}
            aria-label={`${spirit.config.displayName} (${spirit.config.rarity})`}
            title={spirit.config.displayName}
          >
            {/* Core glow */}
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle,
                  hsl(${spirit.config.hue}, 80%, 80%) 0%,
                  hsl(${spirit.config.hue}, 70%, 60%) 30%,
                  hsl(${spirit.config.hue}, 60%, 40%) 60%,
                  transparent 100%)`,
                boxShadow: `
                  0 0 ${spirit.config.size}px hsl(${spirit.config.hue}, 70%, 60%),
                  0 0 ${spirit.config.size * 2}px hsl(${spirit.config.hue}, 60%, 50%),
                  0 0 ${spirit.config.size * 3}px hsl(${spirit.config.hue}, 50%, 40%)
                `,
              }}
            />
            {/* Inner bright core */}
            <div
              className="absolute rounded-full"
              style={{
                top: '25%',
                left: '25%',
                width: '50%',
                height: '50%',
                background: `radial-gradient(circle,
                  white 0%,
                  hsl(${spirit.config.hue}, 80%, 90%) 50%,
                  transparent 100%)`,
              }}
            />
          </button>
        ))}
      </div>
    );
  }
);