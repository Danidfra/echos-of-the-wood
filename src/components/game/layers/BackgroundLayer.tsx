/**
 * BackgroundLayer
 * 
 * The deepest layer in the scene viewport.
 * Displays a static enchanted forest background with gradient colors.
 * 
 * Future enhancements:
 * - Day/night cycle with dynamic gradients
 * - Animated starfield at night
 * - Weather effects (mist, rain particles)
 * - Parallax scrolling for depth
 */

export function BackgroundLayer() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Base gradient - deep forest atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-sky via-forest-canopy to-forest-floor" />
      
      {/* Ambient glow from below (forest floor bioluminescence) */}

      
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
    </div>
  );
}
