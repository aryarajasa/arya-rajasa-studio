import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, projectsList } from '../content';

// Two projects on screen, advancing two at a time.
const VISIBLE = 2;
// How long a pair rests before sliding to the next one.
const DWELL_MS = 3000;
// Length of the slide itself. Kept under DWELL_MS so one transition finishes
// before the next is scheduled.
const SLIDE_MS = 400;
// Horizontal space between the two tiles, in px.
const GAP = 16;

export default function ProjectSlider({ items = projectsList }: { items?: Project[] }) {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  const count = items.length;
  const loops = count > VISIBLE;
  // A second copy of the list means sliding past the last pair still has tiles
  // to show; once the slide lands we jump back by `count` invisibly, so the
  // loop reads as continuous rather than rewinding.
  const track = loops ? [...items, ...items] : items;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  // Advance.
  useEffect(() => {
    if (!loops) return;
    const timer = setTimeout(() => setIndex((i) => i + VISIBLE), DWELL_MS);
    return () => clearTimeout(timer);
  }, [index, loops]);

  // Once a slide has carried us into the duplicated half, snap back to the
  // equivalent position in the first half with the transition switched off.
  useEffect(() => {
    if (!loops || index < count) return;
    const timer = setTimeout(() => {
      setAnimate(false);
      setIndex((i) => i - count);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, count, loops]);

  // Re-enable the transition only after the snap has painted, or the jump back
  // would animate as a visible rewind.
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

  if (count === 0) return null;

  const tileWidth = width ? (width - GAP * (VISIBLE - 1)) / VISIBLE : 0;
  const offset = index * (tileWidth + GAP);

  return (
    <div ref={viewportRef} className="w-full h-full overflow-hidden">
      <div
        className="flex h-full"
        style={{
          gap: GAP,
          transform: `translate3d(${-offset}px, 0, 0)`,
          transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.85, 0, 0.15, 1)` : 'none',
        }}
      >
        {track.map((project, i) => (
          <div
            key={`${project.slug}-${i}`}
            className="shrink-0 h-full flex flex-col gap-2 cursor-pointer select-none"
            style={{ width: tileWidth || undefined }}
            onClick={() => navigate(`/project/${project.slug}`)}
          >
            <div className="flex items-baseline gap-6 shrink-0">
              <span className="text-neutral-900 shrink-0">{project.name}</span>
              <span className="text-neutral-400 truncate">{project.details}</span>
            </div>
            <div className="flex-1 min-h-0 bg-[#e5e5e5] overflow-hidden">
              {project.image && (
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover"
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
