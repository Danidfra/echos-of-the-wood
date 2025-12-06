import { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';

/**
 * BackgroundLayer
 *
 * The deepest layer in the scene viewport.
 * Displays an enchanted forest background with:
 * - Gradient colors
 * - Animated waving grass (faithful port of Ken Fyrstenberg's algorithm)
 * - Configurable scene parameters via modal
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
  h: number
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
  function getGradient(min: number, max: number): CanvasGradient {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(1, `rgb(0,${Math.floor(min)},0)`);
    g.addColorStop(0, `rgb(0,${Math.floor(max)},0)`);
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

  const gradient = getGradient(Math.random() * 50 + 50, 100 * Math.random() + 170);
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
  canvasHeight: number
): GrassObject[] {
  const grass: GrassObject[] = [];
  const hf = height * hVariation;

  for (let i = 0; i < numOfGrass; i++) {
    const x = width * Math.random();
    const y = height - hf * Math.random();
    const seg1 = y / 3 + y * hVariation * Math.random() * 0.1;
    const seg2 = (y / 3) * 2 + y * hVariation * Math.random() * 0.1;
    const maxAngle = 15 * Math.random() + 50;

    grass.push(createGrassObject(ctx, x, y, seg1, seg2, maxAngle, grassWidth, canvasHeight));
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
}

function GrassLayer({ grassCount, grassHeightFactor, fps }: GrassLayerProps) {
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
      grassRef.current = makeGrass(ctx, grassCount, w, h * grassHeightFactor, 0.3, 12, h);
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
  }, [grassCount, grassHeightFactor, fps]);

  return (
    <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// ============================================================================
// CONFIGURATION MODAL
// ============================================================================

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  grassCount: number;
  setGrassCount: (value: number) => void;
  grassHeightFactor: number;
  setGrassHeightFactor: (value: number) => void;
  fps: number;
  setFps: (value: number) => void;
}

function ConfigModal({
  isOpen,
  onClose,
  grassCount,
  setGrassCount,
  grassHeightFactor,
  setGrassHeightFactor,
  fps,
  setFps,
}: ConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-forest-modal border border-spirit-muted/20 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-cinzel font-semibold text-spirit-light">Scene Configuration</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-spirit-muted hover:text-spirit-light transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 text-sm text-emerald-50">
          {/* Grass Density */}
          <div>
            <label className="flex justify-between mb-2">
              <span className="font-medium text-spirit-light">Grass density</span>
              <span className="text-spirit-glow font-mono">{grassCount}</span>
            </label>
            <input
              type="range"
              min={20}
              max={400}
              value={grassCount}
              onChange={(e) => setGrassCount(Number(e.target.value))}
              className="w-full h-2 bg-forest-dark rounded-lg appearance-none cursor-pointer accent-spirit-glow"
            />
            <div className="flex justify-between text-xs text-spirit-muted mt-1">
              <span>20</span>
              <span>400</span>
            </div>
          </div>

          {/* Grass Height */}
          <div>
            <label className="flex justify-between mb-2">
              <span className="font-medium text-spirit-light">Grass height</span>
              <span className="text-spirit-glow font-mono">{Math.round(grassHeightFactor * 100)}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={70}
              value={Math.round(grassHeightFactor * 100)}
              onChange={(e) => setGrassHeightFactor(Number(e.target.value) / 100)}
              className="w-full h-2 bg-forest-dark rounded-lg appearance-none cursor-pointer accent-spirit-glow"
            />
            <div className="flex justify-between text-xs text-spirit-muted mt-1">
              <span>10%</span>
              <span>70%</span>
            </div>
          </div>

          {/* FPS */}
          <div>
            <label className="flex justify-between mb-2">
              <span className="font-medium text-spirit-light">Animation FPS</span>
              <span className="text-spirit-glow font-mono">{fps}</span>
            </label>
            <input
              type="range"
              min={10}
              max={60}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="w-full h-2 bg-forest-dark rounded-lg appearance-none cursor-pointer accent-spirit-glow"
            />
            <div className="flex justify-between text-xs text-spirit-muted mt-1">
              <span>10 FPS</span>
              <span>60 FPS</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-spirit-glow/20 hover:bg-spirit-glow/30 text-spirit-light rounded-lg font-medium transition-colors border border-spirit-glow/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN BACKGROUND LAYER
// ============================================================================

export function BackgroundLayer() {
  // Configuration state
  const [grassCount, setGrassCount] = useState(150);
  const [grassHeightFactor, setGrassHeightFactor] = useState(0.4);
  const [fps, setFps] = useState(30);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="absolute inset-0 z-0">
      {/* Base gradient - deep forest atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-sky via-forest-canopy to-forest-floor" />

      {/* Ambient glow from below (forest floor bioluminescence) */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-spirit-glow/5 to-transparent" />

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-radial-vignette" />

      {/* Floating particles / fireflies in background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-spirit-glow rounded-full animate-float-slow opacity-20"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 50}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Waving grass layer */}
      <GrassLayer grassCount={grassCount} grassHeightFactor={grassHeightFactor} fps={fps} />

      {/* Configuration button */}
      <button
        type="button"
        className="absolute top-2 right-2 z-[60] rounded-full bg-black/40 text-emerald-100 px-3 py-1.5 text-xs hover:bg-black/60 transition-colors flex items-center gap-1.5 shadow-lg"
        onClick={() => setIsConfigOpen(true)}
      >
        <Settings className="w-3.5 h-3.5" />
        <span>Scene</span>
      </button>

      {/* Configuration modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        grassCount={grassCount}
        setGrassCount={setGrassCount}
        grassHeightFactor={grassHeightFactor}
        setGrassHeightFactor={setGrassHeightFactor}
        fps={fps}
        setFps={setFps}
      />
    </div>
  );
}
