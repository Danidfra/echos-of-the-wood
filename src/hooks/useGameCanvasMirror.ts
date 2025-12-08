/**
 * useGameCanvasMirror Hook
 *
 * Creates and manages a canvas that mirrors the game viewport for PiP.
 * Draws a complete representation of the game (background + midground + spirits).
 */

import { useRef, useEffect, useState, useCallback } from 'react';

export interface SpiritPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // pixels
  hue: number; // HSL hue value
  behavior: string;
}

export interface GameCanvasMirrorOptions {
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Background color (day mode) */
  bgColorDay?: string;
  /** Background color (night mode) */
  bgColorNight?: string;
  /** Whether it's currently night */
  isNight?: boolean;
  /** Array of spirit positions to render */
  spirits?: SpiritPosition[];
  /** Frames per second for canvas updates */
  fps?: number;
  /** Number of grass blades to render */
  grassCount?: number;
  /** Grass height factor (0-1) */
  grassHeightFactor?: number;
}

// ============================================================================
// GRASS RENDERING (Lightweight version)
// ============================================================================

interface GrassObject {
  x: number;
  y: number;
  seg1: number;
  seg2: number;
  grassWidth: number;
  baseColor: string;
  tipColor: string;
  currentAngle: number;
  angle: number;
  goal: number;
  diff: number;
  counter: number;
  delta: number;
}

/**
 * Ease in-out function for smooth grass animation
 */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/**
 * Calculate end point based on length and angle
 */
function lineToAngle(x1: number, y1: number, length: number, angle: number): [number, number] {
  const angleRad = (angle * Math.PI) / 180;
  const x2 = x1 + length * Math.cos(angleRad);
  const y2 = y1 + length * Math.sin(angleRad);
  return [x2, y2];
}

/**
 * Draw smooth curve through points using simplified cardinal spline
 */
function drawCurve(
  ctx: CanvasRenderingContext2D,
  pts: number[],
  ts: number = 0.5,
  nos: number = 16
): void {
  const _pts: number[] = [];
  const res: number[] = [];

  // Clone array and add first/last points for proper curve
  _pts.push(pts[0]);
  _pts.push(pts[1]);
  _pts.push(...pts);
  _pts.push(pts[pts.length - 2]);
  _pts.push(pts[pts.length - 1]);

  const l = pts.length;

  ctx.moveTo(pts[0], pts[1]);

  for (let i = 2; i < l; i += 2) {
    const pt1 = _pts[i];
    const pt2 = _pts[i + 1];
    const pt3 = _pts[i + 2];
    const pt4 = _pts[i + 3];

    // Calculate tension vectors
    const t1x = (pt3 - _pts[i - 2]) * ts;
    const t2x = (_pts[i + 4] - pt1) * ts;
    const t1y = (pt4 - _pts[i - 1]) * ts;
    const t2y = (_pts[i + 5] - pt2) * ts;

    for (let t = 0; t <= nos; t++) {
      const st = t / nos;
      const st2 = st * st;
      const st3 = st2 * st;
      const st23 = st3 * 2;
      const st32 = st2 * 3;

      // Calculate cardinals
      const c1 = st23 - st32 + 1;
      const c2 = st32 - st23;
      const c3 = st3 - 2 * st2 + st;
      const c4 = st3 - st2;

      res.push(c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x);
      res.push(c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y);
    }
  }

  const resLen = res.length;
  for (let i = 0; i < resLen; i += 2) {
    ctx.lineTo(res[i], res[i + 1]);
  }
}

/**
 * Create a single grass blade object
 */
