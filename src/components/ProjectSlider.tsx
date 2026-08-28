import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, projectsList } from '../content';

// Two projects visible on desktop screen at a time
const VISIBLE = 2;
// How long a pair rests before auto-sliding to the next one
const DWELL_MS = 3600;
// Transition duration for the slide animation
const SLIDE_MS = 850;
// Fluid ease-out bezier curve
const SLIDE_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
// Horizontal space between tiles in px
const GAP = 48;

export default function ProjectSlider({ items = projectsList }: { items?: Project[] }) {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const count = items.length;

  const loops = count > VISIBLE;
  // Triple track allows infinite bidirectional scrolling (forward and backward)
  const track = loops ? [...items, ...items, ...items] : items;

  // Start at the middle duplicate if looping
  const [index, setIndex] = useState(loops ? count : 0);
  const [animate, setAnimate] = useState(true);

  const isInteractingRef = useRef(false);
  const autoPlayTimerRef = useRef<number | null>(null);
  const wheelAccumulatorRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const WHEEL_THRESHOLD = 35;
  const WHEEL_COOLDOWN = 280; // ms cooldown between scroll steps

  // ResizeObserver to measure available tile width
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  const slideBy = useCallback((step: number) => {
    setAnimate(true);
    setIndex((prev) => prev + step);
  }, []);

  // Auto-play interval (pauses when user is actively wheel-scrolling or hovering)
  useEffect(() => {
    if (!loops) return;

    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    autoPlayTimerRef.current = window.setTimeout(() => {
      if (!isInteractingRef.current) {
        slideBy(1);
      }
    }, DWELL_MS);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [index, loops, slideBy]);

  // Seamless boundary wrap without visible rewind
  useEffect(() => {
    if (!loops) return;

    if (index >= count * 2) {
      const snapTimer = setTimeout(() => {
        setAnimate(false);
        setIndex((i) => i - count);
      }, SLIDE_MS);
      return () => clearTimeout(snapTimer);
    }

    if (index < count) {
      const snapTimer = setTimeout(() => {
        setAnimate(false);
        setIndex((i) => i + count);
      }, SLIDE_MS);
      return () => clearTimeout(snapTimer);
    }
  }, [index, count, loops]);

  // Re-enable animation after instantaneous wrap snap
  useEffect(() => {
    if (animate) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animate]);

  // Mouse wheel scroll handler
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !loops) return;

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 3) return;

      // Prevent page scrolling while user is scrolling over the slider
      e.preventDefault();
      e.stopPropagation();

      isInteractingRef.current = true;

      const now = Date.now();
      wheelAccumulatorRef.current += delta;

      if (now - lastWheelTimeRef.current > WHEEL_COOLDOWN && Math.abs(wheelAccumulatorRef.current) >= WHEEL_THRESHOLD) {
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
        wheelAccumulatorRef.current = 0;
        lastWheelTimeRef.current = now;

        slideBy(direction);

        // Resume auto-play after 3 seconds of inactivity
        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = window.setTimeout(() => {
          isInteractingRef.current = false;
          slideBy(1);
        }, DWELL_MS);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [loops, slideBy]);

  if (count === 0) return null;

  const tileWidth = width ? (width - GAP * (VISIBLE - 1)) / VISIBLE : 0;
  const offset = index * (tileWidth + GAP);

  return (
    <div
      ref={viewportRef}
      onMouseEnter={() => { isInteractingRef.current = true; }}
      onMouseLeave={() => { isInteractingRef.current = false; }}
      className="w-full h-full overflow-hidden select-none"
    >
      <div
        className="flex h-full"
        style={{
          gap: GAP,
          transform: `translate3d(${-offset}px, 0, 0)`,
          transition: animate ? `transform ${SLIDE_MS}ms ${SLIDE_EASING}` : 'none',
        }}
      >
        {track.map((project, i) => (
          <div
            key={`${project.slug}-${i}`}
            className="shrink-0 h-full flex flex-col gap-2 cursor-pointer select-none group"
            style={{ width: tileWidth || undefined }}
            onClick={() => navigate(`/project/${project.slug}`)}
          >
            <div className="flex items-baseline gap-6 shrink-0">
              <span className="text-neutral-900 shrink-0 group-hover:text-neutral-500 transition-colors">
                {project.name}
              </span>
              <span className="text-neutral-400 truncate text-[11px]">
                {project.details}
              </span>
            </div>
            <div className="flex-1 min-h-0 bg-[#e5e5e5] overflow-hidden rounded-[2px]">
              {project.image && (
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                  draggable={false}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
