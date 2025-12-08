/**
 * useGameCanvasMirror Hook
 *
 * Creates and manages a canvas that mirrors the game viewport for PiP.
 * Draws a simplified representation of the game (background + spirits).
 */

import { useRef, useEffect, useState, useCallback } from 'react';

export interface SpiritPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // pixels
  hue: number; // HSL hue value
  behavior: string;
}

export interface GameCanvasMirrorOptions {
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Background color (day mode) */
  bgColorDay?: string;
  /** Background color (night mode) */
  bgColorNight?: string;
  /** Whether it's currently night */
  isNight?: boolean;
  /** Array of spirit positions to render */
  spirits?: SpiritPosition[];
  /** Frames per second for canvas updates */
  fps?: number;
}

/**
 * Hook to create and manage a canvas mirror of the game viewport.
 * Returns a canvas ref and a MediaStream for PiP.
 */
export function useGameCanvasMirror(options: GameCanvasMirrorOptions = {}) {
  const {
    width = 1280,
    height = 720,
    bgColorDay = '#1a3a2e',
    bgColorNight = '#0d1f1a',
    isNight = false,
    spirits = [],
    fps = 30,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'fixed';
    canvas.style.top = '-9999px';
    canvas.style.left = '-9999px';
    canvas.style.pointerEvents = 'none';

    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    // Create stream from canvas
    const canvasStream = canvas.captureStream(fps);
    setStream(canvasStream);

    return () => {
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop stream tracks
      canvasStream.getTracks().forEach(track => track.stop());

      // Remove canvas
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }

      canvasRef.current = null;
    };
  }, [width, height, fps]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    const bgColor = isNight ? bgColorNight : bgColorDay;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add gradient overlay for depth
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw spirits
    spirits.forEach(spirit => {
      const x = (spirit.x / 100) * canvas.width;
      const y = (spirit.y / 100) * canvas.height;
      const radius = spirit.size / 2;

      const hue = spirit.hue;

      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      glowGradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.4)`);
      glowGradient.addColorStop(0.5, `hsla(${hue}, 80%, 60%, 0.2)`);
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - radius * 3, y - radius * 3, radius * 6, radius * 6);

      // Draw spirit core
      const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGradient.addColorStop(0.3, `hsla(${hue}, 80%, 80%, 1)`);
      coreGradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 1)`);
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add game title overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Echos of the Wood', canvas.width / 2, 30);
  }, [isNight, bgColorDay, bgColorNight, spirits]);

  // Animation loop
  useEffect(() => {
    const frameInterval = 1000 / fps;

    const animate = (currentTime: number) => {
      // Throttle to target FPS
      const elapsed = currentTime - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        lastFrameTimeRef.current = currentTime - (elapsed % frameInterval);
        draw();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw, fps]);

  return {
    canvasRef,
    stream,
  };
}
