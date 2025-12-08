/**
 * GamePiPToggleButton Component
 *
 * A toggle button for Picture-in-Picture mode in the game viewport.
 * Displays in the top-right corner of the game view (not the main HUD).
 */

import React, { useEffect } from 'react';
import { useGamePiP } from '@/hooks/useGamePiP';
import { PictureInPicture, PictureInPicture2, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GamePiPToggleButtonProps {
  /** MediaStream from the game canvas */
  stream: MediaStream | null;
  /** Optional callback when PiP state changes */
  onPiPChange?: (isActive: boolean) => void;
}

export function GamePiPToggleButton({ stream, onPiPChange }: GamePiPToggleButtonProps) {
  const { isSupported, isActive, isRequesting, error, attachStream, enterPiP, exitPiP } = useGamePiP();

  // Attach stream when it changes
  useEffect(() => {
    attachStream(stream);
  }, [stream, attachStream]);

  // Notify parent of PiP state changes
  useEffect(() => {
    if (onPiPChange) {
      onPiPChange(isActive);
    }
  }, [isActive, onPiPChange]);

  const handleClick = async () => {
    if (isActive) {
      await exitPiP();
    } else {
      await enterPiP();
    }
  };

  // Determine button state and styling
  const getButtonState = () => {
    if (!isSupported) {
      return {
        disabled: true,
        className: 'opacity-40 cursor-not-allowed',
        icon: <PictureInPicture className="w-4 h-4" />,
        tooltip: 'Picture-in-Picture is only available on Chrome, Edge, Brave, and Opera.',
      };
    }

    if (isRequesting) {
      return {
        disabled: true,
        className: 'opacity-70',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        tooltip: 'Entering Picture-in-Picture...',
      };
    }

    if (isActive) {
      return {
        disabled: false,
        className: 'bg-spirit-glow/30 hover:bg-spirit-glow/40 shadow-lg shadow-spirit-glow/20',
        icon: <PictureInPicture2 className="w-4 h-4" />,
        tooltip: 'Exit Picture-in-Picture',
      };
    }

    return {
      disabled: false,
      className: 'hover:bg-black/60',
      icon: <PictureInPicture className="w-4 h-4" />,
      tooltip: 'Enter Picture-in-Picture',
    };
  };

  const buttonState = getButtonState();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            disabled={buttonState.disabled}
            className={`
              rounded-full bg-black/40 text-emerald-100 p-2
              transition-all duration-200
              flex items-center justify-center
              shadow-lg
              ${buttonState.className}
            `}
            aria-label={buttonState.tooltip}
          >
            {buttonState.icon}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="bg-forest-modal border border-spirit-glow/30 text-spirit-light max-w-xs"
        >
          <p className="text-sm">{error || buttonState.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
