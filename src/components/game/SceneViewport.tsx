import { useState } from 'react';
import { Settings } from 'lucide-react';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { MidgroundLayer } from './layers/MidgroundLayer';
import { SpiritLayer } from './layers/SpiritLayer';

interface SceneViewportProps {
  onSpiritClick: (id: string) => void;
}

export function SceneViewport({ onSpiritClick }: SceneViewportProps) {
  // Scene configuration state
  const [grassCount, setGrassCount] = useState(150);
  const [grassHeightFactor, setGrassHeightFactor] = useState(0.4);
  const [fps, setFps] = useState(30);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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
            grassCount={grassCount}
            grassHeightFactor={grassHeightFactor}
            fps={fps}
          />

          {/* Layer 2: Midground */}
          <MidgroundLayer />

          {/* Layer 3: Spirits */}
          <SpiritLayer onSpiritClick={onSpiritClick} />

          {/* Scene Configuration Button */}
          <button
            type="button"
            className="absolute top-2 right-2 z-40 rounded-full bg-black/40 text-emerald-100 px-3 py-1.5 text-xs hover:bg-black/60 transition-colors flex items-center gap-1.5 shadow-lg"
            onClick={() => setIsConfigOpen(true)}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Scene</span>
          </button>

          {/* Scene Configuration Modal */}
          {isConfigOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-forest-modal border border-spirit-muted/20 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
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
                    onClick={() => setIsConfigOpen(false)}
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
