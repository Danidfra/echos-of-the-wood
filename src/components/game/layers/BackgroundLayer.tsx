/**
 * BackgroundLayer
 *
 * The deepest layer in the scene viewport.
 * Displays an enchanted forest background with:
 * - Gradient colors
 * - Floating fireflies
 */

export function BackgroundLayer() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Base gradient - deep forest atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-sky via-forest-canopy to-forest-floor" />

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
    </div>
  );
}
