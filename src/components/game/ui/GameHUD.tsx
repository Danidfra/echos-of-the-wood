import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/hooks/useTheme';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { User, Trophy, ArrowLeft, Sun, Moon } from 'lucide-react';

interface GameHUDProps {
  onAccountClick: () => void;
  onAchievementsClick: () => void;
}

export function GameHUD({ onAccountClick, onAchievementsClick }: GameHUDProps) {
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="relative z-30 flex items-center justify-between px-2 py-2 md:px-4 md:py-3">
      {/* Left side - Back button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-spirit-light/70 hover:text-spirit-light hover:bg-spirit-glow/10"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      {/* Center - Game title */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="font-cinzel text-lg md:text-xl text-spirit-light/80 tracking-wider">
          Echos of the Wood
        </h1>
      </div>

      {/* Right side - Auth and menu buttons */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            {/* Logged in state */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onAccountClick}
              className="text-spirit-light/70 hover:text-spirit-light hover:bg-spirit-glow/10"
            >
              <User className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Account</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAchievementsClick}
              className="text-spirit-light/70 hover:text-spirit-light hover:bg-spirit-glow/10"
            >
              <Trophy className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Achievements</span>
            </Button>
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-spirit-light/70 hover:text-spirit-light hover:bg-spirit-glow/10"
              aria-label={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </>
        ) : (
          /* Logged out state */
          <LoginArea className="max-w-48" />
        )}
      </div>
    </div>
  );
}
