import { useEffect, useRef } from 'react';

/**
 * MidgroundLayer
 *
 * The middle layer in the scene viewport.
 * Contains interactive environmental elements between the background and spirits.
 *
 * Current implementation:
 * - Animated waving grass (faithful port of Ken Fyrstenberg's algorithm)
 * - Placeholder tree silhouettes
 * - Ground vegetation hints
 *
 * Future enhancements:
 * - Animated trees that sway gently
 * - Interactive bushes that rustle when spirits pass
 * - Glowing mushrooms and flowers
 * - Ancient lanterns that flicker
 * - Fallen logs and moss-covered stones
 * - Water features (streams, puddles with reflections)
 * - Seasonal variations (falling leaves, snow)
 */

// ============================================================================
// TYPES
// ============================================================================

interface GrassObject {
  x: number;
  y: number;
  seg1: number;
  seg2: number;
  grassWidth: number;
  gradient: CanvasGradient;
  currentAngle: number;
  update: () => void;
}

// ============================================================================
// HELPER FUNCTIONS (Faithful port from original)
// ============================================================================

/**
 * Generate end point based on length and angle
 * Ported directly from original lineToAngle function
 */
function lineToAngle(x1: number, y1: number, length: number, angle: number): [number, number] {
  const angleRad = (angle * Math.PI) / 180;
  const x2 = x1 + length * Math.cos(angleRad);
  const y2 = y1 + length * Math.sin(angleRad);
  return [x2, y2];
}

/**
 * Draw smooth curve through points using cardinal spline
 * Ported directly from original curve() prototype extension
 *
 * @param ctx - Canvas 2D context
 * @param pts - Array of points [x1, y1, x2, y2, ...]
 * @param ts - Tension (0-1, default 0.5)
 * @param nos - Number of segments (default 16)
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
      // Pre-calc steps
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
 * Ported directly from original grassObj function
 */
function createGrassObject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seg1: number,
  seg2: number,
  maxAngle: number,
  grassWidth: number,
  h: number,
  isNight: boolean
): GrassObject {
  // Internal state
  let counter = 0;
  let delta = 0;
  let angle = 0;
  let diff = 0;
  let goal = 0;

  // Ease in-out function (faithful port)
  function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  // Get random angle between 0 and maxAngle
  function getAngle(): number {
    return maxAngle * Math.random();
  }

  // Create gradient for this grass blade
  function getGradient(min: number, max: number, isNight: boolean): CanvasGradient {
    const g = ctx.createLinearGradient(0, 0, 0, h);

    if (!isNight) {
      // Day: original green
      g.addColorStop(1, `rgb(0,${Math.floor(min)},0)`);
      g.addColorStop(0, `rgb(0,${Math.floor(max)},0)`);
    } else {
      // Night: darker teal / blue-green
      const baseMin = Math.floor(min);
      const baseMax = Math.floor(max);
      g.addColorStop(1, `rgb(0,${Math.floor(baseMin * 0.6)},${Math.floor(baseMin * 0.9)})`);
      g.addColorStop(0, `rgb(0,${Math.floor(baseMax * 0.7)},${Math.floor(baseMax)})`);
    }

    return g;
  }

  // Set new goal for grass to move to
  function newGoal() {
    angle = goal;
    goal = getAngle();
    diff = goal - angle;
    counter = 0;
    delta = (4 * Math.random() + 1) / 100;
  }

  const gradient = getGradient(Math.random() * 50 + 50, 100 * Math.random() + 170, isNight);
  let currentAngle = 0;

  // Initialize
  newGoal();

  return {
    x,
    y,
    seg1,
    seg2,
    grassWidth,
    gradient,
    currentAngle,
    update() {
      counter += delta;

      if (counter > 1) {
        newGoal();
        return;
      }

      const t = easeInOut(counter);
      currentAngle = angle + t * diff;
      this.currentAngle = currentAngle;
    },
  };
}

/**
 * Create all grass blades
 * Ported directly from original makeGrass function
 */
function makeGrass(
  ctx: CanvasRenderingContext2D,
  numOfGrass: number,
  width: number,
  height: number,
  hVariation: number,
  grassWidth: number,
  canvasHeight: number,
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

    grass.push(createGrassObject(ctx, x, y, seg1, seg2, maxAngle, grassWidth, canvasHeight, isNight));
  }

  return grass;
}

