import { BackgroundLayer } from './layers/BackgroundLayer';
import { MidgroundLayer } from './layers/MidgroundLayer';
import { SpiritLayer } from './layers/SpiritLayer';

interface SceneViewportProps {
  onSpiritClick: (id: string) => void;
}

export function SceneViewport({ onSpiritClick }: SceneViewportProps) {
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
          <BackgroundLayer />
          
          {/* Layer 2: Midground */}
          <MidgroundLayer />
          
          {/* Layer 3: Spirits */}
          <SpiritLayer onSpiritClick={onSpiritClick} />
        </div>
      </div>
    </div>
  );
}