function createGrassObject(
  x: number,
  y: number,
  seg1: number,
  seg2: number,
  maxAngle: number,
  grassWidth: number,
  isNight: boolean
): GrassObject {
  // Get random angle between 0 and maxAngle
  function getAngle(): number {
    return maxAngle * Math.random();
  }

  // Generate grass colors based on day/night
  let baseColor: string;
  let tipColor: string;

  if (!isNight) {
    // Day: green gradient
    const baseGreen = Math.floor(Math.random() * 50 + 50);
    const tipGreen = Math.floor(100 * Math.random() + 170);
    baseColor = `rgb(0,${baseGreen},0)`;
    tipColor = `rgb(0,${tipGreen},0)`;
  } else {
    // Night: darker teal / blue-green
    const baseMin = Math.floor(Math.random() * 50 + 50);
    const baseMax = Math.floor(100 * Math.random() + 170);
    baseColor = `rgb(0,${Math.floor(baseMin * 0.6)},${Math.floor(baseMin * 0.9)})`;
    tipColor = `rgb(0,${Math.floor(baseMax * 0.7)},${Math.floor(baseMax)})`;
  }

  const angle = getAngle();
  const goal = getAngle();

  return {
    x,
    y,
    seg1,
    seg2,
    grassWidth,
    baseColor,
    tipColor,
    currentAngle: angle,
    angle,
    goal,
    diff: goal - angle,
    counter: 0,
    delta: (4 * Math.random() + 1) / 100,
  };
}

/**
 * Update grass blade animation
 */
function updateGrassObject(grass: GrassObject, maxAngle: number): void {
  grass.counter += grass.delta;

  if (grass.counter > 1) {
    // Set new goal
    grass.angle = grass.goal;
    grass.goal = maxAngle * Math.random();
    grass.diff = grass.goal - grass.angle;
    grass.counter = 0;
    grass.delta = (4 * Math.random() + 1) / 100;
    return;
  }

  const t = easeInOut(grass.counter);
  grass.currentAngle = grass.angle + t * grass.diff;
}

/**
 * Render a single grass blade
 */
function renderGrassBlade(
  ctx: CanvasRenderingContext2D,
  grass: GrassObject,
  canvasHeight: number
): void {
  const x = grass.x;
  const y = grass.y;
  const gw = grass.grassWidth;

  ctx.beginPath();

  const pos = lineToAngle(x, canvasHeight, y, grass.currentAngle + 225);
  const diff = pos[0] - x;

  // Build the grass blade shape
  const pts: number[] = [];

  // Bottom left
  pts.push(x);
  pts.push(canvasHeight);

  // Lower segment
  pts.push(x + diff / 4);
  pts.push(canvasHeight - grass.seg1);

  // Middle segment
  pts.push(x + (diff / 3) * 2);
  pts.push(canvasHeight - grass.seg2);

  // Top point
  pts.push(pos[0]);
  pts.push(pos[1]);

  // Middle segment (right side)
  pts.push(x + (diff / 3) * 2 + gw * 0.5);
  pts.push(canvasHeight - grass.seg2);

  // Lower segment (right side)
  pts.push(x + diff / 4 + gw * 0.6);
  pts.push(canvasHeight - grass.seg1 + 10);

  // Bottom right
  pts.push(x + gw);
  pts.push(canvasHeight);

  // Draw smooth curve through points
  drawCurve(ctx, pts, 0.8, 5);

  ctx.closePath();

  // Create gradient for this blade
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(1, grass.baseColor);
  gradient.addColorStop(0, grass.tipColor);

  ctx.fillStyle = gradient;
  ctx.fill();
}

/**
 * Initialize grass blades
 */
