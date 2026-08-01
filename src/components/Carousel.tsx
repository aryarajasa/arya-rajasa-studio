import { useFrame } from '@react-three/fiber';
import { MutableRefObject, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Project } from '../content';
import GLImage from './GLImage';

// Shared, mutable interaction state written by the wrapper (drag / wheel) and
// read inside the render loop. Kept in a ref so the loop stays allocation-free.
export interface CarouselControl {
  dragDelta: number; // radians to spin this frame while dragging (1:1)
  wheel: number; // impulse accumulated from wheel events
  velocity: number; // eased momentum (drives fling + wheel inertia)
  dragging: boolean;
}

interface CarouselProps {
  items: Project[]; // projects to lay around the ring, in order
  radius?: number; // ring radius (camera sits at the centre)
  repeat?: number; // how many times to cycle the project list around the ring
  aspect?: number; // tile width : height (tile height is derived from this)
  gap?: number; // fraction of each slot left empty between tiles (0..1)
  control: MutableRefObject<CarouselControl>;
  onActive?: (index: number) => void;
  onSliding?: (sliding: boolean) => void;
}

// A project added in the admin has no thumbnail until one is uploaded.
// useTexture() throws on an empty URL and takes the whole <Canvas> down with
// it, so missing images fall back to a flat placeholder tile — the same grey
// the mobile list uses.
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="4" height="3"%3E%3Crect width="4" height="3" fill="%23e5e5e5"/%3E%3C/svg%3E';

const FRICTION = 0.94;
const SLIDING_THRESHOLD = 0.0015;
// Gentle idle spin so the ring stays alive when untouched (kept below the
// sliding threshold so it doesn't trigger the title scramble effect).
const IDLE_DRIFT = -0.0012;

// Bend a unit plane onto an arc of the cylinder so neighbouring planes tile
// into a smooth continuous wall instead of flat facets with wedge-shaped gaps.
// The arc is centred at (0, 0, -radius) — i.e. dead ahead of a camera that
// sits at the origin looking down -Z.
function createCurvedPlane(radius: number, arcAngle: number, height: number) {
  const geo = new THREE.PlaneGeometry(1, 1, 48, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i); // -0.5 .. 0.5 across the width
    const v = pos.getY(i); // -0.5 .. 0.5 across the height
    const a = u * arcAngle;
    pos.setXYZ(i, radius * Math.sin(a), v * height, -radius * Math.cos(a));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

const Carousel = ({
  items,
  radius = 2,
  repeat = 2,
  aspect = 4 / 3,
  gap = 0.05,
  control,
  onActive,
  onSliding,
}: CarouselProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const imageRefs = useRef<THREE.Mesh[]>([]);

  const baseImages = useMemo(() => items.map((p) => p.image || PLACEHOLDER_IMAGE), [items]);

  // Cycle the project list `repeat` times to get more, smaller tiles.
  const images = useMemo(
    () =>
      Array.from(
        { length: baseImages.length * repeat },
        (_, i) => baseImages[i % baseImages.length],
      ),
    [baseImages, repeat],
  );

  const count = images.length;
  const angleStep = (Math.PI * 2) / count;
  const arcAngle = angleStep * (1 - gap);
  const arcWidth = radius * arcAngle; // world-space tile width
  const height = arcWidth / aspect; // keep tiles at the requested aspect ratio

  const geometry = useMemo(
    () => createCurvedPlane(radius, arcAngle, height),
    [radius, arcAngle, height],
  );

  const rotRef = useRef(0);
  const lastActive = useRef(-1);
  const lastSliding = useRef(false);

  useFrame(() => {
    const c = control.current;

    // Resolve this frame's spin (v, radians) and keep momentum for fling.
    let v: number;
    if (c.dragging) {
      v = c.dragDelta;
      c.dragDelta = 0;
      if (v !== 0) c.velocity = v;
      else c.velocity *= FRICTION;
    } else {
      c.velocity += c.wheel;
      c.wheel = 0;
      c.velocity *= FRICTION;
      // Fall back to a slow idle spin once momentum has died down.
      v = Math.abs(c.velocity) > Math.abs(IDLE_DRIFT) ? c.velocity : IDLE_DRIFT;
    }

    rotRef.current += v;
    if (groupRef.current) groupRef.current.rotation.y = rotRef.current;

    // Feed the motion skew into every plane; find the one dead-ahead of the
    // camera (most negative world-Z, since the camera looks down -Z).
    let front = 0;
    let frontZ = Infinity;
    imageRefs.current.forEach((ref, i) => {
      if (!ref) return;
      // @ts-expect-error uniforms exist on the ShaderMaterial we assigned
      ref.material.uniforms.uScrollSpeed.value = -v;
      const worldZ = -radius * Math.cos(i * angleStep + rotRef.current);
      if (worldZ < frontZ) {
        frontZ = worldZ;
        front = i;
      }
    });

    if (front !== lastActive.current) {
      lastActive.current = front;
      // Map the ring slot back to the real project (the list is repeated).
      onActive?.(front % baseImages.length);
    }

    const sliding = c.dragging || Math.abs(c.velocity) > SLIDING_THRESHOLD;
    if (sliding !== lastSliding.current) {
      lastSliding.current = sliding;
      onSliding?.(sliding);
    }
  });

  return (
    <group ref={groupRef}>
      {images.map((url, index) => (
        <GLImage
          key={index}
          imageUrl={url}
          geometry={geometry}
          planeSize={[arcWidth, height]}
          // Arc geometry is pre-sized, so only rotate it into its ring slot.
          rotation={[0, index * angleStep, 0]}
          ref={(el) => {
            if (el) imageRefs.current[index] = el;
          }}
        />
      ))}
    </group>
  );
};

export default Carousel;
