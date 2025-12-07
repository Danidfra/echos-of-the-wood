import florestDayImage from '@/assets/background/florest.png';
import florestNightImage from '@/assets/background/florest-night.png';

/**
 * BackgroundLayer
 *
 * The deepest layer in the scene viewport.
 * Displays an enchanted forest background with:
 * - Image backgrounds (day/night variants)
 * - Floating fireflies
 *
 * Future: Can be extended with seasonal variants (autumn, winter, etc.)
 */

// Background image mapping - makes it easy to add more variants
const BACKGROUNDS = {
  day: florestDayImage,
  night: florestNightImage,
  // Future variants:
  // autumn: florestAutumnImage,
  // winter: florestWinterImage,
  // magical: florestMagicalImage,
  // mountain: mountainImage,
} as const;

interface BackgroundLayerProps {
  isNight?: boolean;
}

export function BackgroundLayer({ isNight = false }: BackgroundLayerProps) {
  // Select the appropriate background image
  const backgroundImage = isNight ? BACKGROUNDS.night : BACKGROUNDS.day;

  return (
    <div className="absolute inset-0 z-0">
      {/* Background image - fills entire viewport with object-cover */}
      <img
        src={backgroundImage}
        alt={isNight ? 'Night forest background' : 'Day forest background'}
        className="absolute inset-0 w-full h-full object-cover"
      />

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
