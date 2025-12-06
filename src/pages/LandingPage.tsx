import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-forest-dark via-forest-mid to-forest-deep">
      {/* Animated floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-spirit-glow rounded-full animate-float opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle fog overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/50 via-transparent to-forest-dark/30 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Decorative element */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Sparkles className="w-12 h-12 text-spirit-glow animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-spirit-glow/30 rounded-full" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-cinzel text-5xl md:text-7xl font-bold text-spirit-light tracking-wide drop-shadow-lg">
            Echos of the Wood
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-spirit-glow/50" />
            <div className="w-2 h-2 rounded-full bg-spirit-glow animate-pulse" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-spirit-glow/50" />
          </div>

          {/* Description */}
          <p className="font-cormorant text-xl md:text-2xl text-spirit-light/80 leading-relaxed max-w-xl mx-auto">
            A calming exploration game where you observe, encounter, and interact 
            with small luminous spirits in an enchanted forest. Listen to the echoes, 
            be patient, and gradually form your own connection with the forest's inhabitants.
          </p>

          {/* Enter button */}
          <div className="pt-8">
            <Button
              onClick={() => navigate('/play')}
              size="lg"
              className="group relative px-10 py-6 text-lg font-cinzel bg-spirit-glow/20 hover:bg-spirit-glow/30 text-spirit-light border border-spirit-glow/40 hover:border-spirit-glow/60 transition-all duration-500 rounded-full shadow-lg shadow-spirit-glow/20 hover:shadow-spirit-glow/40"
            >
              <span className="relative z-10">Enter the Grove</span>
              <div className="absolute inset-0 rounded-full bg-spirit-glow/10 blur-md group-hover:blur-lg transition-all duration-500" />
            </Button>
          </div>

          {/* Subtle footer text */}
          <p className="text-spirit-muted text-sm font-cormorant italic pt-8">
            The spirits await your presence...
          </p>
        </div>
      </div>
    </div>
  );
}
