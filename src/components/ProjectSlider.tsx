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

  const loops = count >= 1;
  // 4-copy track ensures we always have surrounding items in both directions
  const track = loops ? [...items, ...items, ...items, ...items] : items;

  // Start at the second copy (index = count)
  const [index, setIndex] = useState(loops ? count : 0);
  const [animate, setAnimate] = useState(true);

  const isInteractingRef = useRef(false);
  const autoPlayTimerRef = useRef<number | null>(null);
  const wheelAccumulatorRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const WHEEL_THRESHOLD = 30;
  const WHEEL_COOLDOWN = 260; // ms cooldown between scroll steps

  // ResizeObserver to measure available viewport width
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  // Safe slide increment that normalizes index before stepping
  const slideBy = useCallback((step: number) => {
    if (!loops || count === 0) return;
    setIndex((prev) => {
      let current = prev;
      // If outside the middle [count, count * 2) zone, normalize first
      if (current >= count * 2) {
        current = current - count;
      } else if (current < count) {
        current = current + count;
      }
      return current + step;
    });
    setAnimate(true);
  }, [count, loops]);

  // Seamless boundary wrap when transition finishes
  const handleTransitionEnd = useCallback(() => {
    if (!loops || count === 0) return;

    if (index >= count * 2) {
      setAnimate(false);
      setIndex((i) => i - count);
    } else if (index < count) {
      setAnimate(false);
      setIndex((i) => i + count);
    }
  }, [index, count, loops]);

  // Re-enable CSS transition after instantaneous position snap
  useEffect(() => {
    if (animate) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setAnimate(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [animate]);

  // Auto-play interval
  useEffect(() => {
    if (!loops || count === 0) return;

    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    autoPlayTimerRef.current = window.setTimeout(() => {
      if (!isInteractingRef.current) {
        slideBy(1);
      }
    }, DWELL_MS);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [index, loops, count, slideBy]);

  // Mouse wheel & trackpad scroll handler
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !loops || count === 0) return;

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 3) return;

      e.preventDefault();
      e.stopPropagation();

      isInteractingRef.current = true;

      const now = Date.now();
      wheelAccumulatorRef.current += delta;

      if (
        now - lastWheelTimeRef.current > WHEEL_COOLDOWN &&
        Math.abs(wheelAccumulatorRef.current) >= WHEEL_THRESHOLD
      ) {
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
        wheelAccumulatorRef.current = 0;
        lastWheelTimeRef.current = now;

        slideBy(direction);

        // Resume auto-play after 3.5s of no scroll interaction
        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = window.setTimeout(() => {
          isInteractingRef.current = false;
          slideBy(1);
        }, DWELL_MS);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [loops, count, slideBy]);

  if (count === 0) return null;

  const tileWidth = width ? (width - GAP * (VISIBLE - 1)) / VISIBLE : 0;
  const offset = index * (tileWidth + GAP);

  return (
    <div
      ref={viewportRef}
      onMouseEnter={() => {
        // Pause temporarily on hover
        isInteractingRef.current = true;
      }}
      onMouseLeave={() => {
        // Resume auto-play on mouse leave
        isInteractingRef.current = false;
      }}
      className="w-full h-full overflow-hidden select-none"
    >
      <div
        className="flex h-full"
        onTransitionEnd={handleTransitionEnd}
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
                  alt={`${project.name} — ${project.details.replace(/[()]/g, '').trim() || 'Brand Design Visual System'}`}
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
