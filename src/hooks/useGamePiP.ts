/**
 * useGamePiP Hook
 *
 * Manages Picture-in-Picture (PiP) functionality for the game viewport.
 * Uses the browser's PiP API to display a floating mini-view of the game.
 *
 * Browser Support:
 * - Chrome/Chromium: ✅
 * - Edge: ✅
 * - Brave: ✅
 * - Opera: ✅
 * - Safari: ❌ (limited support)
 * - Firefox: ❌
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseGamePiPResult {
  /** Whether PiP is supported in the current browser */
  isSupported: boolean;
  /** Whether PiP is currently active */
  isActive: boolean;
  /** Whether we're in the process of entering PiP */
  isRequesting: boolean;
  /** Error message if PiP fails */
  error: string | null;
  /** Attach a MediaStream to the internal video element */
  attachStream: (stream: MediaStream | null) => void;
  /** Enter Picture-in-Picture mode */
  enterPiP: () => Promise<void>;
  /** Exit Picture-in-Picture mode */
  exitPiP: () => Promise<void>;
}

/**
 * Hook to manage Picture-in-Picture for game viewport.
 * Creates and manages a hidden video element that receives a MediaStream.
 */
export function useGamePiP(): UseGamePiPResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      // Check if PiP API is available
      const supported =
        typeof document !== 'undefined' &&
        'pictureInPictureEnabled' in document &&
        typeof HTMLVideoElement !== 'undefined' &&
        'requestPictureInPicture' in HTMLVideoElement.prototype;

      setIsSupported(supported);

      if (!supported) {
        setError(
          'Picture-in-Picture is not supported in your browser. Try Chrome, Edge, Brave, or Opera.'
        );
      }
    };

    checkSupport();
  }, []);

  // Create and setup the hidden video element
  useEffect(() => {
    if (!isSupported) return;

    // Create video element
    const video = document.createElement('video');
    video.muted = true; // Mute to avoid audio issues
    video.playsInline = true;
    video.autoplay = true;
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';

    // Append to body (hidden)
    document.body.appendChild(video);
    videoRef.current = video;

    // PiP event listeners
    const handleEnterPiP = () => {
      setIsActive(true);
      setIsRequesting(false);
      setError(null);
    };

    const handleLeavePiP = () => {
      setIsActive(false);
      setIsRequesting(false);
    };

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    // Cleanup
    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);

      // Stop all tracks in the stream
      if (video.srcObject && video.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }

      // Remove video element
      if (document.body.contains(video)) {
        document.body.removeChild(video);
      }

      videoRef.current = null;
    };
  }, [isSupported]);

  /**
   * Attach a MediaStream to the video element.
   * This should be called with the canvas.captureStream() result.
   */
  const attachStream = useCallback((stream: MediaStream | null) => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Stop previous stream if exists
    if (video.srcObject && video.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }

    // Attach new stream
    video.srcObject = stream;

    if (stream) {
      // Ensure video is playing
      video.play().catch(err => {
        console.warn('Failed to play video for PiP:', err);
        setError('Failed to prepare video stream for Picture-in-Picture.');
      });
    }
  }, []);

  /**
   * Enter Picture-in-Picture mode.
   */
  const enterPiP = useCallback(async () => {
    if (!isSupported) {
      setError(
        'Picture-in-Picture is not supported in your browser. Try Chrome, Edge, Brave, or Opera.'
      );
      return;
    }

    if (!videoRef.current) {
      setError('Video element not ready. Please try again.');
      return;
    }

    const video = videoRef.current;

    // Check if video has a stream
    if (!video.srcObject) {
      setError('No video stream available. Please ensure the game is running.');
      return;
    }

    // Check if already in PiP
    if (document.pictureInPictureElement === video) {
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      // Ensure video is ready
      if (video.readyState < 2) {
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video failed to load in time'));
          }, 5000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);

          // Also try playing the video to trigger loading
          video.play().catch(() => {
            // Ignore play errors, we just need metadata
          });
        });
      }

      // Request PiP
      await video.requestPictureInPicture();
    } catch (err) {
      console.error('Failed to enter PiP:', err);

      let errorMessage = 'Failed to enter Picture-in-Picture mode.';

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permission denied. Please allow Picture-in-Picture in your browser settings.';
        } else if (err.name === 'InvalidStateError') {
          errorMessage = 'Video is not ready. Please try again in a moment.';
        } else if (err.message) {
          errorMessage = `PiP error: ${err.message}`;
        }
      }

      setError(errorMessage);
      setIsRequesting(false);
    }
  }, [isSupported]);

  /**
   * Exit Picture-in-Picture mode.
   */
  const exitPiP = useCallback(async () => {
    if (!document.pictureInPictureElement) {
      return;
    }

    try {
      await document.exitPictureInPicture();
      setError(null);
    } catch (err) {
      console.error('Failed to exit PiP:', err);
      setError('Failed to exit Picture-in-Picture mode.');
    }
  }, []);

  return {
    isSupported,
    isActive,
    isRequesting,
    error,
    attachStream,
    enterPiP,
    exitPiP,
  };
}
