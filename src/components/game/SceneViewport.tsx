import { useState, useEffect, useRef } from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { MidgroundLayer } from './layers/MidgroundLayer';
import { SpiritLayer, SpiritLayerHandle, SpiritClickPayload } from './layers/SpiritLayer';
import { getSpiritsByBehaviorAndRarity, ALL_RESOLVED_SPIRITS, getRandomSpirit } from '@/game/spirits/registry';
import { SpiritBehaviorType, SpiritRarity, ResolvedSpiritConfig } from '@/game/spirits/types';
import { RARITIES } from '@/game/spirits/rarities';
import { useGameCanvasMirror, SpiritPosition } from '@/hooks/useGameCanvasMirror';
import { GamePiPToggleButton } from './pip/GamePiPToggleButton';

/**
 * Determines if it's nighttime based on the user's local browser time.
 * Night is defined as hours before 6:00 AM or after 6:00 PM (18:00).
 *
 * @returns true if it's nighttime in the user's timezone, false otherwise
 */
function getInitialIsNight(): boolean {
  const now = new Date();
  const hour = now.getHours(); // 0-23, local time

  // Night from 18:00 (6 PM) to 6:00 (6 AM)
  const isNightTime = hour < 6 || hour >= 18;

  return isNightTime;
}

interface GrassSettings {
  grassCount: number;
  grassHeightFactor: number;
  fps: number;
}

interface AudioSettings {
  ambientVolume: number;      // 0-100
  isAmbientMuted: boolean;
}

const GRASS_SETTINGS_KEY = 'echosOfTheWood:grassSettings';
const AUDIO_SETTINGS_KEY = 'echosOfTheWood:audioSettings';

/**
 * Load grass settings from localStorage with fallback to defaults.
 * SSR-safe: returns defaults if window is undefined.
 */
function loadInitialGrassSettings(): GrassSettings {
  if (typeof window === 'undefined') {
    return {
      grassCount: 200,
      grassHeightFactor: 0.6,
      fps: 30,
    };
  }

  try {
    const raw = window.localStorage.getItem(GRASS_SETTINGS_KEY);
    if (!raw) {
      return {
        grassCount: 200,
        grassHeightFactor: 0.6,
        fps: 30,
      };
    }

    const parsed = JSON.parse(raw) as Partial<GrassSettings>;

    return {
      grassCount: typeof parsed.grassCount === 'number' ? parsed.grassCount : 200,
      grassHeightFactor:
        typeof parsed.grassHeightFactor === 'number' ? parsed.grassHeightFactor : 0.6,
      fps: typeof parsed.fps === 'number' ? parsed.fps : 30,
    };
  } catch {
    return {
      grassCount: 200,
      grassHeightFactor: 0.6,
      fps: 30,
    };
  }
}

/**
 * Load audio settings from localStorage with fallback to defaults.
 * SSR-safe: returns defaults if window is undefined.
 */
function loadInitialAudioSettings(): AudioSettings {
  if (typeof window === 'undefined') {
    return {
      ambientVolume: 60,
      isAmbientMuted: false,
    };
  }

  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) {
      return {
        ambientVolume: 60,
        isAmbientMuted: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<AudioSettings>;

    return {
      ambientVolume: typeof parsed.ambientVolume === 'number' ? parsed.ambientVolume : 60,
      isAmbientMuted: typeof parsed.isAmbientMuted === 'boolean' ? parsed.isAmbientMuted : false,
    };
  } catch {
    return {
      ambientVolume: 60,
      isAmbientMuted: false,
    };
  }
}

/**
 * All available behavior types for auto-spawn coverage tracking.
 */
const ALL_BEHAVIOR_TYPES: SpiritBehaviorType[] = [
  'simple-glow',
  'shy',
  'hunter',
  'curious',
  'rhythm',
  'echo',
  'orbit',
];

/**
 * Helper function to pick a random spirit for auto-spawn.
 * Prioritizes behaviors that haven't been seen yet to ensure coverage.
 *
 * @param seenBehaviors - Set of behaviors already spawned in this session
 * @returns A random spirit, biased towards unseen behaviors
 */
