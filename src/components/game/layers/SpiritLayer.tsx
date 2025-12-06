import { useEffect, useRef, useState, useCallback } from 'react';

interface Spirit {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  speed: 'fast' | 'medium';
  hue: number;
}

interface SpiritLayerProps {
  onSpiritClick: (id: string) => void;
}

const SPIRIT_CONFIGS = [
  { id: 'spirit-1', speed: 'fast' as const, size: 16, hue: 180 },
  { id: 'spirit-2', speed: 'medium' as const, size: 20, hue: 120 },
];

const SPEED_MULTIPLIERS = {
  fast: 2.5,
  medium: 1.2,
};

export function SpiritLayer({ onSpiritClick }: SpiritLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const [spirits, setSpirits] = useState<Spirit[]>([]);

  // Initialize spirits with random positions and velocities
  const initializeSpirits = useCallback(() => {
    return SPIRIT_CONFIGS.map((config) => ({
      ...config,
      x: 20 + Math.random() * 60, // percentage
      y: 20 + Math.random() * 60, // percentage
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    setSpirits(initializeSpirits());

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to ~60fps
      lastTime = currentTime;

      setSpirits((prevSpirits) =>
        prevSpirits.map((spirit) => {
          const speedMultiplier = SPEED_MULTIPLIERS[spirit.speed];
          let newX = spirit.x + spirit.vx * speedMultiplier * deltaTime * 0.3;
          let newY = spirit.y + spirit.vy * speedMultiplier * deltaTime * 0.3;
          let newVx = spirit.vx;
          let newVy = spirit.vy;

          // Boundary checking with bounce
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

          // Occasional random direction changes
          if (Math.random() < 0.005) {
            newVx += (Math.random() - 0.5) * 1;
            newVy += (Math.random() - 0.5) * 1;
          }

          // Clamp velocity
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
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializeSpirits]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-20">
      {spirits.map((spirit) => (
        <button
          key={spirit.id}
          onClick={() => onSpiritClick(spirit.id)}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-spirit-glow/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-full"
          style={{
            left: `${spirit.x}%`,
            top: `${spirit.y}%`,
            width: spirit.size,
            height: spirit.size,
          }}
          aria-label={`Spirit orb ${spirit.id}`}
        >
          {/* Core glow */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, 
                hsl(${spirit.hue}, 80%, 80%) 0%, 
                hsl(${spirit.hue}, 70%, 60%) 30%, 
                hsl(${spirit.hue}, 60%, 40%) 60%, 
                transparent 100%)`,
              boxShadow: `
                0 0 ${spirit.size}px hsl(${spirit.hue}, 70%, 60%),
                0 0 ${spirit.size * 2}px hsl(${spirit.hue}, 60%, 50%),
                0 0 ${spirit.size * 3}px hsl(${spirit.hue}, 50%, 40%)
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
                hsl(${spirit.hue}, 80%, 90%) 50%, 
                transparent 100%)`,
            }}
          />
        </button>
      ))}
    </div>
  );
}
