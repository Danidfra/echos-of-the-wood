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

  // Curious-specific state
  curiousState?: {
    isAwakened: boolean;
    curiosityCircle?: {
      xPct: number;
      yPct: number;
      radiusPct: number;
    };
    lastGentleInteractionAt: number;
    curiosityProgress: number;  // 0..1, how close to awakening
    lastCursorX: number;        // for tracking movement delta
    lastCursorY: number;
    hasReachedCircle: boolean;  // true when spirit enters the circle
  };
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
    const lastCursorPositionRef = useRef<{ xPct: number; yPct: number } | null>(null);
    const cursorMovementDeltaRef = useRef<number>(0);

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

        // Calculate movement delta for curious spirit behavior
        if (lastCursorPositionRef.current) {
          const dx = x - lastCursorPositionRef.current.xPct;
          const dy = y - lastCursorPositionRef.current.yPct;
          cursorMovementDeltaRef.current = Math.hypot(dx, dy);
        }

        // Only update lastCursorMoveTime if cursor actually moved (ignore tiny noise)
        if (!prevCursor || Math.abs(prevCursor.xPct - x) > 0.1 || Math.abs(prevCursor.yPct - y) > 0.1) {
          lastCursorMoveTimeRef.current = performance.now();
        }

        lastCursorPositionRef.current = { xPct: x, yPct: y };
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
            // Track if hunter is in chase mode (needed for later logic)
            let isHunterChasing = false;

            // 2) Behavior-specific adjustments
            if (spirit.config.behavior === 'curious') {
              const cursor = cursorRef.current;
              const movementDelta = cursorMovementDeltaRef.current;

              // Initialize curious state if not present
              if (!spirit.curiousState) {
                spirit.curiousState = {
                  isAwakened: false,
                  curiosityProgress: 0,
                  lastGentleInteractionAt: 0,
                  lastCursorX: cursor?.xPct ?? 0,
                  lastCursorY: cursor?.yPct ?? 0,
                  hasReachedCircle: false,
                };
              }

              if (cursor) {
                const dx = newX - cursor.xPct;
                const dy = newY - cursor.yPct;
                const distance = Math.hypot(dx, dy);

                // Define thresholds for gentle vs sudden movement
                const gentleMovementMaxDelta = 1.8; // % per frame (slightly more forgiving)
                const suddenMovementThreshold = 3.5; // % per frame
                const interactionRadius = 30; // % of container

                const isGentleMovement = movementDelta < gentleMovementMaxDelta && movementDelta > 0.05;
                const isSuddenMovement = movementDelta >= suddenMovementThreshold;
                const isNearCursor = distance < interactionRadius;

                // ===== PHASE 1: Building Curiosity (Not Awakened) =====
                if (!spirit.curiousState.isAwakened) {
                  // Detect sudden movement - startle and reset progress
                  if (isSuddenMovement) {
                    spirit.curiousState.curiosityProgress = Math.max(0, spirit.curiousState.curiosityProgress - 0.3);

                    // Apply flee impulse
                    if (distance > 0 && distance < 25) {
                      const normX = dx / distance;
                      const normY = dy / distance;
                      const fleeStrength = 1.5;
                      newVx += normX * fleeStrength;
                      newVy += normY * fleeStrength;
                    }
                  }

                  // Build curiosity with gentle movement near the spirit
                  if (isGentleMovement && isNearCursor) {
                    // Calculate time-based awakening (2-4 seconds of gentle orbiting)
                    const awakeningTimeMs = Math.max(2000, Math.min(4000,
                      (spirit.config.lifetimeMs * 0.10) / spirit.config.speed
                    ));

                    // Increment progress (more generous to make awakening achievable)
                    spirit.curiousState.curiosityProgress = Math.min(1,
                      spirit.curiousState.curiosityProgress + (deltaTime * 1.2 / (awakeningTimeMs / 16.67))
                    );
                    spirit.curiousState.lastGentleInteractionAt = currentTime;

                    // Drift slightly toward cursor while building curiosity
                    if (distance > 0) {
                      const normX = dx / distance;
                      const normY = dy / distance;
                      const driftStrength = 0.15 * spirit.curiousState.curiosityProgress;
                      newVx -= normX * driftStrength;
                      newVy -= normY * driftStrength;
                    }

                    // ===== AWAKENING TRIGGER: Spawn circle relative to spirit =====
                    if (spirit.curiousState.curiosityProgress >= 1) {
                      spirit.curiousState.isAwakened = true;

                      // Spawn circle at a good distance from spirit's current position
                      const angle = Math.random() * Math.PI * 2;
                      const distanceFromSpirit = 20 + Math.random() * 12; // 20-32% of container
                      const circleX = spirit.x + Math.cos(angle) * distanceFromSpirit;
                      const circleY = spirit.y + Math.sin(angle) * distanceFromSpirit;
                      const circleRadius = 7; // % of container

                      // Clamp to safe area (10-90%)
                      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
                      const safeX = clamp(circleX, 10, 90);
                      const safeY = clamp(circleY, 10, 90);

                      spirit.curiousState.curiosityCircle = {
                        xPct: safeX,
                        yPct: safeY,
                        radiusPct: circleRadius,
                      };
                    }
                  } else if (!isGentleMovement && !isSuddenMovement) {
                    // Decay curiosity progress if not interacting gently
                    spirit.curiousState.curiosityProgress = Math.max(0,
                      spirit.curiousState.curiosityProgress - (deltaTime * 0.015)
                    );
                  }
                }

                // ===== PHASE 2: Awakened Behavior (Circle exists, spirit is entranced) =====
                if (spirit.curiousState.isAwakened && spirit.curiousState.curiosityCircle) {
                  const circle = spirit.curiousState.curiosityCircle;
                  const circleDx = circle.xPct - newX;
                  const circleDy = circle.yPct - newY;
                  const circleDistance = Math.hypot(circleDx, circleDy);

                  // Apply speed damping (entranced state - slower movement)
                  const awakenedSpeedDamping = 0.6;

                  // Check for sudden movement - can break awakened state
                  if (isSuddenMovement && movementDelta > 5) {
                    spirit.curiousState.isAwakened = false;
                    spirit.curiousState.curiosityCircle = undefined;
                    spirit.curiousState.curiosityProgress = 0;
                    spirit.curiousState.hasReachedCircle = false;
                  } else if (!spirit.curiousState.hasReachedCircle) {
                    // ===== Circle Entry Detection =====
                    if (circleDistance <= circle.radiusPct) {
                      // Spirit entered the circle - mark as reached
                      spirit.curiousState.hasReachedCircle = true;

                      // Gently slow down and center
                      newVx *= 0.3;
                      newVy *= 0.3;
                    } else {
                      // Spirit is awakened but hasn't reached circle yet
                      // Follow cursor with leash + blend attraction to circle

                      const leashRadius = 35; // % of container
                      const dxToCursor = cursor.xPct - newX;
                      const dyToCursor = cursor.yPct - newY;
                      const distToCursor = Math.hypot(dxToCursor, dyToCursor);

                      // Follow cursor when gentle movement is near
                      if (distToCursor > 0 && distToCursor < leashRadius && isGentleMovement) {
                        const followStrength = 0.4;
                        const nx = dxToCursor / distToCursor;
                        const ny = dyToCursor / distToCursor;

                        newVx = nx * followStrength * spirit.config.speed;
                        newVy = ny * followStrength * spirit.config.speed;

                        newX = spirit.x + newVx * speedMultiplier * deltaTime * 0.3;
                        newY = spirit.y + newVy * speedMultiplier * deltaTime * 0.3;
                      }

                      // Blend in attraction toward the circle
                      if (circleDistance > 0) {
                        const nxCircle = circleDx / circleDistance;
                        const nyCircle = circleDy / circleDistance;

                        const circleAttraction = 0.25;
                        // Blend current velocity with attraction to circle
                        newVx = newVx * 0.6 + nxCircle * circleAttraction * spirit.config.speed * 0.4;
                        newVy = newVy * 0.6 + nyCircle * circleAttraction * spirit.config.speed * 0.4;

                        newX = spirit.x + newVx * speedMultiplier * deltaTime * 0.3;
                        newY = spirit.y + newVy * speedMultiplier * deltaTime * 0.3;
                      }

                      // Apply awakened speed damping
                      newVx *= awakenedSpeedDamping;
                      newVy *= awakenedSpeedDamping;
                    }
                  }
                }

                // Update cursor tracking for next frame
                spirit.curiousState.lastCursorX = cursor.xPct;
                spirit.curiousState.lastCursorY = cursor.yPct;
              }
            } else if (spirit.config.behavior === 'shy') {
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
            } else if (spirit.config.behavior === 'hunter') {
              const cursor = cursorRef.current;
              if (cursor) {
                const dx = cursor.xPct - newX;
                const dy = cursor.yPct - newY;
                const distance = Math.hypot(dx, dy);

                if (distance > 0) {
                  const normX = dx / distance;
                  const normY = dy / distance;

                  // Detection radius where the hunter starts chasing
                  const chaseRadius = 55; // percent of container

                  if (distance < chaseRadius) {
                    isHunterChasing = true;

                    // Distance-based aggression:
                    // - far away: strong pull
                    // - close: gentler pull to avoid orbiting too much
                    const baseChaseStrength = 0.9;
                    const distanceFactor = Math.min(distance / 40, 1); // 0..1
                    const chaseStrength = baseChaseStrength * (0.5 + distanceFactor * 0.8);

                    // Override velocity toward cursor (lock-on feeling)
                    newVx = normX * chaseStrength * spirit.config.speed;
                    newVy = normY * chaseStrength * spirit.config.speed;

                    // Recompute position using chase velocity
                    newX = spirit.x + newVx * speedMultiplier * deltaTime * 0.3;
                    newY = spirit.y + newVy * speedMultiplier * deltaTime * 0.3;

                    // Soft lock near cursor: reduce overshoot / orbit
                    const softLockRadius = 2.5; // in %
                    if (distance < softLockRadius) {
                      const damping = distance / softLockRadius; // 0..1
                      newVx *= damping * 0.4;
                      newVy *= damping * 0.4;

                      // If extremely close, snap slightly
                      if (distance < 0.7) {
                        newX = cursor.xPct;
                        newY = cursor.yPct;
                        newVx = 0;
                        newVy = 0;
                      }
                    }
                  }
                  // If outside chaseRadius: hunter just wanders with base movement + random jitter
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

            // 4) Occasional random direction changes (skip if shy in approach mode or hunter chasing)
            const isShy = spirit.config.behavior === 'shy';
            const isHunter = spirit.config.behavior === 'hunter';
            if (!(isShy && isApproachMode) && !(isHunter && isHunterChasing) && Math.random() < 0.005) {
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
        {/* Render curiosity circles */}
        {spirits.map((spirit) => {
          if (spirit.config.behavior === 'curious' && spirit.curiousState?.isAwakened && spirit.curiousState.curiosityCircle) {
            const circle = spirit.curiousState.curiosityCircle;
            return (
              <div
                key={`circle-${spirit.instanceId}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${circle.xPct}%`,
                  top: `${circle.yPct}%`,
                  width: `${circle.radiusPct * 2}%`,
                  height: `${circle.radiusPct * 2}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    border: `2px dashed hsl(${spirit.config.hue}, 70%, 60%)`,
                    background: `radial-gradient(circle,
                      hsl(${spirit.config.hue}, 70%, 60%, 0.1) 0%,
                      hsl(${spirit.config.hue}, 60%, 50%, 0.05) 50%,
                      transparent 100%)`,
                    boxShadow: `
                      0 0 20px hsl(${spirit.config.hue}, 70%, 60%, 0.3),
                      inset 0 0 20px hsl(${spirit.config.hue}, 70%, 60%, 0.2)
                    `,
                  }}
                />
              </div>
            );
          }
          return null;
        })}

        {/* Render spirits */}
        {spirits.map((spirit) => {
          const isCurious = spirit.config.behavior === 'curious';
          const isAwakened = isCurious && spirit.curiousState?.isAwakened;
          const curiosityProgress = spirit.curiousState?.curiosityProgress ?? 0;

          return (
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
              {/* Core glow - enhanced for awakened curious spirits */}
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: `radial-gradient(circle,
                    hsl(${spirit.config.hue}, 80%, 80%) 0%,
                    hsl(${spirit.config.hue}, 70%, 60%) 30%,
                    hsl(${spirit.config.hue}, 60%, 40%) 60%,
                    transparent 100%)`,
                  boxShadow: isAwakened
                    ? `
                      0 0 ${spirit.config.size * 1.5}px hsl(${spirit.config.hue}, 80%, 70%),
                      0 0 ${spirit.config.size * 3}px hsl(${spirit.config.hue}, 70%, 60%),
                      0 0 ${spirit.config.size * 4.5}px hsl(${spirit.config.hue}, 60%, 50%)
                    `
                    : `
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
              {/* Spark particles for awakened curious spirits */}
              {isAwakened && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const angle = (i / 5) * Math.PI * 2;
                    const distance = spirit.config.size * 0.8;
                    const sparkX = Math.cos(angle) * distance;
                    const sparkY = Math.sin(angle) * distance;
                    return (
                      <div
                        key={`spark-${i}`}
                        className="absolute rounded-full animate-pulse"
                        style={{
                          left: '50%',
                          top: '50%',
                          width: spirit.config.size * 0.15,
                          height: spirit.config.size * 0.15,
                          transform: `translate(calc(-50% + ${sparkX}px), calc(-50% + ${sparkY}px))`,
                          background: `radial-gradient(circle,
                            hsl(${spirit.config.hue}, 90%, 85%) 0%,
                            transparent 100%)`,
                          boxShadow: `0 0 ${spirit.config.size * 0.3}px hsl(${spirit.config.hue}, 80%, 70%)`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    );
                  })}
                </>
              )}
              {/* Curiosity progress indicator (subtle ring for building curiosity) */}
              {isCurious && !isAwakened && curiosityProgress > 0.1 && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    border: `1px solid hsl(${spirit.config.hue}, 70%, 60%, ${curiosityProgress * 0.6})`,
                    transform: `scale(${1 + curiosityProgress * 0.3})`,
                    transition: 'all 0.3s ease-out',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }
);