import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoaderProps {
  onComplete: () => void;
  key?: string;
}

// High-density tonal character ramp for video rendering
const ASCII_RAMP = "  ..::--==++**##%%@@88&&WW";

interface SpreadParticle {
  id: number;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  fontSize: number;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [asciiFrame, setAsciiFrame] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isSpreading, setIsSpreading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);

  // Generate radial spreading ASCII particles on exit (no blur, pure crisp fade)
  const spreadParticles: SpreadParticle[] = useMemo(() => {
    const chars = ['W', '&', '@', '#', '%', '*', '+', '=', '8', 'S', '$', '§', 'x', 's', 'o', 'v'];
    return Array.from({ length: 80 }, (_, i) => {
      const angle = (i / 80) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
      const speed = 160 + Math.random() * 300;
      return {
        id: i,
        char: chars[Math.floor(Math.random() * chars.length)],
        x: 50 + (Math.random() - 0.5) * 16,
        y: 50 + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: (Math.random() - 0.5) * 360,
        fontSize: Math.floor(Math.random() * 6) + 10,
      };
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Create offscreen canvas for frame sampling
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const ASCII_WIDTH = 64; // Monospace character width
    const CHAR_ASPECT = 0.52; // Height adjustment for non-square characters

    const renderLoop = () => {
      if (video && !video.paused && !video.ended && ctx) {
        const vWidth = video.videoWidth || 1;
        const vHeight = video.videoHeight || 1;

        const asciiHeight = Math.max(16, Math.round((vHeight / vWidth) * ASCII_WIDTH * CHAR_ASPECT));

        canvas.width = ASCII_WIDTH;
        canvas.height = asciiHeight;

        ctx.drawImage(video, 0, 0, ASCII_WIDTH, asciiHeight);
        const imgData = ctx.getImageData(0, 0, ASCII_WIDTH, asciiHeight);
        const data = imgData.data;

        let asciiStr = '';
        const rampLen = ASCII_RAMP.length;

        for (let y = 0; y < asciiHeight; y++) {
          let line = '';
          for (let x = 0; x < ASCII_WIDTH; x++) {
            const idx = (y * ASCII_WIDTH + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Luminance
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum < 20) {
              line += ' ';
            } else {
              const charIdx = Math.min(rampLen - 1, Math.floor((lum / 256) * rampLen));
              line += ASCII_RAMP[charIdx];
            }
          }
          asciiStr += line + (y < asciiHeight - 1 ? '\n' : '');
        }

        setAsciiFrame(asciiStr);

        // Update progress counter based on playback time
        if (video.duration && video.duration > 0) {
          const currentPercent = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
          setProgress(currentPercent);
        }
      }

      if (!hasFinishedRef.current) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    const triggerSpread = () => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      setProgress(100);
      setIsSpreading(true);

      setTimeout(() => {
        onComplete();
      }, 850);
    };

    video.addEventListener('play', () => {
      renderLoop();
    });

    video.addEventListener('ended', () => {
      triggerSpread();
    });

    // Fallback timer if video is stalled
    const fallbackTimer = setTimeout(() => {
      triggerSpread();
    }, 4800);

    video.play().catch(() => {
      setTimeout(triggerSpread, 2000);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearTimeout(fallbackTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isSpreading ? 0 : 1 }}
      transition={{ duration: 0.8, delay: 0.05, ease: 'easeOut' }}
      className="fixed inset-0 z-[9999] pointer-events-auto select-none overflow-hidden bg-black font-mono flex flex-col items-center justify-center"
    >
      {/* Hidden Video Source */}
      <video
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}loading.mp4`}
        muted
        playsInline
        autoPlay
        preload="auto"
        className="hidden"
      />

      {/* Main ASCII Video Matrix Container with Crisp Opacity Fade & Expansion (No Blur) */}
      <motion.div
        animate={
          isSpreading
            ? {
                scale: 1.45,
                opacity: 0,
                letterSpacing: '0.35em',
              }
            : {
                scale: 1,
                opacity: 1,
                letterSpacing: '0em',
              }
        }
        transition={{
          duration: 0.8,
          ease: [0.25, 1, 0.5, 1],
        }}
        className="relative flex flex-col items-center justify-center max-w-full max-h-full p-4"
      >
        <pre className="text-[6.5px] sm:text-[8px] md:text-[9.5px] lg:text-[11px] leading-[6.5px] sm:leading-[8px] md:leading-[9.5px] lg:leading-[11px] text-white tracking-tight font-medium select-none whitespace-pre text-center">
          {asciiFrame}
        </pre>

        {/* Loading text and 0-100% counter below the ASCII doves */}
        <motion.div
          animate={{ opacity: isSpreading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 flex items-center justify-center gap-3 text-neutral-400 font-mono text-[11px] md:text-[12px] tracking-wider select-none"
        >
          <span className="uppercase tracking-widest text-neutral-400">loading...</span>
          <span className="text-white font-medium min-w-[3ch] text-left">{progress}%</span>
        </motion.div>
      </motion.div>

      {/* Radial Spreading ASCII Shards (Crisp, No Blur, Opacity Fade) */}
      <AnimatePresence>
        {isSpreading && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            {spreadParticles.map((pt) => (
              <motion.span
                key={pt.id}
                initial={{
                  left: `${pt.x}%`,
                  top: `${pt.y}%`,
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                animate={{
                  x: pt.vx,
                  y: pt.vy,
                  opacity: 0,
                  scale: 1.4,
                  rotate: pt.rot,
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ fontSize: `${pt.fontSize}px` }}
                className="absolute font-mono text-white select-none pointer-events-none"
              >
                {pt.char}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
