import { useState, useEffect, useRef } from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { MidgroundLayer } from './layers/MidgroundLayer';
import { SpiritLayer, SpiritLayerHandle } from './layers/SpiritLayer';
import { getSpiritsByBehaviorAndRarity } from '@/game/spirits/registry';
import { SpiritBehaviorType, SpiritRarity } from '@/game/spirits/types';
import { RARITIES } from '@/game/spirits/rarities';

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

const GRASS_SETTINGS_KEY = 'echosOfTheWood:grassSettings';

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

interface SceneViewportProps {
  onSpiritClick: (id: string) => void;
}

export function SceneViewport({ onSpiritClick }: SceneViewportProps) {
  // Grass configuration state - persisted in localStorage
  const [grassSettings, setGrassSettings] = useState<GrassSettings>(() =>
    loadInitialGrassSettings()
  );

  // Derive individual values for convenience
  const { grassCount, grassHeightFactor, fps } = grassSettings;

  // isNight is initialized from the user's local time (browser).
  // On reload, it recalculates, but can be overridden via the Scene config toggle (dev helper).
  const [isNight, setIsNight] = useState<boolean>(() => getInitialIsNight());

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSpiritsDebugOpen, setIsSpiritsDebugOpen] = useState(false);

  // Spirits debug state
  const [selectedBehavior, setSelectedBehavior] = useState<SpiritBehaviorType>('simple-glow');
  const [selectedRarity, setSelectedRarity] = useState<SpiritRarity | 'all'>('all');

  // Ref to SpiritLayer for spawning spirits
  const spiritLayerRef = useRef<SpiritLayerHandle>(null);

  // Persist grass settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GRASS_SETTINGS_KEY, JSON.stringify(grassSettings));
  }, [grassSettings]);

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
          <BackgroundLayer isNight={isNight} />

          {/* Layer 2: Midground */}
          <MidgroundLayer
            grassCount={grassCount}
            grassHeightFactor={grassHeightFactor}
            fps={fps}
            isNight={isNight}
          />

          {/* Layer 3: Spirits */}
          <SpiritLayer ref={spiritLayerRef} onSpiritClick={onSpiritClick} />

          {/* Debug buttons container */}
          <div className="absolute top-2 right-2 z-40 flex items-center gap-2">
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