function initializeGrass(
  numOfGrass: number,
  width: number,
  height: number,
  hVariation: number,
  grassWidth: number,
  isNight: boolean
): GrassObject[] {
  const grass: GrassObject[] = [];
  const hf = height * hVariation;

  for (let i = 0; i < numOfGrass; i++) {
    const x = width * Math.random();
    const y = height - hf * Math.random();
    const seg1 = y / 3 + y * hVariation * Math.random() * 0.1;
    const seg2 = (y / 3) * 2 + y * hVariation * Math.random() * 0.1;
    const maxAngle = 15 * Math.random() + 50;

    grass.push(createGrassObject(x, y, seg1, seg2, maxAngle, grassWidth, isNight));
  }

  return grass;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook to create and manage a canvas mirror of the game viewport.
 * Returns a canvas ref and a MediaStream for PiP.
 */
export function useGameCanvasMirror(options: GameCanvasMirrorOptions = {}) {
  const {
    width = 1280,
    height = 720,
    bgColorDay = '#1a3a2e',
    bgColorNight = '#0d1f1a',
    isNight = false,
    spirits = [],
    fps = 30,
    grassCount = 100,
    grassHeightFactor = 0.6,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Fixed timestep accumulator for smooth rendering
  const accumulatorRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Grass state
  const grassRef = useRef<GrassObject[]>([]);
  const grassInitializedRef = useRef<boolean>(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'fixed';
    canvas.style.top = '-9999px';
    canvas.style.left = '-9999px';
    canvas.style.pointerEvents = 'none';

    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    // Create stream from canvas
    const canvasStream = canvas.captureStream(fps);
    setStream(canvasStream);

    return () => {
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop stream tracks
      canvasStream.getTracks().forEach(track => track.stop());

      // Remove canvas
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }

      canvasRef.current = null;
    };
  }, [width, height, fps]);

  // Initialize or reinitialize grass when parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const grassHeight = height * grassHeightFactor;
    grassRef.current = initializeGrass(
      grassCount,
      width,
      grassHeight,
      0.3,
      12,
      isNight
    );
    grassInitializedRef.current = true;
  }, [width, height, grassCount, grassHeightFactor, isNight]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ========================================================================
    // LAYER 1: Background (matching BackgroundLayer.tsx)
    // ========================================================================

    // Base background color
    const bgColor = isNight ? bgColorNight : bgColorDay;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add gradient overlay for depth (matching the forest depth effect)
    const depthGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    depthGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    depthGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = depthGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle floating particles (fireflies) - simplified version
    const particleCount = 8;
    const time = Date.now() / 1000;
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 0.7;
      const x = (10 + (seed * 80) % 80) / 100 * canvas.width;
      const baseY = (20 + (seed * 50) % 50) / 100 * canvas.height;
      
      // Simple sine wave for floating animation
      const floatOffset = Math.sin(time * 0.3 + seed * Math.PI) * 20;
      const y = baseY + floatOffset;

      // Draw particle
      ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ========================================================================
    // LAYER 2: Midground (grass)
    // ========================================================================

    if (grassInitializedRef.current && grassRef.current.length > 0) {
      const grassHeight = canvas.height * grassHeightFactor;
      const grassY = canvas.height - grassHeight;

      // Update grass animations
      grassRef.current.forEach(grass => {
        const maxAngle = 15 * Math.random() + 50;
        updateGrassObject(grass, maxAngle);
      });

      // Render grass blades
      ctx.save();
      ctx.translate(0, grassY);
      grassRef.current.forEach(grass => {
        renderGrassBlade(ctx, grass, grassHeight);
      });
      ctx.restore();
    }

    // ========================================================================
    // LAYER 3: Spirits
    // ========================================================================

    spirits.forEach(spirit => {
      const x = (spirit.x / 100) * canvas.width;
      const y = (spirit.y / 100) * canvas.height;
      const radius = spirit.size / 2;

      const hue = spirit.hue;

      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      glowGradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.4)`);
      glowGradient.addColorStop(0.5, `hsla(${hue}, 80%, 60%, 0.2)`);
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - radius * 3, y - radius * 3, radius * 6, radius * 6);

      // Draw spirit core
      const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGradient.addColorStop(0.3, `hsla(${hue}, 80%, 80%, 1)`);
      coreGradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 1)`);
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // ========================================================================
    // LAYER 4: Overlay (game title)
    // ========================================================================

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Echos of the Wood', canvas.width / 2, 30);
  }, [isNight, bgColorDay, bgColorNight, spirits, grassHeightFactor]);

  // Animation loop with fixed timestep for smooth rendering
  useEffect(() => {
    const targetFrameTime = 1000 / fps; // Target time per frame in ms

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      // Calculate delta time
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Add to accumulator
      accumulatorRef.current += deltaTime;

      // Process fixed timesteps
      while (accumulatorRef.current >= targetFrameTime) {
        // Update and draw at fixed intervals
        draw();
        accumulatorRef.current -= targetFrameTime;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
    };
  }, [draw, fps]);

  return {
    canvasRef,
    stream,
  };
}
