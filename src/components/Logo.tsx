import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { content } from '../content';

// High-density tonal character ramp
const ASCII_RAMP = "  ..::--==++**##%%@@88&&WW";

const TARGET_TEXT = "disainer taik";
const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789©()[]{}<>@#$%&*+-=/*_~";
const HOLD_DURATION_MS = 3000;

interface LogoProps {
  isScrolled?: boolean;
}

export default function Logo({ isScrolled = false }: LogoProps) {
  const navigate = useNavigate();
  const [asciiFrame, setAsciiFrame] = useState<string>('');
  const [isEasterEgg, setIsEasterEgg] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [isHolding, setIsHolding] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const scrambleIntervalRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);

  // Real-time canvas-to-ASCII player for the logo using loading.mp4
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const ASCII_WIDTH = 36; // Compact width for logo
    const CHAR_ASPECT = 0.52;

    const renderLoop = () => {
      if (video && !video.paused && ctx) {
        const vWidth = video.videoWidth || 1;
        const vHeight = video.videoHeight || 1;

        const asciiHeight = Math.max(12, Math.round((vHeight / vWidth) * ASCII_WIDTH * CHAR_ASPECT));

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
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum < 22) {
              line += ' ';
            } else {
              const charIdx = Math.min(rampLen - 1, Math.floor((lum / 256) * rampLen));
              line += ASCII_RAMP[charIdx];
            }
          }
          asciiStr += line + (y < asciiHeight - 1 ? '\n' : '');
        }

        setAsciiFrame(asciiStr);
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    video.addEventListener('play', () => {
      renderLoop();
    });

    video.play().catch(() => {});

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const triggerEasterEgg = () => {
    triggeredRef.current = true;
    setIsEasterEgg(true);
    setIsHolding(false);

    let frame = 0;
    const totalDuration = 1600;
    const intervalTime = 40;
    const totalFrames = totalDuration / intervalTime;

    if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);

    scrambleIntervalRef.current = window.setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      const scrambled = TARGET_TEXT.split("").map((char, i) => {
        if (char === " ") return " ";
        const charProgress = (i / TARGET_TEXT.length) * 0.85;
        if (progress >= charProgress) {
          return char;
        }
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join("");

      setDisplayText(scrambled);

      if (frame >= totalFrames) {
        if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
        setDisplayText(TARGET_TEXT);

        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = window.setTimeout(() => {
          setIsEasterEgg(false);
        }, 7000);
      }
    }, intervalTime);
  };

  const handlePointerDown = () => {
    triggeredRef.current = false;
    setIsHolding(true);

    holdTimerRef.current = window.setTimeout(() => {
      triggerEasterEgg();
    }, HOLD_DURATION_MS);
  };

  const handlePointerUp = () => {
    setIsHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (triggeredRef.current) {
      return;
    }

    if (isEasterEgg) {
      setIsEasterEgg(false);
      return;
    }

    navigate('/');
  };

  const handlePointerLeave = () => {
    setIsHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      className={`select-none cursor-pointer transition-all duration-300 ease-out flex items-center justify-center origin-center ${
        isHolding
          ? 'scale-95 opacity-80'
          : isScrolled
          ? 'scale-[0.65] md:scale-[0.68] hover:opacity-85 active:scale-[0.60]'
          : 'scale-100 hover:opacity-85 active:scale-95'
      }`}
      title={isEasterEgg ? "click to restore" : content.site.title}
    >
      {/* Hidden Video Source for Looping Logo Dove */}
      <video
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}loading.mp4`}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="hidden"
      />

      {isEasterEgg ? (
        <div className="flex flex-col items-center justify-center min-h-[44px] px-3 py-1.5 border border-dashed border-neutral-400/50 rounded-[2px] bg-neutral-100/50 dark:bg-neutral-900/50">
          <span className="font-mono text-[12px] md:text-[13px] text-neutral-900 tracking-wider font-semibold">
            {displayText}
          </span>
          <span className="text-[8.5px] text-neutral-400 tracking-tight mt-0.5">
            ( easter egg found )
          </span>
        </div>
      ) : (
        <pre
          aria-label={content.site.title}
          className="ascii-logo select-none pointer-events-none text-center"
        >
          {asciiFrame}
        </pre>
      )}
    </div>
  );
}
