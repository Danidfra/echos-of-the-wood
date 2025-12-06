/**
 * MidgroundLayer
 * 
 * The middle layer in the scene viewport.
 * Contains interactive environmental elements between the background and spirits.
 * 
 * Current implementation:
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

export function MidgroundLayer() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Foreground tree silhouettes */}
      <div className="absolute inset-x-0 bottom-0 h-1/2">
        {/* Left tree cluster */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMinYMax meet" 
          className="absolute left-0 bottom-0 h-full w-1/4 opacity-70"
        >
          <path 
            d="M0,100 L0,60 Q5,40 10,55 Q12,30 18,50 Q20,35 25,55 Q28,45 30,60 L30,100 Z" 
            fill="currentColor" 
            className="text-forest-tree"
          />
        </svg>
        
        {/* Right tree cluster */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMaxYMax meet" 
          className="absolute right-0 bottom-0 h-full w-1/4 opacity-70"
        >
          <path 
            d="M70,100 L70,55 Q75,40 80,50 Q82,25 88,45 Q90,35 95,50 Q98,45 100,60 L100,100 Z" 
            fill="currentColor" 
            className="text-forest-tree"
          />
        </svg>
      </div>
      
      {/* Ground vegetation / grass hints */}
      <div className="absolute inset-x-0 bottom-0 h-8">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-ground/80 to-transparent" />
      </div>
      
      {/* Placeholder: Glowing mushroom spots (will be interactive later) */}
      <div className="absolute bottom-4 left-[15%] w-2 h-2 rounded-full bg-spirit-glow/20 blur-sm" />
      <div className="absolute bottom-6 right-[20%] w-1.5 h-1.5 rounded-full bg-spirit-glow/15 blur-sm" />
      <div className="absolute bottom-3 left-[60%] w-1 h-1 rounded-full bg-spirit-glow/10 blur-sm" />
      
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