function pickRandomSpiritForAutoSpawn(seenBehaviors: Set<SpiritBehaviorType>): ResolvedSpiritConfig | undefined {
  // Find behaviors that haven't been seen yet
  const unseenBehaviors = ALL_BEHAVIOR_TYPES.filter(b => !seenBehaviors.has(b));

  let candidateSpirits: ResolvedSpiritConfig[];

  if (unseenBehaviors.length > 0) {
    // Bias towards unseen behaviors - pick a random unseen behavior
    const randomUnseenBehavior = unseenBehaviors[Math.floor(Math.random() * unseenBehaviors.length)];
    candidateSpirits = ALL_RESOLVED_SPIRITS.filter(s => s.behavior === randomUnseenBehavior);
  } else {
    // All behaviors have been seen - pick from all spirits
    candidateSpirits = ALL_RESOLVED_SPIRITS;
  }

  // Use weighted random selection based on rarity
  return getRandomSpirit(candidateSpirits);
}

interface SceneViewportProps {
  onSpiritClick?: (payload: SpiritClickPayload) => void;
}

export function SceneViewport({ onSpiritClick }: SceneViewportProps) {
  // Grass configuration state - persisted in localStorage
  const [grassSettings, setGrassSettings] = useState<GrassSettings>(() =>
    loadInitialGrassSettings()
  );

  // Audio configuration state - persisted in localStorage
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    loadInitialAudioSettings()
  );

  // Derive individual values for convenience
  const { grassCount, grassHeightFactor, fps } = grassSettings;
  const { ambientVolume, isAmbientMuted } = audioSettings;

  // isNight is initialized from the user's local time (browser).
  // On reload, it recalculates, but can be overridden via the Scene config toggle (dev helper).
  const [isNight, setIsNight] = useState<boolean>(() => getInitialIsNight());

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSpiritsDebugOpen, setIsSpiritsDebugOpen] = useState(false);

  // Spirits debug state
  const [selectedBehavior, setSelectedBehavior] = useState<SpiritBehaviorType>('simple-glow');
  const [selectedRarity, setSelectedRarity] = useState<SpiritRarity | 'all'>('all');
  const [isAutoSpawnDemoEnabled, setIsAutoSpawnDemoEnabled] = useState(false);

  // Ref to SpiritLayer for spawning spirits
  const spiritLayerRef = useRef<SpiritLayerHandle>(null);

  // Auto-spawn tracking refs
  const autoSpawnCountRef = useRef<number>(0);
  const seenBehaviorsRef = useRef<Set<SpiritBehaviorType>>(new Set());

  // PiP: Track spirit positions for canvas mirror
  const [spiritPositions, setSpiritPositions] = useState<SpiritPosition[]>([]);

  // PiP: Create canvas mirror and stream
  const { stream: pipStream } = useGameCanvasMirror({
    width: 1280,
    height: 720,
    isNight,
    spirits: spiritPositions,
    fps: 60, // Smooth 60 FPS for PiP
    grassCount,
    grassHeightFactor,
  });

  // PiP: Update spirit positions periodically for canvas mirror
  useEffect(() => {
    const intervalMs = Math.max(1000 / fps, 16);

    const updateInterval = setInterval(() => {
      const spirits = spiritLayerRef.current?.getSpirits() || [];
      const positions: SpiritPosition[] = spirits.map(spirit => ({
        x: spirit.x,
        y: spirit.y,
        size: spirit.config.size,
        hue: spirit.config.hue,
        behavior: spirit.config.behavior,
      }));
      setSpiritPositions(positions);
    }, intervalMs);

    return () => clearInterval(updateInterval);
  }, [fps]);

  // Persist grass settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GRASS_SETTINGS_KEY, JSON.stringify(grassSettings));
  }, [grassSettings]);

  // Persist audio settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
  }, [audioSettings]);

  /**
   * Auto-spawn demo system
   *
   * When enabled, spawns a random spirit every 40 seconds.
   * Ensures at least 5 spirits are spawned and that we get at least one of each behavior type.
   * Both behavior and rarity are chosen randomly from the registry.
   */
  useEffect(() => {
    // If auto-spawn is disabled, clear any interval and reset
    if (!isAutoSpawnDemoEnabled) {
      return;
    }

    // Reset tracking when auto-spawn is enabled
    autoSpawnCountRef.current = 0;
    seenBehaviorsRef.current = new Set();

    // Auto-spawn function
    const spawnRandomSpirit = () => {
      // Check if spiritLayerRef is ready
      if (!spiritLayerRef.current) {
        console.warn('[Auto-spawn] SpiritLayer not ready yet');
        return;
      }

      // Pick a random spirit with behavior coverage logic
      const spirit = pickRandomSpiritForAutoSpawn(seenBehaviorsRef.current);

      if (!spirit) {
        console.warn('[Auto-spawn] No spirit found to spawn');
        return;
      }

      // Spawn the spirit
      spiritLayerRef.current.spawnById(spirit.id);

      // Update tracking
      autoSpawnCountRef.current += 1;
      seenBehaviorsRef.current.add(spirit.behavior);

      console.log('[Auto-spawn]', {
        count: autoSpawnCountRef.current,
        spirit: spirit.displayName,
        behavior: spirit.behavior,
        rarity: spirit.rarity,
        seenBehaviors: Array.from(seenBehaviorsRef.current),
      });
    };

    // Spawn the first spirit immediately
    spawnRandomSpirit();

    // Set up interval to spawn every 40 seconds
    const intervalId = setInterval(() => {
      spawnRandomSpirit();
    }, 40_000); // 40 seconds

    // Cleanup: clear interval when component unmounts or auto-spawn is disabled
    return () => {
      clearInterval(intervalId);
    };
  }, [isAutoSpawnDemoEnabled]);

  // Internal handler for spirit clicks - logs and forwards to parent
  const handleSpiritClickInternal = (payload: SpiritClickPayload) => {
    // Basic debug log for now (will be used later for synchronization/badges)
    console.log('[Spirit Clicked]', {
      instanceId: payload.instanceId,
      configId: payload.configId,
      name: payload.config.displayName,
      rarity: payload.config.rarity,
    });

    if (onSpiritClick) {
      onSpiritClick(payload);
    }
  };

  // Get filtered spirits for debug modal
  const filteredSpirits = getSpiritsByBehaviorAndRarity(selectedBehavior, selectedRarity);

  const handleSpawnSpirit = (spiritId: string) => {
    spiritLayerRef.current?.spawnById(spiritId);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* 16:9 aspect ratio container */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-spirit-glow/20 shadow-2xl shadow-spirit-glow/10"
        style={{ paddingBottom: '56.25%' }} // 16:9 aspect ratio
      >
        {/* Absolute positioned content container */}
        <div className="absolute inset-0">
          {/* Layer 1: Background */}
          <BackgroundLayer
            isNight={isNight}
            ambientVolume={ambientVolume}
            isAmbientMuted={isAmbientMuted}
          />

          {/* Layer 2: Midground */}
          <MidgroundLayer
            grassCount={grassCount}
            grassHeightFactor={grassHeightFactor}
            fps={fps}
            isNight={isNight}
          />

          {/* Layer 3: Spirits */}
          <SpiritLayer ref={spiritLayerRef} onSpiritClick={handleSpiritClickInternal} />

          {/* Top-right controls container */}
          <div className="absolute top-2 right-2 z-40 flex items-center gap-2">
            {/* PiP Toggle Button */}
            <GamePiPToggleButton stream={pipStream} />

            {/* Spirits Debug Button */}
            <button
              type="button"
              className="rounded-full bg-black/40 text-emerald-100 px-3 py-1.5 text-xs hover:bg-black/60 transition-colors flex items-center gap-1.5 shadow-lg"
              onClick={() => setIsSpiritsDebugOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spirits</span>
            </button>

            {/* Scene Configuration Button */}
            <button
              type="button"
              className="rounded-full bg-black/40 text-emerald-100 px-3 py-1.5 text-xs hover:bg-black/60 transition-colors flex items-center gap-1.5 shadow-lg"
              onClick={() => setIsConfigOpen(true)}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Scene</span>
            </button>
          </div>

          {/* Scene Configuration Modal */}
          {isConfigOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-forest-modal border border-spirit-muted/20 rounded-xl shadow-2xl w-[90%] max-w-sm mx-4 p-6 max-h-[90%] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-cinzel font-semibold text-spirit-light">Scene Configuration</h2>
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
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

                <div className="flex-1 overflow-y-auto space-y-6 text-sm text-emerald-50">
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
                      onChange={(e) =>
                        setGrassSettings((prev) => ({
                          ...prev,
                          grassCount: Number(e.target.value),
                        }))
                      }
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
                      onChange={(e) =>
                        setGrassSettings((prev) => ({
                          ...prev,
                          grassHeightFactor: Number(e.target.value) / 100,
                        }))
                      }
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
                      onChange={(e) =>
                        setGrassSettings((prev) => ({
                          ...prev,
                          fps: Number(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-forest-dark rounded-lg appearance-none cursor-pointer accent-spirit-glow"
                    />
                    <div className="flex justify-between text-xs text-spirit-muted mt-1">
                      <span>10 FPS</span>
                      <span>60 FPS</span>
                    </div>
                  </div>

                  {/* Day/Night Toggle */}
                  <div>
                    <label className="flex justify-between items-center mb-2">
                      <span className="font-medium text-spirit-light">Time of day</span>
                      <span className="text-spirit-glow font-mono">{isNight ? 'Night' : 'Day'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsNight(!isNight)}
                      className="w-full px-4 py-2 bg-spirit-glow/10 hover:bg-spirit-glow/20 text-spirit-light rounded-lg font-medium transition-colors border border-spirit-glow/30 flex items-center justify-center gap-2"
                    >
                      {isNight ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                          </svg>
                          Switch to Day
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                          </svg>
                          Switch to Night
                        </>
                      )}
                    </button>
                  </div>

                  {/* Ambient Volume */}
                  <div>
                    <label className="flex justify-between mb-2">
                      <span className="font-medium text-spirit-light">Ambient volume</span>
                      <span className="text-spirit-glow font-mono">{ambientVolume}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ambientVolume}
                      onChange={(e) =>
                        setAudioSettings((prev) => ({
                          ...prev,
                          ambientVolume: Number(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-forest-dark rounded-lg appearance-none cursor-pointer accent-spirit-glow"
                    />
                    <div className="flex justify-between text-xs text-spirit-muted mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Mute Toggle */}
                  <div>
                    <label className="flex justify-between items-center mb-2">
                      <span className="font-medium text-spirit-light">Mute ambient sound</span>
                      <span className="text-spirit-glow font-mono">{isAmbientMuted ? 'Muted' : 'Playing'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAudioSettings((prev) => ({
                          ...prev,
                          isAmbientMuted: !prev.isAmbientMuted,
                        }))
                      }
                      className="w-full px-4 py-2 bg-spirit-glow/10 hover:bg-spirit-glow/20 text-spirit-light rounded-lg font-medium transition-colors border border-spirit-glow/30 flex items-center justify-center gap-2"
                    >
                      {isAmbientMuted ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
                            <line x1="22" x2="16" y1="9" y2="15" />
                            <line x1="16" x2="22" y1="9" y2="15" />
                          </svg>
                          Unmute
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
                            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                          </svg>
                          Mute
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="px-6 py-2 bg-spirit-glow/20 hover:bg-spirit-glow/30 text-spirit-light rounded-lg font-medium transition-colors border border-spirit-glow/30"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Spirits Debug Modal */}
          {isSpiritsDebugOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-forest-modal border border-spirit-muted/20 rounded-xl shadow-2xl w-[90%] max-w-2xl mx-4 p-6 max-h-[90%] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-cinzel font-semibold text-spirit-light">Spirits Debug</h2>
                  <button
                    type="button"
                    onClick={() => setIsSpiritsDebugOpen(false)}
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

                {/* Filters */}
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Behavior filter */}
                    <div>
                      <label className="block text-sm font-medium text-spirit-light mb-2">
                        Behavior
                      </label>
                      <select
                        value={selectedBehavior}
                        onChange={(e) => setSelectedBehavior(e.target.value as SpiritBehaviorType)}
                        className="w-full px-3 py-2 bg-forest-dark text-spirit-light rounded-lg border border-spirit-muted/20 focus:outline-none focus:ring-2 focus:ring-spirit-glow/50"
                      >
                        <option value="simple-glow">Simple Glow</option>
                        <option value="shy">Shy</option>
                        <option value="hunter">Hunter</option>
                        <option value="curious">Curious</option>
                        <option value="rhythm">Rhythm</option>
                        <option value="echo">Echo</option>
                        <option value="orbit">Orbit</option>
                        {/* Future behaviors will appear here automatically */}
                      </select>
                    </div>

                    {/* Rarity filter */}
                    <div>
                      <label className="block text-sm font-medium text-spirit-light mb-2">
                        Rarity
                      </label>
                      <select
                        value={selectedRarity}
                        onChange={(e) => setSelectedRarity(e.target.value as SpiritRarity | 'all')}
                        className="w-full px-3 py-2 bg-forest-dark text-spirit-light rounded-lg border border-spirit-muted/20 focus:outline-none focus:ring-2 focus:ring-spirit-glow/50"
                      >
                        <option value="all">All</option>
                        <option value="common">Common</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="rare">Rare</option>
                        <option value="mythic">Mythic</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto-spawn demo toggle */}
                  <div className="pt-4 border-t border-spirit-muted/20">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="auto-spawn-demo"
                        checked={isAutoSpawnDemoEnabled}
                        onChange={(e) => setIsAutoSpawnDemoEnabled(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-spirit-muted/30 bg-forest-dark text-spirit-glow focus:ring-2 focus:ring-spirit-glow/50 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="auto-spawn-demo"
                          className="block text-sm font-medium text-spirit-light cursor-pointer"
                        >
                          Auto-spawn demo spirits
                        </label>
                        <p className="text-xs text-spirit-muted mt-1">
                          Every 40 seconds, spawn a random spirit for debugging/demo. Ensures at least one of each behavior type.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spirits list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {filteredSpirits.length === 0 ? (
                    <p className="text-center text-spirit-muted py-8">No spirits found</p>
                  ) : (
                    filteredSpirits.map((spirit) => {
                      const rarityDef = RARITIES[spirit.rarity];
                      return (
                        <div
                          key={spirit.id}
                          className="bg-forest-dark/50 border border-spirit-muted/20 rounded-lg p-4 hover:border-spirit-glow/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-spirit-light">{spirit.displayName}</h3>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `hsl(${spirit.hue}, 50%, 20%)`,
                                    color: `hsl(${spirit.hue}, 80%, 80%)`,
                                    border: `1px solid hsl(${spirit.hue}, 60%, 40%)`,
                                  }}
                                >
                                  {rarityDef.label}
                                </span>
                              </div>
                              <p className="text-xs text-spirit-muted mb-2">ID: {spirit.id}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-spirit-muted">
                                <div>Speed: <span className="text-spirit-light">{spirit.speed.toFixed(2)}x</span></div>
                                <div>Size: <span className="text-spirit-light">{spirit.size}px</span></div>
                                <div>Lifetime: <span className="text-spirit-light">{(spirit.lifetimeMs / 1000).toFixed(1)}s</span></div>
                                <div>Connections: <span className="text-spirit-light">{spirit.connectionsRequired}</span></div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSpawnSpirit(spirit.id)}
                              className="px-4 py-2 bg-spirit-glow/20 hover:bg-spirit-glow/30 text-spirit-light rounded-lg font-medium transition-colors border border-spirit-glow/30 text-sm whitespace-nowrap"
                            >
                              Spawn
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSpiritsDebugOpen(false)}
                    className="px-6 py-2 bg-spirit-glow/20 hover:bg-spirit-glow/30 text-spirit-light rounded-lg font-medium transition-colors border border-spirit-glow/30"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