/**
 * Render all grass blades
 * Ported directly from original renderGrass function
 */
function renderGrass(ctx: CanvasRenderingContext2D, grass: GrassObject[], w: number, h: number): void {
  // Clear canvas with transparency (no background image)
  ctx.clearRect(0, 0, w, h);

  // Render each grass blade
  for (let i = 0; i < grass.length; i++) {
    const gr = grass[i];
    const x = gr.x;
    const y = gr.y;
    const gw = gr.grassWidth;

    ctx.beginPath();

    const pos = lineToAngle(x, h, y, gr.currentAngle + 225);
    const diff = pos[0] - x;

    // Build the grass blade shape (faithful port)
    const pts: number[] = [];

    // Bottom left
    pts.push(x);
    pts.push(h);

    // Lower segment
    pts.push(x + diff / 4);
    pts.push(h - gr.seg1);

    // Middle segment
    pts.push(x + (diff / 3) * 2);
    pts.push(h - gr.seg2);

    // Top point
    pts.push(pos[0]);
    pts.push(pos[1]);

    // Middle segment (right side)
    pts.push(x + (diff / 3) * 2 + gw * 0.5);
    pts.push(h - gr.seg2);

    // Lower segment (right side)
    pts.push(x + diff / 4 + gw * 0.6);
    pts.push(h - gr.seg1 + 10);

    // Bottom right
    pts.push(x + gw);
    pts.push(h);

    // Draw smooth curve through points
    drawCurve(ctx, pts, 0.8, 5);

    ctx.closePath();

    // Fill with gradient
    ctx.fillStyle = gr.gradient;
    ctx.fill();
  }
}

// ============================================================================
// GRASS LAYER COMPONENT
// ============================================================================

interface GrassLayerProps {
  grassCount: number;
  grassHeightFactor: number;
  fps: number;
  isNight: boolean;
}

function GrassLayer({ grassCount, grassHeightFactor, fps, isNight }: GrassLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grassRef = useRef<GrassObject[]>([]);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Store context in a const that TypeScript knows is non-null
    const ctx: CanvasRenderingContext2D = context;

    // Capture canvas dimensions in variables for the closure
    let w = canvas.width;
    let h = canvas.height;

    // Set canvas size based on container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Update dimensions
      w = canvas.width;
      h = canvas.height;

      // Regenerate grass with new dimensions
      grassRef.current = makeGrass(ctx, grassCount, w, h * grassHeightFactor, 0.3, 12, h, isNight);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop with FPS throttling
    function animate(time: number) {
      const frameInterval = 1000 / fps;

      if (time - lastTimeRef.current < frameInterval) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }

      lastTimeRef.current = time;

      // Update each grass object
      for (let i = 0; i < grassRef.current.length; i++) {
        grassRef.current[i].update();
      }

      // Render (ctx, canvas, w, h are guaranteed non-null in this closure)
      renderGrass(ctx, grassRef.current, w, h);

      animationIdRef.current = requestAnimationFrame(animate);
    }

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [grassCount, grassHeightFactor, fps, isNight]);

  return (
    <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// ============================================================================
// MAIN MIDGROUND LAYER
// ============================================================================

interface MidgroundLayerProps {
  grassCount: number;
  grassHeightFactor: number;
  fps: number;
  isNight: boolean;
}

export function MidgroundLayer({ grassCount, grassHeightFactor, fps, isNight }: MidgroundLayerProps) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Foreground tree silhouettes */}
      <div className="absolute inset-x-0 bottom-0 h-1/2">
      </div>

      {/* Waving grass now lives in the midground */}
      <GrassLayer
        grassCount={grassCount}
        grassHeightFactor={grassHeightFactor}
        fps={fps}
        isNight={isNight}
      />

      {/* Future: mushrooms, bushes, lanterns, etc. */}
      {/* TODO: Add animated tree components here */}
      {/* <AnimatedTree position="left" /> */}
      {/* <AnimatedTree position="right" /> */}

      {/* TODO: Add interactive bush components */}
      {/* <InteractiveBush position={{ x: 30, y: 80 }} /> */}

      {/* TODO: Add lantern components */}
      {/* <GlowingLantern position={{ x: 50, y: 70 }} /> */}
    </div>
  );
}
