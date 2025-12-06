import { RotateCcw } from 'lucide-react';

/**
 * RotateDeviceOverlay
 * 
 * Displays an overlay on mobile devices when in portrait orientation,
 * prompting the user to rotate their device for optimal gameplay.
 * 
 * Uses CSS media queries to show/hide based on orientation.
 */
export function RotateDeviceOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-forest-dark flex-col items-center justify-center gap-6 p-8 text-center portrait:flex hidden">
      {/* Animated rotation icon */}
      <div className="relative">
        <RotateCcw className="w-16 h-16 text-spirit-glow animate-spin-slow" />
        <div className="absolute inset-0 blur-xl bg-spirit-glow/30 rounded-full" />
      </div>
      
      {/* Message */}
      <div className="space-y-3">
        <h2 className="font-cinzel text-2xl text-spirit-light">
          Rotate Your Device
        </h2>
        <p className="font-cormorant text-lg text-spirit-light/70 max-w-xs">
          For the best experience exploring the enchanted forest, 
          please rotate your device to landscape mode.
        </p>
      </div>
      
      {/* Visual hint */}
      <div className="mt-4 flex items-center gap-2 text-spirit-muted">
        <div className="w-8 h-12 border-2 border-spirit-muted/50 rounded-md" />
        <span className="text-2xl">→</span>
        <div className="w-12 h-8 border-2 border-spirit-glow/50 rounded-md" />
      </div>
    </div>
  );
}
