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
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-spirit-glow/5 to-transparent" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-radial-vignette" />
      
      {/* Distant tree silhouettes */}
      <div className="absolute inset-x-0 bottom-0 h-2/3">
        {/* Tree layer 1 - furthest */}
        <svg 
          viewBox="0 0 100 50" 
          preserveAspectRatio="none" 
          className="absolute inset-x-0 bottom-0 h-full w-full opacity-30"
        >
          <path 
            d="M0,50 L0,35 Q5,20 10,35 Q15,15 20,30 Q25,10 30,25 Q35,5 40,30 Q45,15 50,25 Q55,8 60,30 Q65,12 70,28 Q75,18 80,32 Q85,22 90,35 Q95,25 100,35 L100,50 Z" 
            fill="currentColor" 
            className="text-forest-silhouette"
          />
        </svg>
        
        {/* Tree layer 2 - closer */}
        <svg 
          viewBox="0 0 100 50" 
          preserveAspectRatio="none" 
          className="absolute inset-x-0 bottom-0 h-3/4 w-full opacity-50"
        >
          <path 
            d="M0,50 L0,40 Q8,25 15,38 Q22,12 30,35 Q38,20 45,32 Q52,8 60,28 Q68,18 75,35 Q82,25 90,38 Q95,30 100,40 L100,50 Z" 
            fill="currentColor" 
            className="text-forest-silhouette"
          />
        </svg>
      </div>
      
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
