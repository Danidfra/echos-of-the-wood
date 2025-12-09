/**
 * useGameCanvasMirror Hook
 *
 * Creates a complete, self-contained mini-renderer for PiP.
 * Renders a full standalone version of the game scene (background, midground, spirits)
 * on its own offscreen canvas without touching or reusing the main game viewport.
 *
 * This is a viewer-only mini engine that observes game state and renders independently.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import florestDayImage from '@/assets/background/florest.png';
import florestNightImage from '@/assets/background/florest-night.png';

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
// BACKGROUND IMAGE LOADING
// ============================================================================

const backgroundImageCache = new Map<string, HTMLImageElement>();

function loadBackgroundImage(isNight: boolean): Promise<HTMLImageElement> {
  const src = isNight ? florestNightImage : florestDayImage;

  if (backgroundImageCache.has(src)) {
    return Promise.resolve(backgroundImageCache.get(src)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      backgroundImageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// ============================================================================
// GRASS RENDERING (Lightweight, self-contained version)
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
 * Draw smooth curve through points using cardinal spline
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
  function getAngle(): number {
    return maxAngle * Math.random();
  }

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
 * Initialize grass blades with proper scaling based on canvas dimensions
 */
function initializeGrass(
  numOfGrass: number,
  canvasWidth: number,
  canvasHeight: number,
  grassHeightFactor: number,
  isNight: boolean
): GrassObject[] {
  const grass: GrassObject[] = [];

  // Mesmo comportamento visual do Midground:
  // - a grama vive em uma "faixa" na parte de baixo
  // - essa faixa tem 1/3 da altura total da cena
  const GRASS_CONTAINER_HEIGHT_FACTOR = 2 / 3;

  const grassContainerHeight = canvasHeight * GRASS_CONTAINER_HEIGHT_FACTOR;
  const grassHeight = grassContainerHeight * grassHeightFactor;
  const hVariation = 0.3;
  const hf = grassHeight * hVariation;

  // Largura da folha de grama proporcional ao canvas
  const grassWidth = Math.max(8, canvasWidth * 0.01);

  for (let i = 0; i < numOfGrass; i++) {
    const x = canvasWidth * Math.random();
    const y = grassHeight - hf * Math.random();
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
 * This is a completely self-contained mini-renderer for PiP only.
 * Returns a canvas ref and a MediaStream for PiP.
 */
export function useGameCanvasMirror(options: GameCanvasMirrorOptions = {}) {
  const {
    width = 1280,
    height = 720,
    isNight = false,
    spirits = [],
    fps = 60,
    grassCount = 100,
    grassHeightFactor = 0.6,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Grass state
  const grassRef = useRef<GrassObject[]>([]);

  const spiritsRef = useRef<SpiritPosition[]>([]);
  
  // Background image state
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundLoadedRef = useRef<boolean>(false);

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

  // Load background image when isNight changes
  useEffect(() => {
    loadBackgroundImage(isNight).then(img => {
      backgroundImageRef.current = img;
      backgroundLoadedRef.current = true;
    }).catch(err => {
      console.warn('Failed to load background image for PiP:', err);
      backgroundLoadedRef.current = false;
    });
  }, [isNight]);

  useEffect(() => {
    spiritsRef.current = spirits;
  }, [spirits]);

  // Initialize or reinitialize grass when parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const grassHeight = canvas.height * grassHeightFactor;
    grassRef.current = initializeGrass(
      grassCount,
      canvas.width,
      grassHeight,
      grassHeightFactor,
      isNight
    );
  }, [width, height, grassCount, grassHeightFactor, isNight]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // ========================================================================
    // LAYER 1: Background
    // ========================================================================

    // Draw background image if loaded
    if (backgroundLoadedRef.current && backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, canvasWidth, canvasHeight);
    } else {
      // Fallback solid color while image loads
      const bgColor = isNight ? '#0d1f1a' : '#1a3a2e';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Add depth gradient overlay
    const depthGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    depthGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    depthGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = depthGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Add subtle floating particles (fireflies)
    const particleCount = 8;
    const time = Date.now() / 1000;
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 0.7;
      const x = (10 + (seed * 80) % 80) / 100 * canvasWidth;
      const baseY = (20 + (seed * 50) % 50) / 100 * canvasHeight;
      
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
    // LAYER 2: Midground (Grass)
    // ========================================================================

    if (grassRef.current.length > 0) {
      const grassHeight = canvasHeight * grassHeightFactor;
      const grassY = canvasHeight - grassHeight;

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

    const currentSpirits = spiritsRef.current;

    currentSpirits.forEach(spirit => {
      const x = (spirit.x / 100) * canvasWidth;
      const y = (spirit.y / 100) * canvasHeight;
      const radius = spirit.size / 2;

      const hue = spirit.hue;

      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      glowGradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.4)`);
      glowGradient.addColorStop(0.5, `hsla(${hue}, 80%, 60%, 0.2)`);
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fill();

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
    ctx.fillText('Echos of the Wood', canvasWidth / 2, 30);
  }, [isNight, grassHeightFactor]);

  // Animation loop with smooth 60 FPS rendering
  useEffect(() => {
    const targetFrameTime = 1000 / fps;
    let lastFrameTime = 0;

    const animate = (currentTime: number) => {
      // Check if enough time has passed for the next frame
      if (currentTime - lastFrameTime >= targetFrameTime) {
        lastFrameTime = currentTime;
        render();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render, fps]);

  return {
    canvasRef,
    stream,
  };
}
