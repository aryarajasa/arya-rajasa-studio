import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import React, { Suspense, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Carousel, { CarouselControl } from './Carousel';
import ProjectTitle from './ProjectTitle';
import { projectsList, Project } from '../content';

// px → radians conversions for the two input modes (spin the ring).
const DRAG_FACTOR = 0.006;
const WHEEL_FACTOR = 0.0015;
// A pointer that moved less than this (px) counts as a click, not a drag.
const CLICK_SLOP = 8;

export default function CarouselSlider({ items = projectsList }: { items?: Project[] }) {
  const navigate = useNavigate();

  const control = useRef<CarouselControl>({
    dragDelta: 0,
    wheel: 0,
    velocity: 0,
    dragging: false,
  });
  const lastXRef = useRef(0);
  const dragDistRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const { progress } = useProgress();
  const isLoading = progress < 100;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    control.current.dragging = true;
    lastXRef.current = e.clientX;
    dragDistRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!control.current.dragging) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    dragDistRef.current += Math.abs(dx);
    control.current.dragDelta += dx * DRAG_FACTOR;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!control.current.dragging) return;
    control.current.dragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    // A click (rather than a drag) opens whichever project is front-and-centre.
    if (dragDistRef.current < CLICK_SLOP) {
      const target = items[activeIndex] ?? items[0];
      if (target) navigate(`/project/${target.slug}`);
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Horizontal scroll or vertical wheel both drive the strip.
    control.current.wheel += (e.deltaX + e.deltaY) * WHEEL_FACTOR;
  };

  const active = items[activeIndex] ?? items[0];

  // The admin UI allows deleting every project; render nothing rather than
  // building a ring with no textures.
  if (!active) return null;

  return (
    <div
      className="relative w-full h-full min-h-[55vh] select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <Canvas
        style={{ background: 'transparent' }}
        // Camera sits just inside the ring, pushed forward so the front arc
        // wraps closer around the viewer.
        camera={{ position: [0, 0, -0.35], fov: 55 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Carousel
            items={items}
            radius={1.5}
            repeat={2}
            aspect={4 / 3}
            gap={0.05}
            control={control}
            onActive={setActiveIndex}
            onSliding={setIsSliding}
          />
        </Suspense>
      </Canvas>

      {/* Active project title overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-8">
        <div className="flex items-baseline gap-8 lg:gap-16 text-white mix-blend-difference">
          <ProjectTitle originalText={active.name} isRandomizing={isSliding} />
          <span className="text-neutral-400">{active.details}</span>
        </div>
      </div>

      {/* Loading veil while textures decode */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-white transition-opacity duration-500 ${
          isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-neutral-400">loading…</span>
      </div>
    </div>
  );
}
